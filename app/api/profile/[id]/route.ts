import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, messages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const user = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      avatarId: users.avatarId,
      bio: users.bio,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .get();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Hide profile from others for the private profile user
  const privateUserId = process.env.PRIVATE_PROFILE_USER_ID;
  if (privateUserId && user.id === privateUserId && currentUser.id !== user.id) {
    return NextResponse.json({ error: "This profile is private" }, { status: 403 });
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(eq(messages.userId, id))
    .get();

  return NextResponse.json({
    profile: {
      id: user.id,
      displayName: user.displayName,
      // Only expose email to the user themselves
      email: currentUser.id === user.id ? user.email : undefined,
      avatarId: user.avatarId ?? null,
      bio: user.bio ?? null,
      status: user.status ?? null,
      createdAt: user.createdAt.toISOString(),
      messageCount: countResult?.count ?? 0,
    },
  });
}
