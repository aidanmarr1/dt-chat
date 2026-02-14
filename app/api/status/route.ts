import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureStatusColumn } from "@/lib/init-tables";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureStatusColumn();

  const body = await req.json();
  const { status } = body;

  if (status !== null && status !== undefined) {
    if (typeof status !== "string" || status.length > 100) {
      return NextResponse.json({ error: "Status must be 100 characters or less" }, { status: 400 });
    }
  }

  await db
    .update(users)
    .set({
      status: status || null,
      statusSetAt: status ? new Date() : null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
