import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — enforces gate check on all /api/* routes except /api/gate.
 * Inlines the HMAC verification because Edge middleware can't import Node crypto
 * from route files, but the Web Crypto API is available.
 */

const GATE_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function verifyGateCookie(value: string | undefined, secret: string): Promise<boolean> {
  if (!value) return false;

  // Parse timestamped cookie: "<hmac_hex>.<issuedAt>"
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const sig = value.slice(0, dotIndex);
  const issuedAt = Number(value.slice(dotIndex + 1));
  if (!issuedAt || isNaN(issuedAt)) return false;

  // Reject expired gate cookies
  if (Date.now() - issuedAt > GATE_COOKIE_MAX_AGE_MS) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`gate-passed:${issuedAt}`));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (sig.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only enforce gate on /api/* routes, except /api/gate itself
  if (!pathname.startsWith("/api/") || pathname === "/api/gate") {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const gateCookie = req.cookies.get("gate-passed")?.value;

  if (!(await verifyGateCookie(gateCookie, secret))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
