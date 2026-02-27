import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware — enforces gate check on all /api/* routes except /api/gate.
 * Inlines the HMAC verification because Edge middleware can't import Node crypto
 * from route files, but the Web Crypto API is available.
 */

async function verifyGateCookie(value: string | undefined, secret: string): Promise<boolean> {
  if (!value) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("gate-passed"));
  const expected = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (value.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < value.length; i++) {
    mismatch |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only enforce gate on /api/* routes, except /api/gate itself
  if (!pathname.startsWith("/api/") || pathname === "/api/gate") {
    return NextResponse.next();
  }

  const secret = process.env.JWT_SECRET ?? "fallback";
  const gateCookie = req.cookies.get("gate-passed")?.value;

  if (!(await verifyGateCookie(gateCookie, secret))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
