import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todos, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureTodoTable } from "@/lib/init-tables";
import { eq, asc, desc, sql } from "drizzle-orm";
import { createRateLimiter } from "@/lib/rate-limit";

const checkTodoRateLimit = createRateLimiter({ maxAttempts: 30, windowMs: 60 * 1000 });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTodoTable();

  const rows = await db
    .select({
      id: todos.id,
      text: todos.text,
      completed: todos.completed,
      completedBy: todos.completedBy,
      createdBy: todos.createdBy,
      createdAt: todos.createdAt,
      completedAt: todos.completedAt,
      position: todos.position,
    })
    .from(todos)
    .orderBy(asc(todos.position), asc(todos.createdAt))
    .limit(200);

  // Batch-fetch all display names in a single query (avoids N+1)
  const userIds = [...new Set([...rows.map((r) => r.createdBy), ...rows.filter((r) => r.completedBy).map((r) => r.completedBy!)])];
  const nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const lookedUp = await db
      .select({ id: users.id, displayName: users.displayName })
      .from(users)
      .where(sql`${users.id} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`);
    for (const u of lookedUp) nameMap.set(u.id, u.displayName);
  }

  const items = rows.map((r) => ({
    id: r.id,
    text: r.text,
    completed: r.completed,
    completedByName: r.completedBy ? nameMap.get(r.completedBy) || null : null,
    createdByName: nameMap.get(r.createdBy) || "Unknown",
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : new Date(Number(r.createdAt) * 1000).toISOString(),
    completedAt: r.completedAt ? (r.completedAt instanceof Date ? r.completedAt.toISOString() : new Date(Number(r.completedAt) * 1000).toISOString()) : null,
    position: r.position,
  }));

  return NextResponse.json({ todos: items });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTodoTable();

  if (!(await checkTodoRateLimit(user.id))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { text } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ error: "Text too long (max 500 characters)" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date();

  // Get max position efficiently
  const maxRow = await db
    .select({ pos: todos.position })
    .from(todos)
    .orderBy(desc(todos.position))
    .limit(1)
    .get();
  const position = maxRow ? maxRow.pos + 1 : 0;

  await db.insert(todos).values({
    id,
    text: text.trim(),
    completed: false,
    createdBy: user.id,
    createdAt: now,
    position,
  });

  return NextResponse.json({
    todo: {
      id,
      text: text.trim(),
      completed: false,
      completedByName: null,
      createdByName: user.displayName,
      createdAt: now.toISOString(),
      completedAt: null,
      position,
    },
  });
}
