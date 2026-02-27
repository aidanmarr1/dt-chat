import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { ensureSettingsColumn } from "@/lib/init-tables";
import { eq } from "drizzle-orm";

const SETTINGS_KEYS = new Set([
  "dt-theme", "dt-accent", "dt-density", "dt-font-size", "dt-bubble-style",
  "dt-time-format", "dt-enter-to-send", "dt-reduce-motion",
  "dt-sound", "dt-notifications",
  "dt-read-receipts", "dt-show-typing", "dt-show-online",
]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureSettingsColumn();

  const row = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  let settings: Record<string, string> = {};
  if (row?.settings) {
    try {
      settings = JSON.parse(row.settings);
    } catch {
      // ignore corrupt JSON
    }
  }

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureSettingsColumn();

  const body = await req.json();

  // Guard against oversized payloads
  if (JSON.stringify(body).length > 10_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // Read existing settings
  const row = await db
    .select({ settings: users.settings })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  let settings: Record<string, string> = {};
  if (row?.settings) {
    try {
      settings = JSON.parse(row.settings);
    } catch {
      // ignore corrupt JSON
    }
  }

  // Merge incoming keys (only allowed keys)
  for (const [key, value] of Object.entries(body)) {
    if (SETTINGS_KEYS.has(key)) {
      if (value === null || value === undefined) {
        delete settings[key];
      } else {
        settings[key] = String(value);
      }
    }
  }

  await db
    .update(users)
    .set({ settings: JSON.stringify(settings) })
    .where(eq(users.id, user.id));

  return NextResponse.json({ settings });
}
