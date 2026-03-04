import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "drizzle-orm";
import { cascadeDeleteMessage } from "@/lib/message-utils";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Find all soft-deleted messages
  const softDeleted = await db
    .select({ id: messages.id })
    .from(messages)
    .where(sql`${messages.deletedAt} IS NOT NULL`);

  let cleaned = 0;
  for (const row of softDeleted) {
    await cascadeDeleteMessage(row.id);
    cleaned++;
  }

  return NextResponse.json({ cleaned });
}
