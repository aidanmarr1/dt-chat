import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureBookmarkTable } from "@/lib/init-tables";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureBookmarkTable();
  const { id } = await params;

  const bookmark = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, user.id)))
    .get();

  if (!bookmark) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(bookmarks).where(eq(bookmarks.id, id));
  return NextResponse.json({ ok: true });
}
