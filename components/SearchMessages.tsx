"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Avatar from "./Avatar";

interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  displayName: string;
  userId: string;
  avatarId?: string | null;
}

interface SearchMessagesProps {
  onClose: () => void;
  onScrollTo: (messageId: string) => void;
}

function contextSnippet(text: string, query: string, contextChars = 40) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.length > contextChars * 2 ? text.slice(0, contextChars * 2) + "..." : text;

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + query.length + contextChars);
  const snippet = (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");

  const parts = snippet.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-accent/25 text-foreground rounded-sm px-0.5">{part}</mark>
    ) : (
      part
    )
  );
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return date.toLocaleDateString([], { month: "long", year: "numeric" });
}

export default function SearchMessages({ onClose, onScrollTo }: SearchMessagesProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
        setSelectedIndex(-1);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  }

  function handleResultClick(id: string) {
    onScrollTo(id);
    setActiveResultId(id);
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleResultClick(results[selectedIndex].id);
    }
  }

  // Scroll selected result into view
  useEffect(() => {
    if (selectedIndex < 0 || !resultsRef.current) return;
    const el = resultsRef.current.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const hasQuery = query.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-[calc(100vw-2rem)] max-w-md bg-surface border border-border rounded-2xl shadow-2xl shadow-black/30 animate-fade-scale overflow-hidden flex flex-col max-h-[70vh]">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-colors ${hasQuery ? "text-accent" : "text-muted"}`}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted text-base sm:text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setSearched(false); inputRef.current?.focus(); }}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-background transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] text-muted border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto" ref={resultsRef}>
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 px-4 py-6 justify-center">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              <span className="text-xs text-muted">Searching...</span>
            </div>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (() => {
            let lastGroup = "";
            return (
              <>
                <div className="px-4 pt-2.5 pb-1.5 animate-fade-in">
                  <span className="text-[11px] font-medium text-muted">
                    {results.length} result{results.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {results.map((r, i) => {
                  const group = getDateGroup(r.createdAt);
                  const showGroupHeader = group !== lastGroup;
                  lastGroup = group;
                  return (
                    <div key={r.id}>
                      {showGroupHeader && (
                        <div className="px-4 pt-3 pb-1">
                          <span className="text-[10px] font-semibold text-muted/70 uppercase tracking-wider">{group}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleResultClick(r.id)}
                        className={`w-full text-left px-4 py-2.5 transition-colors flex items-start gap-3 animate-fade-in ${
                          activeResultId === r.id
                            ? "bg-accent/15 border-l-2 border-accent"
                            : selectedIndex === i
                            ? "bg-accent/10"
                            : "hover:bg-background active:bg-border/30"
                        }`}
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <div className="shrink-0 mt-0.5">
                          <Avatar displayName={r.displayName} userId={r.userId} avatarId={r.avatarId} size="sm" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">{r.displayName}</span>
                            <span className="text-[10px] text-muted shrink-0">{relativeDate(r.createdAt)}</span>
                          </div>
                          <p className="text-[13px] text-muted mt-0.5 leading-snug line-clamp-2">
                            {contextSnippet(r.content, query.trim())}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </>
            );
          })()}

          {/* No results */}
          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center py-10 px-4">
              <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground mb-0.5">No results</p>
              <p className="text-xs text-muted">No messages match &ldquo;{query.trim()}&rdquo;</p>
            </div>
          )}

          {/* Empty state — before searching */}
          {!loading && !searched && !hasQuery && (
            <div className="flex flex-col items-center py-10 px-4">
              <p className="text-xs text-muted">Type to search through messages</p>
              <div className="flex items-center gap-1.5 mt-2">
                <kbd className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5 font-mono">↑</kbd>
                <kbd className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5 font-mono">↓</kbd>
                <span className="text-[10px] text-muted mx-0.5">to navigate</span>
                <kbd className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5 font-mono">↵</kbd>
                <span className="text-[10px] text-muted">to jump</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
