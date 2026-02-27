import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todos } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureTodoTable } from "@/lib/init-tables";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTodoTable();
  const { id } = await params;

  const todo = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!todo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (todo.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  // Toggle completed
  if (body.completed !== undefined) {
    const completed = !!body.completed;
    await db
      .update(todos)
      .set({
        completed,
        completedBy: completed ? user.id : null,
        completedAt: completed ? new Date() : null,
      })
      .where(eq(todos.id, id));
    return NextResponse.json({ ok: true });
  }

  // Edit text
  if (body.text !== undefined) {
    const text = String(body.text).trim();
    if (!text || text.length > 500) {
      return NextResponse.json({ error: "Invalid text" }, { status: 400 });
    }
    await db.update(todos).set({ text }).where(eq(todos.id, id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureTodoTable();
  const { id } = await params;

  const todo = await db.select().from(todos).where(eq(todos.id, id)).get();
  if (!todo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (todo.createdBy !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(todos).where(eq(todos.id, id));
  return NextResponse.json({ ok: true });
}
