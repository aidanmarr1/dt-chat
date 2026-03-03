import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureReminderTable } from "@/lib/init-tables";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureReminderTable();
  const { id } = await params;

  const reminder = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
    .get();

  if (!reminder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(reminders).where(eq(reminders.id, id));
  return NextResponse.json({ ok: true });
}
