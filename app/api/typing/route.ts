import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ typingAt: Date.now() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
