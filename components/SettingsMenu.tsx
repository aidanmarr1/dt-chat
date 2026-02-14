"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AvatarPicker from "./AvatarPicker";
import Avatar from "./Avatar";
import { useTheme } from "./ThemeProvider";
import type { User } from "@/lib/types";

type Tab = "account" | "avatar" | "appearance";
type FontSize = "small" | "default" | "large";

interface SettingsMenuProps {
  user: User;
  onAvatarChange: (avatarId: string | null) => void;
  onBioChange: (bio: string | null) => void;
  onLogout: () => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
}

export default function SettingsMenu({ user, onAvatarChange, onBioChange, onLogout, soundEnabled, onSoundToggle, notificationsEnabled, onNotificationsToggle }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("account");
  const [mounted, setMounted] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Bio editing
  const [bioValue, setBioValue] = useState(user.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const bioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Font size
  const [fontSize, setFontSize] = useState<FontSize>("default");

  // Enter to send
  const [enterToSend, setEnterToSend] = useState(true);

  useEffect(() => setMounted(true), []);

  // Load preferences
  useEffect(() => {
    const fs = localStorage.getItem("dt-font-size") as FontSize | null;
    if (fs === "small" || fs === "large") setFontSize(fs);
    const ets = localStorage.getItem("dt-enter-to-send");
    if (ets === "false") setEnterToSend(false);
  }, []);

  // Sync bio when user prop changes
  useEffect(() => {
    setBioValue(user.bio ?? "");
  }, [user.bio]);

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

  // Auto-save bio with debounce
  function handleBioChange(value: string) {
    if (value.length > 200) return;
    setBioValue(value);
    setBioSaved(false);
    if (bioTimeoutRef.current) clearTimeout(bioTimeoutRef.current);
    bioTimeoutRef.current = setTimeout(() => saveBio(value), 800);
  }

  async function saveBio(value: string) {
    setBioSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: value || null }),
      });
      if (res.ok) {
        onBioChange(value || null);
        setBioSaved(true);
        setTimeout(() => setBioSaved(false), 2000);
      }
    } catch { /* ignore */ }
    setBioSaving(false);
  }

  function handleFontSizeChange(size: FontSize) {
    setFontSize(size);
    if (size === "default") {
      localStorage.removeItem("dt-font-size");
      document.documentElement.removeAttribute("data-font-size");
    } else {
      localStorage.setItem("dt-font-size", size);
      document.documentElement.setAttribute("data-font-size", size);
    }
  }

  function handleEnterToSendToggle() {
    const next = !enterToSend;
    setEnterToSend(next);
    localStorage.setItem("dt-enter-to-send", String(next));
  }

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
        className={`relative w-12 h-7 rounded-full transition-all duration-200 focus:outline-none shrink-0 ${
          on
            ? "shadow-[0_0_8px_rgba(252,170,38,0.3)]"
            : "shadow-inner"
        }`}
        style={{ backgroundColor: on ? "var(--accent)" : "color-mix(in srgb, var(--bg) 70%, var(--bdr))" }}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full transition-all duration-200 flex items-center justify-center ${
            on
              ? "bg-white shadow-md"
              : "bg-muted/60 shadow-sm"
          }`}
          style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
        >
          {on ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </span>
      </button>
    );
  }

  function SegmentedControl({ value, options, onChange }: { value: string; options: { id: string; label: string }[]; onChange: (id: string) => void }) {
    return (
      <div className="flex rounded-lg bg-background border border-border p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              value === opt.id
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2 px-0.5">{children}</p>
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
      <div className="relative w-full h-full sm:w-[calc(100vw-2rem)] sm:max-w-[560px] sm:h-[min(34rem,calc(100dvh-4rem))] bg-surface sm:border sm:border-border sm:rounded-2xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col sm:flex-row animate-fade-scale" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

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
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Bio</label>
                    <span className="text-[10px] text-muted">
                      {bioSaving ? (
                        <span className="text-accent">Saving...</span>
                      ) : bioSaved ? (
                        <span className="text-green-500">Saved</span>
                      ) : (
                        `${bioValue.length}/200`
                      )}
                    </span>
                  </div>
                  <textarea
                    value={bioValue}
                    onChange={(e) => handleBioChange(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={2}
                    className="mt-1.5 w-full text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border placeholder:text-muted/50 focus:outline-none focus:border-accent resize-none"
                  />
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

              <div className="space-y-5">
                {/* Theme section */}
                <div>
                  <SectionLabel>Theme</SectionLabel>
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
                        <p className="text-sm font-medium text-foreground">Dark mode</p>
                        <p className="text-[11px] text-muted">{theme === "dark" ? "Currently active" : "Switch to dark mode"}</p>
                      </div>
                    </div>
                    <ToggleSwitch on={theme === "dark"} onToggle={toggleTheme} />
                  </div>
                </div>

                {/* Chat section */}
                <div>
                  <SectionLabel>Chat</SectionLabel>
                  <div className="space-y-3">
                    {/* Font size */}
                    <div className="p-3.5 rounded-xl bg-background border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 7 4 4 20 4 20 7" />
                            <line x1="9" y1="20" x2="15" y2="20" />
                            <line x1="12" y1="4" x2="12" y2="20" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Font size</p>
                          <p className="text-[11px] text-muted">Adjust message text size</p>
                        </div>
                      </div>
                      <SegmentedControl
                        value={fontSize}
                        options={[
                          { id: "small", label: "Small" },
                          { id: "default", label: "Default" },
                          { id: "large", label: "Large" },
                        ]}
                        onChange={(id) => handleFontSizeChange(id as FontSize)}
                      />
                    </div>

                    {/* Enter to send */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 10 4 15 9 20" />
                            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Enter to send</p>
                          <p className="text-[11px] text-muted">{enterToSend ? "Enter sends, Shift+Enter for new line" : "Cmd+Enter sends, Enter for new line"}</p>
                        </div>
                      </div>
                      <ToggleSwitch on={enterToSend} onToggle={handleEnterToSendToggle} />
                    </div>
                  </div>
                </div>

                {/* Notifications section */}
                <div>
                  <SectionLabel>Notifications</SectionLabel>
                  <div className="space-y-3">
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
                          <p className="text-sm font-medium text-foreground">Sounds</p>
                          <p className="text-[11px] text-muted">{soundEnabled ? "Play sounds for new messages" : "Sounds disabled"}</p>
                        </div>
                      </div>
                      <ToggleSwitch on={soundEnabled} onToggle={onSoundToggle} />
                    </div>

                    {/* Notifications */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                          {notificationsEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                              <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Browser notifications</p>
                          <p className="text-[11px] text-muted">{notificationsEnabled ? "Get notified when away" : "Notifications disabled"}</p>
                        </div>
                      </div>
                      <ToggleSwitch on={notificationsEnabled} onToggle={onNotificationsToggle} />
                    </div>
                  </div>
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
