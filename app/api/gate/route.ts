import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function signGateCookie(): string {
  const secret = process.env.JWT_SECRET ?? "fallback";
  const sig = crypto.createHmac("sha256", secret).update("gate-passed").digest("hex");
  return sig;
}

export function verifyGateCookie(value: string | undefined): boolean {
  if (!value) return false;
  const expected = signGateCookie();
  if (value.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

// Simple in-memory rate limiter for gate attempts
const gateAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_GATE_ATTEMPTS = 10;
const GATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkGateRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = gateAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    gateAttempts.set(ip, { count: 1, resetAt: now + GATE_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_GATE_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkGateRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const { password } = await req.json();

  const expected = Buffer.from(process.env.GATE_PASSWORD ?? "dt");
  const received = Buffer.from(String(password ?? ""));

  const isValid =
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received);

  if (!isValid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("gate-passed", signGateCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
