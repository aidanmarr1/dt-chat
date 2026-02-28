import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readReceipts } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkReadReceiptRateLimit = createRateLimiter({ maxAttempts: 60, windowMs: 60 * 1000 });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkReadReceiptRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { lastReadMessageId } = await req.json();
  if (!lastReadMessageId || typeof lastReadMessageId !== "string") {
    return NextResponse.json({ error: "lastReadMessageId required" }, { status: 400 });
  }

  if (lastReadMessageId.length > 36) {
    return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
  }

  // Atomic upsert using INSERT OR REPLACE to prevent race conditions
  await db
    .insert(readReceipts)
    .values({
      userId: user.id,
      lastReadMessageId,
      readAt: new Date(),
    })
    .onConflictDoUpdate({
      target: readReceipts.userId,
      set: { lastReadMessageId, readAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
