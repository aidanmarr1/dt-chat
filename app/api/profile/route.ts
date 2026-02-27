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

  const body = await req.json();
  const { avatarId, bio } = body;

  const updates: Record<string, unknown> = {};

  if (avatarId !== undefined) {
    if (avatarId !== null && !AVATAR_PRESETS.find((p) => p.id === avatarId)) {
      return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
    }
    updates.avatarId = avatarId ?? null;
  }

  if (bio !== undefined) {
    if (bio !== null && typeof bio !== "string") {
      return NextResponse.json({ error: "Bio must be a string" }, { status: 400 });
    }
    if (typeof bio === "string" && bio.length > 200) {
      return NextResponse.json({ error: "Bio must be 200 characters or less" }, { status: 400 });
    }
    updates.bio = bio ?? null;
  }

  if (Object.keys(updates).length > 0) {
    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id));
  }

  return NextResponse.json({
    user: { ...user, ...updates },
  });
}
