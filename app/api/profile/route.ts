import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { AVATAR_PRESETS } from "@/lib/avatars";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { avatarId } = await req.json();

  if (avatarId !== null && !AVATAR_PRESETS.find((p) => p.id === avatarId)) {
    return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ avatarId: avatarId ?? null })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    user: { ...user, avatarId: avatarId ?? null },
  });
}
