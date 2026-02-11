import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users, reactions } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { desc, eq, gt, sql } from "drizzle-orm";

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

  // Build response messages
  const responseMessages = rows.reverse().map((row) => {
    const reply = row.replyToId ? replyMap.get(row.replyToId) : null;
    const isDeleted = !!row.deletedAt;
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
    };
  });

  // Get online users (active in last 30s)
  const thirtySecondsAgo = new Date(Date.now() - 30_000);
  const onlineUsers = await db
    .select({ id: users.id, displayName: users.displayName, avatarId: users.avatarId })
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
    },
  });
}
