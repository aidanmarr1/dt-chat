import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users, reactions, readReceipts, linkPreviews, polls, pollVotes } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensurePollTables, ensureStatusColumn } from "@/lib/init-tables";
import { desc, eq, gt, sql } from "drizzle-orm";

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<]+/g;
  const matches = text.match(urlRegex) || [];
  // Filter out Tenor GIF URLs since those render inline
  return matches.filter((url) => !url.includes("tenor.com/") && !url.includes("media.tenor.com/"));
}

async function fetchOpenGraph(url: string): Promise<{
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "bot" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const first8k = html.slice(0, 8000);

    const getMetaContent = (property: string): string | undefined => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        "i"
      );
      const match = first8k.match(regex);
      return match?.[1] || match?.[2] || undefined;
    };

    const title = getMetaContent("og:title") || first8k.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    const description = getMetaContent("og:description") || getMetaContent("description");
    const imageUrl = getMetaContent("og:image");
    const siteName = getMetaContent("og:site_name");

    if (!title && !description) return null;

    return { title, description, imageUrl, siteName };
  } catch {
    return null;
  }
}

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
  const replyMap = new Map<string, { content: string; displayName: string }>();

  if (replyIds.length > 0) {
    for (const replyId of replyIds) {
      const reply = await db
        .select({
          content: messages.content,
          displayName: users.displayName,
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

  // Group reactions by messageId + emoji
  const reactionMap = new Map<
    string,
    { emoji: string; count: number; reacted: boolean }[]
  >();

  for (const r of allReactions) {
    const key = r.messageId;
    if (!reactionMap.has(key)) reactionMap.set(key, []);
    const arr = reactionMap.get(key)!;
    const existing = arr.find((a) => a.emoji === r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === user.id) existing.reacted = true;
    } else {
      arr.push({ emoji: r.emoji, count: 1, reacted: r.userId === user.id });
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

  // Ensure poll tables and status column exist
  await ensurePollTables();
  await ensureStatusColumn();

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

  const body = await req.json();
  const { content, fileName, fileType, fileSize, filePath, replyToId } = body;

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

  const messageId = crypto.randomUUID();
  const now = new Date();

  await db.insert(messages).values({
    id: messageId,
    content: hasContent ? content.trim() : "",
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

  // Fire-and-forget: extract URLs and fetch link previews
  if (hasContent) {
    const urls = extractUrls(content.trim());
    if (urls.length > 0) {
      (async () => {
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
      })();
    }
  }

  return NextResponse.json({
    message: {
      id: messageId,
      content: hasContent ? content.trim() : "",
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
