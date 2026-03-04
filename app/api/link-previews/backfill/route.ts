import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, linkPreviews } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";
import { extractUrls, fetchOpenGraph } from "@/lib/og-utils";
import { sql } from "drizzle-orm";
import { ensureLinkPreviewTable } from "@/lib/init-tables";

const checkBackfillRateLimit = createRateLimiter({ maxAttempts: 1, windowMs: 5 * 60 * 1000 });

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensureLinkPreviewTable();

  if (!(await checkBackfillRateLimit(user.id + ":backfill"))) {
    return NextResponse.json({ error: "Rate limited. Try again in 5 minutes." }, { status: 429 });
  }

  // Find messages containing http that have no linkPreviews records
  const candidates = await db
    .select({ id: messages.id, content: messages.content })
    .from(messages)
    .where(
      sql`${messages.content} LIKE '%http%' AND ${messages.id} NOT IN (SELECT DISTINCT ${linkPreviews.messageId} FROM ${linkPreviews})`
    )
    .limit(20);

  let filled = 0;
  let failed = 0;

  for (const msg of candidates) {
    const urls = extractUrls(msg.content);
    if (urls.length === 0) continue;

    for (const url of urls.slice(0, 3)) {
      try {
        const og = await fetchOpenGraph(url);
        if (og) {
          await db.insert(linkPreviews).values({
            id: crypto.randomUUID(),
            messageId: msg.id,
            url,
            title: og.title || null,
            description: og.description || null,
            imageUrl: og.imageUrl || null,
            siteName: og.siteName || null,
            fetchedAt: new Date(),
          });
          filled++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
  }

  // Count remaining messages that still need backfill
  const remainingResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(messages)
    .where(
      sql`${messages.content} LIKE '%http%' AND ${messages.id} NOT IN (SELECT DISTINCT ${linkPreviews.messageId} FROM ${linkPreviews})`
    );

  const remaining = Number(remainingResult[0]?.count ?? 0);

  return NextResponse.json({
    processed: candidates.length,
    remaining,
    filled,
    failed,
  });
}
