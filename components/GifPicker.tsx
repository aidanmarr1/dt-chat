"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";

interface Gif {
  id: string;
  title: string;
  preview: string;
  url: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
  toggleRef?: React.RefObject<HTMLButtonElement | null>;
}

export default function GifPicker({ onSelect, onClose, toggleRef }: GifPickerProps) {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchGifs = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      const qs = params.toString();
      const url = qs ? `/api/gifs?${qs}` : "/api/gifs";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGifs(data.gifs || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  // Load GIFs on mount
  useEffect(() => {
    fetchGifs("");
  }, [fetchGifs]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, fetchGifs]);

  // Auto-focus search on desktop
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      searchRef.current?.focus();
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !toggleRef?.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, toggleRef]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Clamp horizontally within viewport
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    if (rect.left < pad) {
      el.style.left = `${pad - rect.left}px`;
    } else if (rect.right > window.innerWidth - pad) {
      el.style.left = `${window.innerWidth - pad - rect.right}px`;
    }
  }, []);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 w-80 max-w-[calc(100vw-1rem)] bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-black/20 animate-fade-scale overflow-hidden z-50"
    >
      {/* Search */}
      <div className="p-2.5 pb-2 border-b border-border">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-base sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* GIF grid */}
      <div className="p-2 h-64 max-h-[50vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted">
            {search ? "No GIFs found" : "No GIFs available"}
          </div>
        ) : (
          <div className="columns-2 gap-1.5">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => {
                  onSelect(gif.url);
                  onClose();
                }}
                className="w-full mb-1.5 rounded-lg overflow-hidden hover:opacity-80 hover:scale-[1.02] active:scale-95 transition-all duration-150 break-inside-avoid"
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-auto rounded-lg"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2.5 py-1.5 border-t border-border">
        <p className="text-[9px] text-muted text-center">D&T GIFs</p>
      </div>
    </div>
  );
}
