import { db } from "@/lib/db";
import { messages, reactions, linkPreviews, bookmarks, reminders, readReceipts, polls, pollVotes } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Hard-delete a message and all related child records from the database.
 */
export async function cascadeDeleteMessage(messageId: string) {
  // 1. Delete poll votes (via polls for this message)
  const messagePollRows = await db.select({ id: polls.id }).from(polls).where(eq(polls.messageId, messageId));
  for (const poll of messagePollRows) {
    await db.delete(pollVotes).where(eq(pollVotes.pollId, poll.id));
  }

  // 2. Delete polls
  await db.delete(polls).where(eq(polls.messageId, messageId));

  // 3. Delete reactions
  await db.delete(reactions).where(eq(reactions.messageId, messageId));

  // 4. Delete link previews
  await db.delete(linkPreviews).where(eq(linkPreviews.messageId, messageId));

  // 5. Delete bookmarks
  await db.delete(bookmarks).where(eq(bookmarks.messageId, messageId));

  // 6. Delete reminders
  await db.delete(reminders).where(eq(reminders.messageId, messageId));

  // 7. Clear read receipts pointing to this message
  await db.delete(readReceipts).where(sql`${readReceipts.lastReadMessageId} = ${messageId}`);

  // 8. Delete the message itself
  await db.delete(messages).where(eq(messages.id, messageId));
}
