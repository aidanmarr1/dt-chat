import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, sql, isNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      userId: messages.userId,
      displayName: users.displayName,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(
      sql`${messages.content} LIKE ${"%" + q + "%"} AND ${isNull(messages.deletedAt)}`
    )
    .orderBy(sql`${messages.createdAt} DESC`)
    .limit(20);

  return NextResponse.json({ results });
}
