"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AvatarPicker from "./AvatarPicker";
import Avatar from "./Avatar";
import { useTheme } from "./ThemeProvider";
import type { User } from "@/lib/types";

type Tab = "account" | "avatar" | "appearance";

interface SettingsMenuProps {
  user: User;
  onAvatarChange: (avatarId: string | null) => void;
  onLogout: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export default function SettingsMenu({ user, onAvatarChange, onLogout, soundEnabled, onSoundToggle }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("account");
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

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
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: "avatar",
      label: "Avatar",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ),
    },
  ];

  function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0"
        style={{ backgroundColor: on ? "var(--accent)" : "var(--border)" }}
      >
        <span
          className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    );
  }

  const modal = open && mounted ? (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Mobile: full-screen sheet from bottom. Desktop: centered modal */}
      <div className="relative w-full h-full sm:w-[calc(100vw-2rem)] sm:max-w-[560px] sm:h-[min(30rem,calc(100dvh-4rem))] bg-surface sm:border sm:border-border sm:rounded-2xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col sm:flex-row animate-fade-scale" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* === MOBILE HEADER === */}
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-border sm:hidden">
          <h2 className="text-base font-semibold text-foreground font-heading">Settings</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 -mr-1 rounded-lg text-muted hover:text-foreground active:bg-surface transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* === MOBILE TABS (horizontal pills) === */}
        <div className="flex gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto sm:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-accent/15 text-accent"
                  : "bg-background text-muted active:bg-border"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* === DESKTOP SIDEBAR === */}
        <div className="hidden sm:flex sm:w-48 shrink-0 sm:border-r border-border bg-background/50 flex-col">
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{user.displayName}</p>
              <p className="text-[10px] text-muted truncate">{user.email}</p>
            </div>
          </div>

          <div className="h-px bg-border mx-3" />

          <nav className="flex flex-col px-2 py-2 gap-0.5 flex-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all ${
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

          <div className="px-2 pb-3">
            <div className="h-px bg-border mb-2 mx-1" />
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 hover:bg-red-500/10 transition-all w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </div>
        </div>

        {/* === CONTENT === */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Account */}
          {tab === "account" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Account</h3>
              <p className="text-xs text-muted mb-5">Your profile information</p>

              <div className="flex items-center gap-4 p-4 mb-5 rounded-xl bg-background border border-border">
                <div className="ring-2 ring-accent/20 rounded-full">
                  <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate font-heading">{user.displayName}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Display Name</label>
                  <p className="mt-1.5 text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border">{user.displayName}</p>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Email</label>
                  <p className="mt-1.5 text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border">{user.email}</p>
                </div>
              </div>

              {/* Mobile logout */}
              <div className="sm:hidden mt-8 pt-4 border-t border-border">
                <button
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 bg-red-500/5 border border-red-500/15 active:bg-red-500/10 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          )}

          {/* Avatar */}
          {tab === "avatar" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Avatar</h3>
              <p className="text-xs text-muted mb-5">Choose how you appear in the chat</p>

              <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-background border border-border">
                <div className="ring-2 ring-accent/20 rounded-full">
                  <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="lg" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">Current</p>
                  <p className="text-sm font-medium text-foreground">{user.avatarId || "Initials"}</p>
                </div>
              </div>

              <AvatarPicker
                currentAvatarId={user.avatarId ?? null}
                onSelect={onAvatarChange}
              />
            </div>
          )}

          {/* Appearance */}
          {tab === "appearance" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Appearance</h3>
              <p className="text-xs text-muted mb-5">Customize your experience</p>

              <div className="space-y-3">
                {/* Theme */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      {theme === "dark" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Theme</p>
                      <p className="text-[11px] text-muted">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={theme === "dark"} onToggle={toggleTheme} />
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      {soundEnabled ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 5L6 9H2v6h4l5 4V5z" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Notification sounds</p>
                      <p className="text-[11px] text-muted">{soundEnabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={soundEnabled} onToggle={onSoundToggle} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close button — desktop only */}
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
  ) : null;

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
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
