import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkPinRateLimit = createRateLimiter({ maxAttempts: 20, windowMs: 60 * 1000 });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkPinRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id: messageId } = await params;

  const message = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkPinRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id: messageId } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 100) : null;

  const message = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (!message.pinnedAt) {
    return NextResponse.json({ error: "Message is not pinned" }, { status: 400 });
  }
  if (message.pinnedBy !== user.id) {
    return NextResponse.json({ error: "Only the user who pinned can edit the label" }, { status: 403 });
  }

  await db
    .update(messages)
    .set({ pinLabel: label || null })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ label: label || null });
}
