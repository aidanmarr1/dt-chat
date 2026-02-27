import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todos, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureTodoTable } from "@/lib/init-tables";
import { eq, asc, desc } from "drizzle-orm";

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

  // Get display names
  const userIds = [...new Set([...rows.map((r) => r.createdBy), ...rows.filter((r) => r.completedBy).map((r) => r.completedBy!)])];
  const nameMap = new Map<string, string>();
  for (const uid of userIds) {
    const u = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, uid)).get();
    if (u) nameMap.set(uid, u.displayName);
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

  const body = await req.json();
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
