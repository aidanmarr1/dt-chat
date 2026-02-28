"use client";

import { useState } from "react";
import type { MessageReaction } from "@/lib/types";

interface ReactionBarProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}

export default function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <div key={r.emoji} className="relative">
          <button
            onClick={() => onToggle(r.emoji)}
            onMouseEnter={() => setHoveredEmoji(r.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full text-xs border transition-all active:scale-90 hover:shadow-sm animate-reaction-pop ${
              r.reacted
                ? "bg-accent/10 border-accent/40 text-foreground shadow-sm shadow-accent/10"
                : "bg-surface border-border text-muted hover:border-accent/30 hover:bg-surface"
            }`}
          >
            <span className={`text-sm leading-none ${r.reacted ? "animate-bounce-once" : ""}`}>{r.emoji}</span>
            <span className={`text-[11px] font-medium tabular-nums ${r.reacted ? "text-accent" : ""}`}>{r.count}</span>
          </button>
          {/* Who reacted tooltip */}
          {hoveredEmoji === r.emoji && r.reactedByNames && r.reactedByNames.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-foreground text-background text-[11px] rounded-lg shadow-lg whitespace-nowrap z-20 animate-fade-in pointer-events-none">
              {r.reactedByNames.length <= 5
                ? r.reactedByNames.join(", ")
                : `${r.reactedByNames.slice(0, 4).join(", ")} +${r.reactedByNames.length - 4} more`}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
