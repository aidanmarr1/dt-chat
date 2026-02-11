"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";

interface PinnedMessagesProps {
  messages: Message[];
  onScrollTo: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
}

export default function PinnedMessages({ messages, onScrollTo, onUnpin }: PinnedMessagesProps) {
  const [expanded, setExpanded] = useState(false);

  if (messages.length === 0) return null;

  const latest = messages[messages.length - 1];

  return (
    <div className="border-b border-border bg-accent/5">
      {/* Collapsed: show latest pinned */}
      <button
        onClick={() => messages.length > 1 ? setExpanded(!expanded) : onScrollTo(latest.id)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-accent/10 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
          <line x1="12" y1="17" x2="12" y2="22" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground truncate">
            <span className="font-medium text-accent">{latest.displayName}</span>
            {": "}
            {latest.content || latest.fileName || "Pinned message"}
          </p>
        </div>
        {messages.length > 1 && (
          <span className="text-[10px] text-muted shrink-0">
            {messages.length} pinned
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`inline ml-0.5 transition-transform ${expanded ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        )}
      </button>

      {/* Expanded: show all pinned */}
      {expanded && (
        <div className="border-t border-border/50 max-h-[40vh] sm:max-h-48 overflow-y-auto animate-fade-scale">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-center gap-2 px-4 py-2 hover:bg-accent/10 transition-colors group"
            >
              <button
                onClick={() => onScrollTo(msg.id)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-xs truncate">
                  <span className="font-medium text-accent">{msg.displayName}</span>
                  <span className="text-muted"> — </span>
                  <span className="text-foreground">{msg.content || msg.fileName || "Attachment"}</span>
                </p>
                {msg.pinnedByName && (
                  <p className="text-[10px] text-muted">Pinned by {msg.pinnedByName}</p>
                )}
              </button>
              <button
                onClick={() => onUnpin(msg.id)}
                className="p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-surface text-muted hover:text-foreground transition-all active:scale-90"
                title="Unpin"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
