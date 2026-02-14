"use client";

import type { Poll } from "@/lib/types";

interface PollCardProps {
  poll: Poll;
  onVote: (pollId: string, optionId: string) => void;
  isOwn: boolean;
}

export default function PollCard({ poll, onVote, isOwn }: PollCardProps) {
  const hasVoted = poll.options.some((o) => o.voted);

  return (
    <div className={`rounded-xl border p-3 mt-1 mb-1 ${isOwn ? "border-background/20 bg-background/10" : "border-border bg-background/50"}`}>
      {/* Question */}
      <div className="flex items-start gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 mt-0.5 ${isOwn ? "text-background/60" : "text-accent"}`}>
          <path d="M3 3h18" /><path d="M3 9h18" /><path d="M3 15h12" /><path d="M3 21h6" />
        </svg>
        <p className={`text-sm font-medium ${isOwn ? "text-background" : "text-foreground"}`}>{poll.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-1.5">
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;

          return (
            <button
              key={opt.id}
              onClick={() => onVote(poll.id, opt.id)}
              className={`w-full relative overflow-hidden rounded-lg text-left transition-all active:scale-[0.99] ${
                opt.voted
                  ? isOwn ? "ring-1 ring-background/40" : "ring-1 ring-accent/40"
                  : ""
              }`}
            >
              {/* Fill bar */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                  opt.voted
                    ? isOwn ? "bg-background/25" : "bg-accent/15"
                    : isOwn ? "bg-background/10" : "bg-surface"
                }`}
                style={{ width: hasVoted ? `${pct}%` : "0%" }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                    opt.voted
                      ? isOwn ? "border-background bg-background" : "border-accent bg-accent"
                      : isOwn ? "border-background/40" : "border-border"
                  }`}>
                    {opt.voted && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isOwn ? "var(--fg)" : "var(--bg)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm truncate ${isOwn ? "text-background" : "text-foreground"}`}>{opt.text}</span>
                </div>
                {hasVoted && (
                  <span className={`text-xs font-medium shrink-0 ml-2 ${isOwn ? "text-background/70" : "text-muted"}`}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className={`text-[10px] mt-2 ${isOwn ? "text-background/50" : "text-muted"}`}>
        {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
        {hasVoted && " \u00b7 Tap to change vote"}
      </p>
    </div>
  );
}
