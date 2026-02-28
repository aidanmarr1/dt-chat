"use client";

import type { MessageReaction } from "@/lib/types";

interface ReactionBarProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}

export default function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full text-xs border transition-all active:scale-90 hover:shadow-sm animate-reaction-pop ${
            r.reacted
              ? "bg-accent/10 border-accent/40 text-foreground shadow-sm shadow-accent/10"
              : "bg-surface border-border text-muted hover:border-accent/30 hover:bg-surface"
          }`}
        >
          <span className={`text-sm leading-none ${r.reacted ? "animate-bounce-once" : ""}`}>{r.emoji}</span>
          <span className={`text-[11px] font-medium tabular-nums ${r.reacted ? "text-accent" : ""}`}>{r.count}</span>
        </button>
      ))}
    </div>
  );
}
