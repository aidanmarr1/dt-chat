import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Edit message
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: messageId } = await params;
  const { content } = await req.json();

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const message = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.userId !== user.id) {
    return NextResponse.json({ error: "Not your message" }, { status: 403 });
  }

  if (message.deletedAt) {
    return NextResponse.json({ error: "Message deleted" }, { status: 400 });
  }

  // Only allow editing within 15 minutes
  const fifteenMin = 15 * 60 * 1000;
  if (Date.now() - message.createdAt.getTime() > fifteenMin) {
    return NextResponse.json({ error: "Edit window expired (15 min)" }, { status: 400 });
  }

  await db
    .update(messages)
    .set({ content: content.trim(), editedAt: new Date() })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ success: true });
}

// Soft-delete message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: messageId } = await params;

  const message = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.userId !== user.id) {
    return NextResponse.json({ error: "Not your message" }, { status: 403 });
  }

  await db
    .update(messages)
    .set({ deletedAt: new Date() })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ success: true });
}
