"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { emojiCategories } from "@/lib/emojis";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape key
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

  const category = emojiCategories[activeCategory] ?? emojiCategories[0];
  const filteredEmojis = search.trim()
    ? emojiCategories.flatMap((c) => c.emojis)
    : category.emojis;

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 w-72 max-w-[calc(100vw-1rem)] bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-black/20 animate-fade-scale overflow-hidden z-50"
    >
      {/* Search */}
      <div className="p-2.5 pb-2 border-b border-border">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-base sm:text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent transition-all"
            autoFocus
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex px-1.5 pt-1 gap-0.5 border-b border-border">
          {emojiCategories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`flex-1 py-1.5 text-sm rounded-t-lg transition-all ${
                i === activeCategory
                  ? "bg-accent/10 text-accent shadow-[inset_0_-2px_0_var(--acc)]"
                  : "hover:bg-background text-foreground/80"
              }`}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 h-48 sm:h-48 max-h-[40vh] overflow-y-auto">
        {search.trim() && filteredEmojis.length === 0 && (
          <div className="flex items-center justify-center h-full text-xs text-muted">No emojis found</div>
        )}
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-xl sm:text-lg rounded-lg hover:bg-border hover:scale-125 active:scale-95 transition-all duration-150"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
