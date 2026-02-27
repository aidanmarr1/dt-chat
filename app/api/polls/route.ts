import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users, polls } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ensurePollTables } from "@/lib/init-tables";
import { createRateLimiter } from "@/lib/rate-limit";

const checkPollRateLimit = createRateLimiter({ maxAttempts: 10, windowMs: 60 * 1000 });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkPollRateLimit(user.id)) {
    return NextResponse.json({ error: "Too many polls. Please slow down." }, { status: 429 });
  }

  const body = await req.json();
  const { question, options } = body;

  if (!question || typeof question !== "string" || !Array.isArray(options) || options.length < 2 || options.length > 10) {
    return NextResponse.json({ error: "Invalid poll data" }, { status: 400 });
  }

  if (question.trim().length > 500) {
    return NextResponse.json({ error: "Question must be 500 characters or less" }, { status: 400 });
  }

  if (!options.every((o: unknown) => typeof o === "string" && o.trim().length > 0 && o.trim().length <= 200)) {
    return NextResponse.json({ error: "Each option must be 1-200 characters" }, { status: 400 });
  }

  // Ensure tables exist
  await ensurePollTables();

  const pollId = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = new Date();

  const pollOptions = options.map((text: string) => ({
    id: crypto.randomUUID(),
    text: text.trim(),
  }));

  // Create the message first (content is a poll marker)
  await db.insert(messages).values({
    id: messageId,
    content: `::poll::${pollId}`,
    createdAt: now,
    userId: user.id,
  });

  // Create the poll
  await db.insert(polls).values({
    id: pollId,
    question: question.trim(),
    options: JSON.stringify(pollOptions),
    createdBy: user.id,
    createdAt: now,
    messageId,
  });

  // Update lastActiveAt
  await db
    .update(users)
    .set({ lastActiveAt: now, typingAt: null })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    message: {
      id: messageId,
      content: `::poll::${pollId}`,
      createdAt: now,
      userId: user.id,
      displayName: user.displayName,
      avatarId: user.avatarId ?? null,
      fileName: null,
      fileType: null,
      fileSize: null,
      filePath: null,
      replyToId: null,
      replyContent: null,
      replyDisplayName: null,
      reactions: [],
      editedAt: null,
      isDeleted: false,
      isPinned: false,
      pinnedByName: null,
      linkPreviews: [],
      poll: {
        id: pollId,
        question: question.trim(),
        options: pollOptions.map((o: { id: string; text: string }) => ({
          ...o,
          votes: 0,
          voted: false,
          voterNames: [],
        })),
        totalVotes: 0,
        createdBy: user.id,
        createdByName: user.displayName,
        createdAt: now.toISOString(),
      },
    },
  });
}
