import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureBookmarkTable } from "@/lib/init-tables";
import { eq, and, desc } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkBookmarkRateLimit = createRateLimiter({ maxAttempts: 30, windowMs: 60 * 1000 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureBookmarkTable();

  const rows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, user.id))
    .orderBy(desc(bookmarks.bookmarkedAt))
    .limit(200);

  const items = rows.map((r) => ({
    id: r.id,
    messageId: r.messageId,
    content: r.content || "",
    displayName: r.displayName || "",
    createdAt: r.createdAt || "",
    fileName: r.fileName || null,
    bookmarkedAt: r.bookmarkedAt ? new Date(r.bookmarkedAt).toISOString() : new Date().toISOString(),
  }));

  return NextResponse.json({ bookmarks: items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureBookmarkTable();

  if (!(await checkBookmarkRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { messageId, content, displayName, createdAt, fileName } = body;

  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  // Toggle: if already bookmarked, remove it
  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, user.id), eq(bookmarks.messageId, messageId)))
    .get();

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
    return NextResponse.json({ removed: true, id: existing.id });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await db.insert(bookmarks).values({
    id,
    userId: user.id,
    messageId,
    content: content || "",
    displayName: displayName || "",
    createdAt: createdAt || "",
    fileName: fileName || null,
    bookmarkedAt: now,
  });

  return NextResponse.json({
    bookmark: {
      id,
      messageId,
      content: content || "",
      displayName: displayName || "",
      createdAt: createdAt || "",
      fileName: fileName || null,
      bookmarkedAt: new Date(now).toISOString(),
    },
  });
}
