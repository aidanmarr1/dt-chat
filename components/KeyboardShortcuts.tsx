"use client";

import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: ["/"], description: "Focus message input" },
  { keys: ["Ctrl", "F"], description: "Search messages" },
  { keys: ["Ctrl", "K"], description: "Search messages" },
  { keys: ["Ctrl", "B"], description: "Toggle bookmarks" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close panel / cancel" },
  { keys: ["Enter"], description: "Send message" },
  { keys: ["Shift", "Enter"], description: "New line in message" },
  { keys: ["↑", "↓"], description: "Navigate search results" },
  { keys: ["Double-click"], description: "Edit own message" },
];

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl shadow-black/30 animate-fade-scale overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-foreground font-heading">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-background transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-5 space-y-1">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-xs text-muted">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-0.5 text-[10px] font-mono font-medium text-foreground bg-background border border-border rounded-md min-w-[24px] text-center"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
