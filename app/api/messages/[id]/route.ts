import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, linkPreviews } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import { ensureLinkPreviewTable } from "@/lib/init-tables";
import { extractUrls, fetchOpenGraph } from "@/lib/og-utils";
import { cascadeDeleteMessage } from "@/lib/message-utils";

// Edit message
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: messageId } = await params;
  const { content } = await req.json();

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const message = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.userId !== user.id) {
    return NextResponse.json({ error: "Not your message" }, { status: 403 });
  }

  // Only allow editing within 15 minutes
  const fifteenMin = 15 * 60 * 1000;
  if (Date.now() - message.createdAt.getTime() > fifteenMin) {
    return NextResponse.json({ error: "Edit window expired (15 min)" }, { status: 400 });
  }

  const trimmed = content.trim();

  await db
    .update(messages)
    .set({ content: trimmed, editedAt: new Date() })
    .where(eq(messages.id, messageId));

  // Diff-based link preview update
  await ensureLinkPreviewTable();
  const urls = extractUrls(trimmed).slice(0, 3);

  // Get existing previews for this message
  const existingPreviews = await db
    .select()
    .from(linkPreviews)
    .where(eq(linkPreviews.messageId, messageId))
    .all();

  // Partition: keep previews whose URL is still present, remove the rest
  const keptPreviews = existingPreviews.filter((p) => urls.includes(p.url));
  const removedIds = existingPreviews
    .filter((p) => !urls.includes(p.url))
    .map((p) => p.id);

  if (removedIds.length > 0) {
    await db.delete(linkPreviews).where(inArray(linkPreviews.id, removedIds));
  }

  // Only fetch OG data for genuinely new URLs
  const keptUrls = new Set(keptPreviews.map((p) => p.url));
  const newUrls = urls.filter((u) => !keptUrls.has(u));

  const newPreviews: typeof keptPreviews = [];
  for (const url of newUrls) {
    try {
      const og = await fetchOpenGraph(url);
      if (og) {
        const previewId = crypto.randomUUID();
        await db.insert(linkPreviews).values({
          id: previewId,
          messageId,
          url,
          title: og.title || null,
          description: og.description || null,
          imageUrl: og.imageUrl || null,
          siteName: og.siteName || null,
          fetchedAt: new Date(),
        });
        newPreviews.push({
          id: previewId,
          messageId,
          url,
          title: og.title || null,
          description: og.description || null,
          imageUrl: og.imageUrl || null,
          siteName: og.siteName || null,
          fetchedAt: new Date(),
        });
      }
    } catch {
      // skip failed previews
    }
  }

  const allPreviews = [...keptPreviews, ...newPreviews].map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    description: p.description,
    imageUrl: p.imageUrl,
    siteName: p.siteName,
  }));

  return NextResponse.json({ success: true, linkPreviews: allPreviews });
}

// Delete message (hard delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: messageId } = await params;

  const message = await db.select().from(messages).where(eq(messages.id, messageId)).get();
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.userId !== user.id) {
    return NextResponse.json({ error: "Not your message" }, { status: 403 });
  }

  await cascadeDeleteMessage(messageId);

  return NextResponse.json({ success: true });
}

