"use client";

import { useState } from "react";
import ReactionPicker from "./ReactionPicker";
import type { MessageReaction } from "@/lib/types";

interface ReactionBarProps {
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
}

export default function ReactionBar({ reactions, onToggle }: ReactionBarProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  if (reactions.length === 0) return null;

  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1.5">
      {reactions.map((r) => (
        <div key={r.emoji} className="relative">
          <button
            onClick={() => onToggle(r.emoji)}
            onMouseEnter={() => setHoveredEmoji(r.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
            aria-label={`${r.reacted ? "Remove" : "React with"} ${r.emoji} (${r.count})`}
            className={`inline-flex items-center gap-1 px-2.5 py-1 sm:px-2 sm:py-0.5 rounded-full text-xs border transition-all duration-200 active:scale-90 cursor-pointer animate-reaction-pop ${
              r.reacted
                ? "bg-accent/10 border-accent/40 text-foreground shadow-sm shadow-accent/10 hover:bg-accent/20 hover:shadow-md hover:shadow-accent/15"
                : "bg-surface border-border text-muted hover:border-accent/30 hover:bg-accent/5 hover:shadow-sm hover:scale-105"
            }`}
          >
            <span className={`text-sm leading-none ${r.reacted ? "animate-bounce-once" : ""}`}>{r.emoji}</span>
            <span className={`text-[11px] font-medium tabular-nums ${r.reacted ? "text-accent" : ""}`}>{r.count}</span>
          </button>
          {/* Who reacted tooltip */}
          {hoveredEmoji === r.emoji && r.reactedByNames && r.reactedByNames.length > 0 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-foreground text-background text-[11px] rounded-lg shadow-lg whitespace-nowrap z-20 animate-fade-in pointer-events-none max-w-[200px]">
              <p className="truncate">
                {r.reactedByNames.length <= 5
                  ? r.reactedByNames.join(", ")
                  : `${r.reactedByNames.slice(0, 4).join(", ")} +${r.reactedByNames.length - 4} more`}
              </p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-foreground" />
            </div>
          )}
        </div>
      ))}
      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-7 h-7 sm:w-6 sm:h-6 rounded-full border border-dashed border-border text-muted hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all active:scale-90"
          title="Add reaction"
          aria-label="Add reaction"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-20">
            <ReactionPicker onSelect={(emoji) => { onToggle(emoji); setShowPicker(false); }} onClose={() => setShowPicker(false)} />
          </div>
        )}
      </div>
      {/* Total reaction count badge */}
      {totalReactions > 3 && (
        <span className="text-[10px] text-muted/50 font-medium tabular-nums ml-0.5">{totalReactions}</span>
      )}
    </div>
  );
}
