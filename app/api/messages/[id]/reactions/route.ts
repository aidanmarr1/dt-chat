import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reactions } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: messageId } = await params;
  const { emoji } = await req.json();

  if (!emoji || typeof emoji !== "string") {
    return NextResponse.json({ error: "Emoji required" }, { status: 400 });
  }

  // Check if user already reacted with this emoji
  const existing = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.messageId, messageId),
        eq(reactions.userId, user.id),
        eq(reactions.emoji, emoji)
      )
    )
    .get();

  if (existing) {
    // Remove reaction (toggle off)
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    return NextResponse.json({ action: "removed" });
  } else {
    // Add reaction
    await db.insert(reactions).values({
      id: crypto.randomUUID(),
      messageId,
      userId: user.id,
      emoji,
      createdAt: new Date(),
    });
    return NextResponse.json({ action: "added" });
  }
}
