import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { AVATAR_PRESETS } from "@/lib/avatars";
import { createRateLimiter } from "@/lib/rate-limit";

const checkProfileRateLimit = createRateLimiter({ maxAttempts: 20, windowMs: 60 * 1000 });

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkProfileRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();

  // Guard against oversized payloads
  if (JSON.stringify(body).length > 10_000) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

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
    // Block control characters, zero-width chars, and RTL overrides
    if (typeof bio === "string" && /[\x00-\x1f\x7f\u200b-\u200f\u2028-\u202f\u2060\ufeff]/.test(bio)) {
      return NextResponse.json({ error: "Bio contains invalid characters" }, { status: 400 });
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
