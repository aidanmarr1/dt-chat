import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureStatusColumn } from "@/lib/init-tables";
import { eq } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkStatusRateLimit = createRateLimiter({ maxAttempts: 20, windowMs: 60 * 1000 });

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkStatusRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await ensureStatusColumn();

  const body = await req.json();
  const { status, expiresIn } = body;

  if (status !== null && status !== undefined) {
    if (typeof status !== "string" || status.length > 100) {
      return NextResponse.json({ error: "Status must be 100 characters or less" }, { status: 400 });
    }
  }

  let statusExpiresAt: Date | null = null;
  if (status) {
    if (expiresIn === null) {
      // "Don't clear" — no expiry
      statusExpiresAt = null;
    } else if (typeof expiresIn === "number" && expiresIn > 0) {
      statusExpiresAt = new Date(Date.now() + expiresIn * 60 * 1000);
    } else {
      // Default: 4 hours for backward compat
      statusExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    }
  }

  await db
    .update(users)
    .set({
      status: status || null,
      statusSetAt: status ? new Date() : null,
      statusExpiresAt: status ? statusExpiresAt : null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
