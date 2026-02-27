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

export async function POST(req: NextRequest) {
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
