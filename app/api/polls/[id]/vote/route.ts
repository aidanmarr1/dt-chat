import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { polls, pollVotes } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { ensurePollTables } from "@/lib/init-tables";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id: pollId } = await params;
  const body = await req.json();
  const { optionId } = body;

  if (!optionId) {
    return NextResponse.json({ error: "Option ID required" }, { status: 400 });
  }

  await ensurePollTables();

  // Check poll exists
  const poll = await db.select().from(polls).where(eq(polls.id, pollId)).get();
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // Validate optionId exists in the poll's options
  const pollOptions = JSON.parse(poll.options as string) as { id: string }[];
  if (!pollOptions.some((o) => o.id === optionId)) {
    return NextResponse.json({ error: "Invalid option ID" }, { status: 400 });
  }

  // Use a transaction to prevent race conditions (double-voting)
  await db.transaction(async (tx) => {
    const existingVote = await tx
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, user.id), eq(pollVotes.optionId, optionId)))
      .get();

    if (existingVote) {
      // Remove the vote (toggle off)
      await tx.delete(pollVotes).where(eq(pollVotes.id, existingVote.id));
    } else {
      // Remove any existing vote on this poll (single vote per user)
      const anyExisting = await tx
        .select()
        .from(pollVotes)
        .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, user.id)))
        .get();

      if (anyExisting) {
        await tx.delete(pollVotes).where(eq(pollVotes.id, anyExisting.id));
      }

      // Add new vote
      await tx.insert(pollVotes).values({
        id: crypto.randomUUID(),
        pollId,
        optionId,
        userId: user.id,
        createdAt: new Date(),
      });
    }
  });

  return NextResponse.json({ success: true });
}
