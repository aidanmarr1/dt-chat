import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureReminderTable } from "@/lib/init-tables";
import { eq, asc } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkReminderRateLimit = createRateLimiter({ maxAttempts: 30, windowMs: 60 * 1000 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureReminderTable();

  const rows = await db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, user.id))
    .orderBy(asc(reminders.reminderTime))
    .limit(200);

  const items = rows.map((r) => ({
    id: r.id,
    messageId: r.messageId,
    messagePreview: r.messagePreview || "",
    reminderTime: r.reminderTime,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ reminders: items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureReminderTable();

  if (!(await checkReminderRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const { messageId, messagePreview, reminderTime } = body;

  if (!messageId || !reminderTime) {
    return NextResponse.json({ error: "messageId and reminderTime are required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  await db.insert(reminders).values({
    id,
    userId: user.id,
    messageId,
    messagePreview: messagePreview || "",
    reminderTime,
    createdAt: now,
  });

  return NextResponse.json({
    reminder: {
      id,
      messageId,
      messagePreview: messagePreview || "",
      reminderTime,
      createdAt: now,
    },
  });
}
