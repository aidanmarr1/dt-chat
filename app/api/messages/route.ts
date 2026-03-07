import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users, reactions, readReceipts, linkPreviews, polls, pollVotes } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensurePollTables, ensureStatusColumn, ensureLinkPreviewTable, ensurePinLabelColumn } from "@/lib/init-tables";
import { desc, eq, gt, sql } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";
import { extractUrls, fetchOpenGraph } from "@/lib/og-utils";

const checkMessageRateLimit = createRateLimiter({ maxAttempts: 30, windowMs: 60 * 1000 });
const checkPollRateLimit = createRateLimiter({ maxAttempts: 60, windowMs: 60 * 1000 });


export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkPollRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // Ensure tables exist before querying
  await ensureLinkPreviewTable();
  await ensurePollTables();
  await ensureStatusColumn();
  await ensurePinLabelColumn();

  // Update caller's lastActiveAt
  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, user.id));

  // Check `since` param for efficient polling — if latest message hasn't changed, skip heavy query
  const since = req.nextUrl.searchParams.get("since");
  const before = req.nextUrl.searchParams.get("before");

  if (since && !before) {
    const latest = await db
      .select({ id: messages.id })
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(1)
      .get();

    if (latest && latest.id === since) {
      // Nothing changed — return lightweight response
      // Auto-clear expired statuses
      const now = new Date();
      await db
        .update(users)
        .set({ status: null, statusSetAt: null, statusExpiresAt: null })
        .where(sql`${users.statusExpiresAt} IS NOT NULL AND ${users.statusExpiresAt} < ${Math.floor(now.getTime() / 1000)}`);

      const thirtySecondsAgo = new Date(Date.now() - 30_000);
      const onlineUsers = await db
        .select({ id: users.id, displayName: users.displayName, avatarId: users.avatarId, status: users.status })
        .from(users)
        .where(gt(users.lastActiveAt, thirtySecondsAgo));

      const threeSecondsAgo = Date.now() - 3000;
      const typingRows = await db
        .select({ displayName: users.displayName })
        .from(users)
        .where(
          sql`${users.typingAt} > ${threeSecondsAgo} AND ${users.id} != ${user.id}`
        );

      return NextResponse.json({
        messages: null,
        onlineCount: onlineUsers.length,
        onlineUsers,
        typingUsers: typingRows.map((r) => r.displayName),
      });
    }
  }

  // Handle `before` cursor for loading older messages
  const isHistoryLoad = !!before;
  let beforeTimestamp: Date | null = null;
  if (before) {
    const beforeMsg = await db.select({ createdAt: messages.createdAt }).from(messages).where(eq(messages.id, before)).get();
    if (beforeMsg) {
      beforeTimestamp = beforeMsg.createdAt;
    }
  }

  // Get messages with user info (51 to detect hasMore)
  const queryLimit = 51;
  const selectFields = {
    id: messages.id,
    content: messages.content,
    createdAt: messages.createdAt,
    userId: messages.userId,
    displayName: users.displayName,
    avatarId: users.avatarId,
    fileName: messages.fileName,
    fileType: messages.fileType,
    fileSize: messages.fileSize,
    filePath: messages.filePath,
    replyToId: messages.replyToId,
    editedAt: messages.editedAt,
    pinnedAt: messages.pinnedAt,
    pinnedBy: messages.pinnedBy,
    pinLabel: messages.pinLabel,
  };

  const rows = beforeTimestamp
    ? await db
        .select(selectFields)
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(sql`${messages.createdAt} < ${beforeTimestamp}`)
        .orderBy(desc(messages.createdAt))
        .limit(queryLimit)
    : await db
        .select(selectFields)
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .orderBy(desc(messages.createdAt))
        .limit(queryLimit);

  const hasMore = rows.length === queryLimit;
  if (hasMore) rows.pop();

  // Get reply info for messages that have replyToId (batched)
  const replyIds = [...new Set(rows.filter((r) => r.replyToId).map((r) => r.replyToId!))];
  const replyMap = new Map<string, { content: string; displayName: string; avatarId: string | null }>();

  if (replyIds.length > 0) {
    const replyRows = await db
      .select({
        id: messages.id,
        content: messages.content,
        displayName: users.displayName,
        avatarId: users.avatarId,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(sql`${messages.id} IN (${sql.join(replyIds.map((id) => sql`${id}`), sql`, `)})`);
    for (const reply of replyRows) {
      replyMap.set(reply.id, { content: reply.content, displayName: reply.displayName, avatarId: reply.avatarId });
    }
  }

  // Get all reactions for these messages
  const messageIds = rows.map((r) => r.id);
  const allReactions =
    messageIds.length > 0
      ? await db.select().from(reactions).where(
          sql`${reactions.messageId} IN (${sql.join(
            messageIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
      : [];

  // Resolve display names for reaction users (batched)
  const reactionUserIds = [...new Set(allReactions.map((r) => r.userId))];
  const reactionUserNameMap = new Map<string, string>();
  if (reactionUserIds.length > 0) {
    const reactionUsers = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(sql`${users.id} IN (${sql.join(reactionUserIds.map((id) => sql`${id}`), sql`, `)})`);
    for (const u of reactionUsers) reactionUserNameMap.set(u.id, u.displayName);
  }

  // Group reactions by messageId + emoji
  const reactionMap = new Map<
    string,
    { emoji: string; count: number; reacted: boolean; reactedByNames: string[] }[]
  >();

  for (const r of allReactions) {
    const key = r.messageId;
    if (!reactionMap.has(key)) reactionMap.set(key, []);
    const arr = reactionMap.get(key)!;
    const existing = arr.find((a) => a.emoji === r.emoji);
    const name = reactionUserNameMap.get(r.userId) || "Unknown";
    if (existing) {
      existing.count++;
      existing.reactedByNames.push(name);
      if (r.userId === user.id) existing.reacted = true;
    } else {
      arr.push({ emoji: r.emoji, count: 1, reacted: r.userId === user.id, reactedByNames: [name] });
    }
  }

  // Look up pinned-by display names (batched)
  const pinnerIds = [...new Set(rows.filter((r) => r.pinnedBy).map((r) => r.pinnedBy!))];
  const pinnerMap = new Map<string, string>();
  if (pinnerIds.length > 0) {
    const pinnerUsers = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(sql`${users.id} IN (${sql.join(pinnerIds.map((id) => sql`${id}`), sql`, `)})`);
    for (const u of pinnerUsers) pinnerMap.set(u.id, u.displayName);
  }

  // Get all read receipts with user info
  const allReceipts = await db
    .select({
      userId: readReceipts.userId,
      lastReadMessageId: readReceipts.lastReadMessageId,
      displayName: users.displayName,
      avatarId: users.avatarId,
    })
    .from(readReceipts)
    .innerJoin(users, eq(readReceipts.userId, users.id));

  // Build a map: messageId -> array of readers
  const readByMap = new Map<string, { userId: string; displayName: string; avatarId: string | null }[]>();
  for (const r of allReceipts) {
    if (r.userId === user.id) continue; // Don't show own read receipt
    const key = r.lastReadMessageId;
    if (!readByMap.has(key)) readByMap.set(key, []);
    readByMap.get(key)!.push({ userId: r.userId, displayName: r.displayName, avatarId: r.avatarId });
  }

  // Get link previews for these messages
  const allLinkPreviews =
    messageIds.length > 0
      ? await db
          .select()
          .from(linkPreviews)
          .where(
            sql`${linkPreviews.messageId} IN (${sql.join(
              messageIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
      : [];

  const linkPreviewMap = new Map<
    string,
    { id: string; url: string; title: string | null; description: string | null; imageUrl: string | null; siteName: string | null }[]
  >();
  for (const lp of allLinkPreviews) {
    const key = lp.messageId;
    if (!linkPreviewMap.has(key)) linkPreviewMap.set(key, []);
    linkPreviewMap.get(key)!.push({
      id: lp.id,
      url: lp.url,
      title: lp.title,
      description: lp.description,
      imageUrl: lp.imageUrl,
      siteName: lp.siteName,
    });
  }


  // Enrich poll messages
  const pollMessageIds = rows
    .filter((r) => r.content.startsWith("::poll::"))
    .map((r) => r.content.replace("::poll::", ""));

  const pollMap = new Map<string, {
    id: string;
    question: string;
    options: { id: string; text: string; votes: number; voted: boolean; voterNames: string[] }[];
    totalVotes: number;
    createdBy: string;
    createdByName: string;
    createdAt: string;
  }>();

  if (pollMessageIds.length > 0) {
    try {
      for (const pollId of pollMessageIds) {
        const poll = await db.select().from(polls).where(eq(polls.id, pollId)).get();
        if (!poll) continue;

        const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId));
        const pollOptions: { id: string; text: string }[] = JSON.parse(poll.options);

        // Get voter + creator names (batched)
        const voterIds = [...new Set([...votes.map((v) => v.userId), poll.createdBy])];
        const voterNameMap = new Map<string, string>();
        if (voterIds.length > 0) {
          const voterUsers = await db
            .select({ id: users.id, displayName: users.displayName })
            .from(users)
            .where(sql`${users.id} IN (${sql.join(voterIds.map((id) => sql`${id}`), sql`, `)})`);
          for (const u of voterUsers) voterNameMap.set(u.id, u.displayName);
        }

        const creatorUser = { displayName: voterNameMap.get(poll.createdBy) || "Unknown" };

        const enrichedOptions = pollOptions.map((o) => {
          const optVotes = votes.filter((v) => v.optionId === o.id);
          return {
            id: o.id,
            text: o.text,
            votes: optVotes.length,
            voted: optVotes.some((v) => v.userId === user.id),
            voterNames: optVotes.map((v) => voterNameMap.get(v.userId) || "Unknown"),
          };
        });

        pollMap.set(pollId, {
          id: pollId,
          question: poll.question,
          options: enrichedOptions,
          totalVotes: votes.length,
          createdBy: poll.createdBy,
          createdByName: creatorUser?.displayName || "Unknown",
          createdAt: poll.createdAt instanceof Date ? poll.createdAt.toISOString() : new Date(Number(poll.createdAt) * 1000).toISOString(),
        });
      }
    } catch {
      // Poll tables may not exist yet — skip enrichment
    }
  }

  // Build response messages
  const responseMessages = rows.reverse().map((row) => {
    const reply = row.replyToId ? replyMap.get(row.replyToId) : null;
    // Check if this is a poll message
    const pollId = row.content.startsWith("::poll::") ? row.content.replace("::poll::", "") : null;
    const poll = pollId ? pollMap.get(pollId) ?? null : null;

    return {
      ...row,
      content: row.content,
      isPinned: !!row.pinnedAt,
      pinnedByName: row.pinnedBy ? (pinnerMap.get(row.pinnedBy) ?? null) : null,
      pinLabel: row.pinLabel ?? null,
      editedAt: row.editedAt ?? null,
      replyContent: reply?.content ?? null,
      replyDisplayName: reply?.displayName ?? null,
      replyAvatarId: reply?.avatarId ?? null,
      reactions: reactionMap.get(row.id) ?? [],
      readBy: readByMap.get(row.id) ?? [],
      linkPreviews: linkPreviewMap.get(row.id) ?? [],
      poll,
    };
  });

  // For history loads, return just messages + hasMore (skip online/typing)
  if (isHistoryLoad) {
    return NextResponse.json({
      messages: responseMessages,
      hasMore,
    });
  }

  // Auto-clear expired statuses (statusExpiresAt = null means "don't clear")
  const now = new Date();
  await db
    .update(users)
    .set({ status: null, statusSetAt: null, statusExpiresAt: null })
    .where(sql`${users.statusExpiresAt} IS NOT NULL AND ${users.statusExpiresAt} < ${Math.floor(now.getTime() / 1000)}`);

  // Get online users (active in last 30s)
  const thirtySecondsAgo = new Date(Date.now() - 30_000);
  const onlineUsers = await db
    .select({ id: users.id, displayName: users.displayName, avatarId: users.avatarId, status: users.status })
    .from(users)
    .where(gt(users.lastActiveAt, thirtySecondsAgo));

  // Get typing users (typingAt within last 3s, excluding self)
  const threeSecondsAgo = Date.now() - 3000;
  const typingRows = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(
      sql`${users.typingAt} > ${threeSecondsAgo} AND ${users.id} != ${user.id}`
    );

  return NextResponse.json({
    messages: responseMessages,
    hasMore,
    onlineCount: onlineUsers.length,
    onlineUsers,
    typingUsers: typingRows.map((r) => r.displayName),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkMessageRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
  }

  const body = await req.json();
  const { content, fileName, fileType, filePath, replyToId } = body;

  // Validate fileSize is a number (or coerce to null)
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : null;

  // Validate filePath is a genuine Vercel Blob URL (not an arbitrary attacker URL)
  if (filePath && typeof filePath === "string") {
    try {
      const fileUrl = new URL(filePath);
      const host = fileUrl.hostname.toLowerCase();
      if (
        host !== "blob.vercel-storage.com" &&
        !host.match(/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/)
      ) {
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }
  }

  // Validate fileName and fileType length
  if (fileName && typeof fileName === "string" && fileName.length > 255) {
    return NextResponse.json({ error: "File name too long" }, { status: 400 });
  }
  if (fileType && typeof fileType === "string" && fileType.length > 100) {
    return NextResponse.json({ error: "File type too long" }, { status: 400 });
  }

  // Validate replyToId references a real message
  if (replyToId) {
    if (typeof replyToId !== "string" || replyToId.length > 36) {
      return NextResponse.json({ error: "Invalid reply ID" }, { status: 400 });
    }
    const replyMsg = await db.select({ id: messages.id }).from(messages).where(eq(messages.id, replyToId)).get();
    if (!replyMsg) {
      return NextResponse.json({ error: "Reply target not found" }, { status: 404 });
    }
  }

  // Must have content or file
  const hasContent = content && typeof content === "string" && content.trim();
  const hasFile = fileName && filePath;

  if (!hasContent && !hasFile) {
    return NextResponse.json(
      { error: "Message content or file is required" },
      { status: 400 }
    );
  }

  if (hasContent && content.length > 2000) {
    return NextResponse.json(
      { error: "Message too long (max 2000 characters)" },
      { status: 400 }
    );
  }

  const finalContent = hasContent ? content.trim() : "";

  const messageId = crypto.randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(messages).values({
      id: messageId,
      content: finalContent,
      createdAt: now,
      userId: user.id,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      filePath: filePath || null,
      replyToId: replyToId || null,
    });

    // Update lastActiveAt and clear typing
    await tx
      .update(users)
      .set({ lastActiveAt: now, typingAt: null })
      .where(eq(users.id, user.id));
  });

  // Fetch link previews synchronously before responding
  const fetchedPreviews: { id: string; url: string; title: string | null; description: string | null; imageUrl: string | null; siteName: string | null }[] = [];
  if (finalContent) {
    const urls = extractUrls(finalContent);
    if (urls.length > 0) {
      await ensureLinkPreviewTable();
      for (const url of urls.slice(0, 3)) {
        try {
          const og = await fetchOpenGraph(url);
          if (og) {
            const previewId = crypto.randomUUID();
            await db.insert(linkPreviews).values({
              id: previewId,
              messageId,
              url,
              title: og.title || null,
              description: og.description || null,
              imageUrl: og.imageUrl || null,
              siteName: og.siteName || null,
              fetchedAt: new Date(),
            });
            fetchedPreviews.push({
              id: previewId,
              url,
              title: og.title || null,
              description: og.description || null,
              imageUrl: og.imageUrl || null,
              siteName: og.siteName || null,
            });
          }
        } catch {
          // skip failed previews
        }
      }
    }
  }

  return NextResponse.json({
    message: {
      id: messageId,
      content: finalContent,
      createdAt: now,
      userId: user.id,
      displayName: user.displayName,
      avatarId: user.avatarId ?? null,
      fileName: fileName || null,
      fileType: fileType || null,
      fileSize: fileSize || null,
      filePath: filePath || null,
      replyToId: replyToId || null,
      replyContent: null,
      replyDisplayName: null,
      replyAvatarId: null,
      reactions: [],
      editedAt: null,
      isPinned: false,
      pinnedByName: null,
      pinLabel: null,
      readBy: [],
      linkPreviews: fetchedPreviews,
      poll: null,
    },
  });
}
