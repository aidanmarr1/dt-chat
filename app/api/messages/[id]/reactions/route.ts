import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, reactions } from "@/lib/schema";
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

  // Verify the message exists before inserting a reaction
  const msg = await db.select({ id: messages.id }).from(messages).where(eq(messages.id, messageId)).get();
  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const { emoji } = await req.json();

  if (!emoji || typeof emoji !== "string" || emoji.length > 32) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
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
