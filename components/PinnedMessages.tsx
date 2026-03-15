"use client";

import { useState, useRef, useEffect } from "react";
import type { Message } from "@/lib/types";

interface PinnedMessagesProps {
  messages: Message[];
  onScrollTo: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  onUpdateLabel: (messageId: string, label: string) => void;
}

function EditLabelButton({ msg, onUpdateLabel }: { msg: Message; onUpdateLabel: (id: string, label: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(msg.pinLabel || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setValue(msg.pinLabel || "");
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editing, msg.pinLabel]);

  function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed !== (msg.pinLabel || "")) {
      onUpdateLabel(msg.id, trimmed);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
        maxLength={100}
        placeholder="Add a label..."
        className="w-28 text-xs bg-background border border-accent/40 rounded px-1.5 py-0.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent"
      />
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-surface text-muted hover:text-accent transition-all active:scale-90"
      title="Edit label"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </button>
  );
}

export default function PinnedMessages({ messages, onScrollTo, onUnpin, onUpdateLabel }: PinnedMessagesProps) {
  const [expanded, setExpanded] = useState(false);

  if (messages.length === 0) return null;

  const latest = messages[messages.length - 1];
  const latestDisplay = latest.pinLabel || latest.content || latest.fileName || "Pinned message";

  function handleBarKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (messages.length > 1) {
        setExpanded(!expanded);
      } else {
        onScrollTo(latest.id);
      }
    }
  }

  return (
    <div className="border-b border-border bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border-l-2 border-l-accent">
      {/* Collapsed: show latest pinned */}
      <button
        onClick={() => messages.length > 1 ? setExpanded(!expanded) : onScrollTo(latest.id)}
        onKeyDown={handleBarKeyDown}
        className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-accent/10 transition-colors group/pin"
        tabIndex={0}
        role="button"
        aria-expanded={messages.length > 1 ? expanded : undefined}
      >
        <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-accent group-hover/pin:animate-wiggle">
            <line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-accent font-semibold mb-0.5">Pinned Message</p>
          <p className="text-xs text-foreground truncate">
            <span className="font-medium">{latest.displayName}</span>
            <span className="text-muted"> — </span>
            {latestDisplay}
          </p>
        </div>
        <span className="text-[10px] shrink-0 flex items-center gap-1.5">
          <span className="bg-accent/20 text-accent font-semibold px-1.5 py-0.5 rounded-full">{messages.length}</span>
          {messages.length > 1 && (
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </span>
      </button>

      {/* Expanded: show all pinned */}
      {expanded && (
        <div className="border-t border-border/50 max-h-[40vh] sm:max-h-48 overflow-y-auto animate-fade-scale">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className="flex items-center gap-2 px-4 py-2 hover:bg-accent/10 transition-colors group animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <button
                onClick={() => onScrollTo(msg.id)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-xs truncate">
                  <span className="font-medium text-accent">{msg.displayName}</span>
                  <span className="text-muted"> — </span>
                  <span className="text-foreground">{msg.pinLabel || msg.content || msg.fileName || "Attachment"}</span>
                </p>
                {msg.pinnedByName && (
                  <p className="text-[10px] text-muted">Pinned by {msg.pinnedByName}</p>
                )}
              </button>
              <EditLabelButton msg={msg} onUpdateLabel={onUpdateLabel} />
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
