import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, sql, isNull } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkSearchRateLimit = createRateLimiter({ maxAttempts: 30, windowMs: 60 * 1000 });

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!(await checkSearchRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many searches. Please slow down." }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Escape LIKE special characters to prevent wildcard injection
  const escapedQ = q.replace(/[%_\\]/g, "\\$&");

  const results = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      userId: messages.userId,
      displayName: users.displayName,
      avatarId: users.avatarId,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(
      sql`${messages.content} LIKE ${"%" + escapedQ + "%"} ESCAPE '\\' AND ${isNull(messages.deletedAt)}`
    )
    .orderBy(sql`${messages.createdAt} DESC`)
    .limit(20);

  return NextResponse.json({ results });
}
