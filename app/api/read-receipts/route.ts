import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readReceipts } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { lastReadMessageId } = await req.json();
  if (!lastReadMessageId || typeof lastReadMessageId !== "string") {
    return NextResponse.json({ error: "lastReadMessageId required" }, { status: 400 });
  }

  // Upsert: insert or update on conflict
  const existing = await db
    .select()
    .from(readReceipts)
    .where(eq(readReceipts.userId, user.id))
    .get();

  if (existing) {
    await db
      .update(readReceipts)
      .set({ lastReadMessageId, readAt: new Date() })
      .where(eq(readReceipts.userId, user.id));
  } else {
    await db.insert(readReceipts).values({
      userId: user.id,
      lastReadMessageId,
      readAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true });
}
