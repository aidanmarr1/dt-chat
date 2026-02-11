"use client";

import { useState, useEffect } from "react";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <button
      onClick={onToggle}
      className={`p-2 sm:p-2 rounded-lg border transition-all active:scale-90 min-w-[36px] min-h-[36px] flex items-center justify-center ${
        enabled
          ? "border-border hover:bg-surface hover:border-accent/40"
          : "border-border hover:bg-surface hover:border-accent/40 opacity-60"
      }`}
      aria-label={enabled ? "Mute notifications" : "Unmute notifications"}
      title={enabled ? "Sound on" : "Sound off"}
    >
      {enabled ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      )}
    </button>
  );
}
