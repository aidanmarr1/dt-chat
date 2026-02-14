"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import type { Message } from "@/lib/types";

interface ThreadPanelProps {
  parentMessage: Message;
  replies: Message[];
  currentUserId: string;
  currentDisplayName: string;
  onClose: () => void;
  onReply: (content: string, replyToId: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ThreadPanel({
  parentMessage,
  replies,
  currentUserId,
  currentDisplayName,
  onClose,
  onReply,
}: ThreadPanelProps) {
  const [replyText, setReplyText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  function handleSend() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(trimmed, parentMessage.id);
    setReplyText("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const allMessages = [parentMessage, ...replies];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h2 className="text-base font-semibold font-heading">Thread</h2>
            <span className="text-xs text-muted">({replies.length} {replies.length === 1 ? "reply" : "replies"})</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {allMessages.map((msg, i) => {
            const isOwn = msg.userId === currentUserId;
            const isParent = i === 0;
            return (
              <div
                key={msg.id}
                className={`${isParent ? "pb-3 border-b border-border mb-3" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <Avatar displayName={msg.displayName} userId={msg.userId} avatarId={msg.avatarId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-medium ${isOwn ? "text-accent" : "text-foreground"}`}>
                        {msg.displayName}
                      </span>
                      <span className="text-[10px] text-muted">
                        {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words mt-0.5">
                      {msg.isDeleted ? (
                        <span className="italic text-muted">This message was deleted</span>
                      ) : (
                        msg.content
                      )}
                    </p>
                    {msg.fileName && (
                      <p className="text-xs text-muted mt-0.5">{msg.fileName}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Reply as ${currentDisplayName}...`}
              className="flex-1 text-sm bg-surface border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted resize-none focus:border-accent focus:outline-none max-h-24"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!replyText.trim()}
              className="p-2 rounded-xl bg-accent text-background disabled:opacity-40 hover:opacity-90 transition-opacity active:scale-95 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
