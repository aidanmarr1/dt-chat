import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      avatarId: users.avatarId,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .get();

  return user ?? null;
}
