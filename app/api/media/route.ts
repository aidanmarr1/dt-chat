import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { and, eq, isNotNull, isNull, desc } from "drizzle-orm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: messages.id,
      fileName: messages.fileName,
      fileType: messages.fileType,
      fileSize: messages.fileSize,
      filePath: messages.filePath,
      displayName: users.displayName,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(and(isNotNull(messages.filePath), isNull(messages.deletedAt)))
    .orderBy(desc(messages.createdAt));

  const media = rows.map((r) => ({
    id: r.id,
    fileName: r.fileName || "Unknown",
    fileType: r.fileType || "application/octet-stream",
    fileSize: r.fileSize || 0,
    filePath: r.filePath!,
    displayName: r.displayName,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  return NextResponse.json({ media });
}
