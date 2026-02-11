"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  displayName: string;
}

interface SearchMessagesProps {
  onClose: () => void;
  onScrollTo: (messageId: string) => void;
}

export default function SearchMessages({ onClose, onScrollTo }: SearchMessagesProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
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
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleResultClick(id: string) {
    onScrollTo(id);
    onClose();
  }

  return (
    <div className="absolute inset-x-0 top-0 z-30 glass border-b border-border animate-slide-down">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 bg-transparent text-foreground placeholder:text-muted text-base sm:text-sm focus:outline-none"
        />
        <button
          onClick={onClose}
          className="p-2 sm:p-1 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {(results.length > 0 || loading) && (
        <div className="max-h-[50vh] sm:max-h-64 overflow-y-auto border-t border-border">
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted">Searching...</div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => handleResultClick(r.id)}
              className="w-full text-left px-4 py-3 sm:py-2.5 hover:bg-surface active:bg-border/30 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium text-accent truncate">{r.displayName}</span>
                <span className="text-[10px] text-muted shrink-0">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground truncate mt-0.5">{r.content}</p>
            </button>
          ))}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted">No messages found</div>
          )}
        </div>
      )}
    </div>
  );
}
