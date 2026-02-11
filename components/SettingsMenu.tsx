"use client";

import { useState, useRef, useEffect } from "react";
import AvatarPicker from "./AvatarPicker";
import Avatar from "./Avatar";
import type { User } from "@/lib/types";

interface SettingsMenuProps {
  user: User;
  onAvatarChange: (avatarId: string | null) => void;
}

export default function SettingsMenu({ user, onAvatarChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 sm:p-1.5 rounded-lg border transition-all active:scale-95 ${
          open
            ? "border-accent bg-accent/10 text-accent"
            : "border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground"
        }`}
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 w-[calc(100vw-1.5rem)] sm:w-72 max-w-72 bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl shadow-black/20 animate-slide-down overflow-hidden z-30">
          {/* User profile card */}
          <div className="relative p-4 pb-3">
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-accent/8 to-transparent" />
            <div className="relative flex items-center gap-3">
              <div className="ring-2 ring-accent/30 rounded-full">
                <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                <p className="text-[11px] text-muted truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border mx-3" />

          {/* Avatar picker */}
          <div className="p-3 pt-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Choose Avatar</p>
              <span className="text-[10px] text-muted/60">Scroll for more</span>
            </div>
            <AvatarPicker
              currentAvatarId={user.avatarId ?? null}
              onSelect={onAvatarChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
