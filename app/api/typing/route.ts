import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkTypingRateLimit = createRateLimiter({ maxAttempts: 60, windowMs: 60 * 1000 });

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkTypingRateLimit(user.id))) {
    return NextResponse.json({ ok: true }); // Silently skip if rate limited
  }

  await db
    .update(users)
    .set({ typingAt: Date.now() })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
