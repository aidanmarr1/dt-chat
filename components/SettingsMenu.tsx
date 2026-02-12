"use client";

import { useState, useEffect } from "react";
import AvatarPicker from "./AvatarPicker";
import Avatar from "./Avatar";
import type { User } from "@/lib/types";

type Tab = "account" | "avatar";

interface SettingsMenuProps {
  user: User;
  onAvatarChange: (avatarId: string | null) => void;
  onLogout: () => void;
}

export default function SettingsMenu({ user, onAvatarChange, onLogout }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("account");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "account",
      label: "Account",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: "avatar",
      label: "Avatar",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <button
        onClick={() => { setOpen(true); setTab("account"); }}
        className="p-2 sm:p-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-[calc(100vw-2rem)] max-w-lg h-[min(28rem,calc(100dvh-4rem))] bg-surface border border-border rounded-2xl shadow-2xl shadow-black/30 animate-fade-scale overflow-hidden flex flex-col sm:flex-row">
            {/* Sidebar */}
            <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-background/50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:pb-4">
                <h2 className="text-sm font-semibold text-foreground font-heading">Settings</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-all sm:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Tab buttons */}
              <nav className="flex sm:flex-col px-2 pb-2 sm:pb-0 gap-0.5 overflow-x-auto sm:overflow-x-visible">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      tab === t.id
                        ? "bg-accent/10 text-accent"
                        : "text-muted hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </nav>

              {/* Logout at bottom - desktop only */}
              <div className="hidden sm:block mt-auto px-2 pb-3 pt-4">
                <div className="h-px bg-border mb-3" />
                <button
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {tab === "account" && (
                <div className="p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-foreground mb-5 font-heading">Account</h3>

                  {/* Profile card */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="ring-2 ring-accent/30 rounded-full">
                      <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="lg" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate font-heading">{user.displayName}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Account details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Display Name</label>
                      <p className="mt-1 text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border">{user.displayName}</p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Email</label>
                      <p className="mt-1 text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border">{user.email}</p>
                    </div>
                  </div>

                  {/* Mobile logout */}
                  <div className="sm:hidden mt-6 pt-4 border-t border-border">
                    <button
                      onClick={() => { setOpen(false); onLogout(); }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}

              {tab === "avatar" && (
                <div className="p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Avatar</h3>
                  <p className="text-xs text-muted mb-4">Choose how you appear in the chat</p>

                  {/* Current avatar preview */}
                  <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-background border border-border">
                    <div className="ring-2 ring-accent/30 rounded-full">
                      <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="lg" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Current avatar</p>
                      <p className="text-sm font-medium text-foreground">{user.avatarId ? user.avatarId : "Initials"}</p>
                    </div>
                  </div>

                  {/* Picker */}
                  <div>
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">Choose Avatar</p>
                    <AvatarPicker
                      currentAvatarId={user.avatarId ?? null}
                      onSelect={onAvatarChange}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Close button - desktop */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface/80 transition-all hidden sm:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
