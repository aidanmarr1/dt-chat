import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { messages, users, reactions, readReceipts, linkPreviews, polls, pollVotes } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensurePollTables, ensureStatusColumn, ensureLinkPreviewTable } from "@/lib/init-tables";
import { desc, eq, gt, sql } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";
import { extractUrls, fetchOpenGraph } from "@/lib/og-utils";

const checkMessageRateLimit = createRateLimiter({ maxAttempts: 30, windowMs: 60 * 1000 });

// One-time backfill: fetch link previews for old messages that don't have them
let backfillDone = false;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Update caller's lastActiveAt
  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, user.id));

  // Get last 50 messages with user info
  const rows = await db
    .select({
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
      deletedAt: messages.deletedAt,
      pinnedAt: messages.pinnedAt,
      pinnedBy: messages.pinnedBy,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .orderBy(desc(messages.createdAt))
    .limit(50);

  // Get reply info for messages that have replyToId
  const replyIds = rows.filter((r) => r.replyToId).map((r) => r.replyToId!);
  const replyMap = new Map<string, { content: string; displayName: string; avatarId: string | null }>();

  if (replyIds.length > 0) {
    for (const replyId of replyIds) {
      const reply = await db
        .select({
          content: messages.content,
          displayName: users.displayName,
          avatarId: users.avatarId,
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.id, replyId))
        .get();
      if (reply) {
        replyMap.set(replyId, reply);
      }
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

  // Resolve display names for reaction users
  const reactionUserIds = [...new Set(allReactions.map((r) => r.userId))];
  const reactionUserNameMap = new Map<string, string>();
  for (const uid of reactionUserIds) {
    const u = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, uid)).get();
    if (u) reactionUserNameMap.set(uid, u.displayName);
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

  // Look up pinned-by display names
  const pinnerIds = [...new Set(rows.filter((r) => r.pinnedBy).map((r) => r.pinnedBy!))];
  const pinnerMap = new Map<string, string>();
  for (const pid of pinnerIds) {
    const u = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, pid)).get();
    if (u) pinnerMap.set(pid, u.displayName);
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

  // Ensure poll tables, status column, and link preview table exist
  await ensurePollTables();
  await ensureStatusColumn();
  await ensureLinkPreviewTable();

  // Enrich poll messages
  const pollMessageIds = rows
    .filter((r) => !r.deletedAt && r.content.startsWith("::poll::"))
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

        // Get voter names
        const voterIds = [...new Set(votes.map((v) => v.userId))];
        const voterNameMap = new Map<string, string>();
        for (const vid of voterIds) {
          const u = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, vid)).get();
          if (u) voterNameMap.set(vid, u.displayName);
        }

        const creatorUser = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, poll.createdBy)).get();

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
          createdAt: poll.createdAt instanceof Date ? poll.createdAt.toISOString() : String(poll.createdAt),
        });
      }
    } catch {
      // Poll tables may not exist yet — skip enrichment
    }
  }

  // Build response messages
  const responseMessages = rows.reverse().map((row) => {
    const reply = row.replyToId ? replyMap.get(row.replyToId) : null;
    const isDeleted = !!row.deletedAt;

    // Check if this is a poll message
    const pollId = !isDeleted && row.content.startsWith("::poll::") ? row.content.replace("::poll::", "") : null;
    const poll = pollId ? pollMap.get(pollId) ?? null : null;

    return {
      ...row,
      content: isDeleted ? "" : row.content,
      isDeleted,
      isPinned: !!row.pinnedAt,
      pinnedByName: row.pinnedBy ? (pinnerMap.get(row.pinnedBy) ?? null) : null,
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

  // One-time backfill: fetch previews for old messages missing them
  if (!backfillDone) {
    backfillDone = true;
    after(async () => {
      try {
        await ensureLinkPreviewTable();
        const candidates = await db
          .select({ id: messages.id, content: messages.content })
          .from(messages)
          .where(
            sql`${messages.content} LIKE '%http%' AND ${messages.deletedAt} IS NULL AND ${messages.id} NOT IN (SELECT DISTINCT ${linkPreviews.messageId} FROM ${linkPreviews})`
          )
          .limit(50);

        for (const msg of candidates) {
          const urls = extractUrls(msg.content);
          for (const url of urls.slice(0, 3)) {
            try {
              const og = await fetchOpenGraph(url);
              if (og) {
                await db.insert(linkPreviews).values({
                  id: crypto.randomUUID(),
                  messageId: msg.id,
                  url,
                  title: og.title || null,
                  description: og.description || null,
                  imageUrl: og.imageUrl || null,
                  siteName: og.siteName || null,
                  fetchedAt: new Date(),
                });
              }
            } catch {
              // skip
            }
          }
        }
      } catch {
        // If backfill fails, allow retry on next cold start
        backfillDone = false;
      }
    });
  }

  return NextResponse.json({
    messages: responseMessages,
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

  await db.insert(messages).values({
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
  await db
    .update(users)
    .set({ lastActiveAt: now, typingAt: null })
    .where(eq(users.id, user.id));

  // Schedule link preview fetching after response is sent (survives serverless shutdown)
  if (finalContent) {
    const urls = extractUrls(finalContent);
    if (urls.length > 0) {
      after(async () => {
        await ensureLinkPreviewTable();
        for (const url of urls.slice(0, 3)) {
          try {
            const og = await fetchOpenGraph(url);
            if (og) {
              await db.insert(linkPreviews).values({
                id: crypto.randomUUID(),
                messageId,
                url,
                title: og.title || null,
                description: og.description || null,
                imageUrl: og.imageUrl || null,
                siteName: og.siteName || null,
                fetchedAt: new Date(),
              });
            }
          } catch {
            // skip failed previews
          }
        }
      });
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
      reactions: [],
      editedAt: null,
      isDeleted: false,
      isPinned: false,
      pinnedByName: null,
      linkPreviews: [],
    },
  });
}
