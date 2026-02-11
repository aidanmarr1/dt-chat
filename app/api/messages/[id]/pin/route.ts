import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
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

  if (message.deletedAt) {
    return NextResponse.json({ error: "Cannot pin deleted message" }, { status: 400 });
  }

  // Accept explicit action to avoid toggle race conditions
  let body: { action?: string } = {};
  try { body = await req.json(); } catch { /* no body = toggle */ }

  const isPinned = !!message.pinnedAt;
  const wantPin = body.action === "pin" ? true : body.action === "unpin" ? false : !isPinned;

  if (wantPin === isPinned) {
    return NextResponse.json({ action: isPinned ? "pinned" : "unpinned" });
  }

  await db
    .update(messages)
    .set({
      pinnedAt: wantPin ? new Date() : null,
      pinnedBy: wantPin ? user.id : null,
    })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ action: wantPin ? "pinned" : "unpinned" });
}
