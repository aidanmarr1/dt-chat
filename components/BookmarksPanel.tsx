"use client";

import { useState, useEffect } from "react";
import { useSwipeToClose } from "@/lib/hooks/useSwipeToClose";
import type { Bookmark } from "@/lib/types";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)}d ago`;
}

interface BookmarksPanelProps {
  bookmarks: Bookmark[];
  onClose: () => void;
  onScrollTo: (messageId: string) => void;
  onRemove: (messageId: string) => void;
}

export default function BookmarksPanel({
  bookmarks,
  onClose,
  onScrollTo,
  onRemove,
}: BookmarksPanelProps) {
  const [filter, setFilter] = useState("");
  const panelRef = useSwipeToClose(onClose);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filtered = filter.trim()
    ? bookmarks.filter(
        (bm) =>
          (bm.content || "").toLowerCase().includes(filter.toLowerCase()) ||
          bm.displayName.toLowerCase().includes(filter.toLowerCase())
      )
    : bookmarks;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            <h2 className="text-base font-semibold font-heading">Bookmarks</h2>
            <span className="text-xs text-muted">({bookmarks.length})</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search filter */}
        {bookmarks.length > 0 && (
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter bookmarks..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
              {filter && (
                <button onClick={() => setFilter("")} className="text-muted hover:text-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bookmark list */}
        <div className="flex-1 overflow-y-auto">
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              <p className="text-sm">No bookmarks yet</p>
              <p className="text-xs text-muted/60">Bookmark messages to save them here</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2 text-muted">
              <p className="text-sm">No matches</p>
              <p className="text-xs text-muted/60">Try a different search term</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((bm, i) => (
                <div
                  key={bm.messageId}
                  className="px-4 py-3 hover:bg-surface/50 transition-colors cursor-pointer group animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                  onClick={() => {
                    onScrollTo(bm.messageId);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-accent mb-0.5">{bm.displayName}</p>
                      <p className="text-sm text-foreground line-clamp-2 break-words">
                        {bm.content || bm.fileName || "File attachment"}
                      </p>
                      <p className="text-[10px] text-muted mt-1">
                        {new Date(bm.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" \u00b7 "}
                        Saved {relativeTime(bm.bookmarkedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(bm.messageId);
                      }}
                      className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      title="Remove bookmark"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
