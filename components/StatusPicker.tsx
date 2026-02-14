"use client";

import { useState } from "react";

interface StatusPickerProps {
  currentStatus?: string | null;
  onSet: (status: string | null) => void;
  onClose: () => void;
}

const PRESETS = [
  { emoji: "\u{1F4DA}", text: "Studying" },
  { emoji: "\u{1F3A8}", text: "Working on CAD project" },
  { emoji: "\u{2615}", text: "On a break" },
  { emoji: "\u{1F3E0}", text: "Working from home" },
  { emoji: "\u{1F6AB}", text: "Do not disturb" },
  { emoji: "\u{1F4AC}", text: "AFK" },
];

export default function StatusPicker({ currentStatus, onSet, onClose }: StatusPickerProps) {
  const [custom, setCustom] = useState(currentStatus || "");

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-background border border-border rounded-2xl shadow-2xl animate-fade-scale overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold font-heading">Set your status</h2>
              <p className="text-[10px] text-muted">Visible to everyone in the chat</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-3 space-y-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.text}
                onClick={() => { onSet(`${p.emoji} ${p.text}`); onClose(); }}
                className="w-full text-left px-3 py-2.5 text-sm text-foreground rounded-lg hover:bg-surface transition-colors flex items-center gap-2"
              >
                <span className="text-base">{p.emoji}</span>
                {p.text}
              </button>
            ))}
          </div>

          <div className="px-3 pb-3">
            <div className="h-px bg-border mb-3" />
            <div className="flex gap-2">
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value.slice(0, 100))}
                placeholder="Custom status..."
                className="flex-1 text-sm bg-surface border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && custom.trim()) {
                    onSet(custom.trim());
                    onClose();
                  }
                }}
              />
              <button
                onClick={() => { if (custom.trim()) { onSet(custom.trim()); onClose(); } }}
                disabled={!custom.trim()}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-accent text-background disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Set
              </button>
            </div>
            {currentStatus && (
              <button
                onClick={() => { onSet(null); onClose(); }}
                className="w-full mt-2 text-xs text-muted hover:text-red-400 py-1.5 transition-colors"
              >
                Clear status
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
