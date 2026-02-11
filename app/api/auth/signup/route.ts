import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, displayName, password, confirmPassword } = await req.json();

  if (!email || !displayName || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    displayName,
    password: hashedPassword,
    createdAt: new Date(),
  });

  const token = await signToken(userId);

  const res = NextResponse.json({
    user: { id: userId, email: email.toLowerCase(), displayName, avatarId: null },
  });

  res.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
