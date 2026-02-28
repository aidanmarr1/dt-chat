import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { signToken } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createRateLimiter } from "@/lib/rate-limit";

const checkRateLimit = createRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }
  const { email, displayName, password, confirmPassword } = await req.json();

  if (!email || !displayName || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const trimmedEmail = String(email).trim();
  const trimmedName = String(displayName).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  if (trimmedName.length === 0 || trimmedName.length > 50) {
    return NextResponse.json(
      { error: "Display name must be 1-50 characters" },
      { status: 400 }
    );
  }

  // Block control characters, zero-width chars, and RTL overrides that enable spoofing
  if (/[\x00-\x1f\x7f\u200b-\u200f\u2028-\u202f\u2060\ufeff]/.test(trimmedName)) {
    return NextResponse.json(
      { error: "Display name contains invalid characters" },
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

  if (password.length > 128) {
    return NextResponse.json(
      { error: "Password must be 128 characters or less" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, trimmedEmail.toLowerCase()))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    email: trimmedEmail.toLowerCase(),
    displayName: trimmedName,
    password: hashedPassword,
    createdAt: new Date(),
  });

  const token = await signToken(userId);

  const res = NextResponse.json({
    user: { id: userId, email: trimmedEmail.toLowerCase(), displayName: trimmedName, avatarId: null },
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
