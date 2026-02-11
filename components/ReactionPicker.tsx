"use client";

import { useLayoutEffect, useRef, useEffect } from "react";
import { quickReactions } from "@/lib/emojis";

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Clamp horizontally so the picker stays within the viewport
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;

    if (rect.left < pad) {
      el.style.left = `${pad - rect.left}px`;
      el.style.transform = "none";
    } else if (rect.right > window.innerWidth - pad) {
      el.style.left = `${window.innerWidth - pad - rect.right}px`;
      el.style.transform = "none";
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-2xl shadow-black/20 animate-fade-scale p-1.5"
    >
      <div className="flex gap-0.5">
        {quickReactions.map((emoji, i) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-xl sm:text-lg rounded-lg hover:bg-border hover:scale-125 active:scale-95 transition-all animate-pop-in"
            style={{ animationDelay: `${i * 25}ms` }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
