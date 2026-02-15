"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AvatarPicker from "./AvatarPicker";
import Avatar from "./Avatar";
import { useTheme } from "./ThemeProvider";
import type { AccentColor, Density, ThemePreference } from "./ThemeProvider";
import type { User } from "@/lib/types";

type Tab = "profile" | "appearance" | "chat" | "notifications" | "privacy" | "shortcuts";
type FontSize = "small" | "default" | "large";
type BubbleStyle = "modern" | "minimal" | "classic";
type TimeFormat = "12h" | "24h";

const ACCENT_COLORS: { id: AccentColor; label: string; dark: string; light: string }[] = [
  { id: "gold",   label: "Gold",   dark: "#FCAA26", light: "#E09500" },
  { id: "blue",   label: "Blue",   dark: "#3B82F6", light: "#2563EB" },
  { id: "green",  label: "Green",  dark: "#22C55E", light: "#16A34A" },
  { id: "purple", label: "Purple", dark: "#A855F7", light: "#9333EA" },
  { id: "red",    label: "Red",    dark: "#EF4444", light: "#DC2626" },
  { id: "pink",   label: "Pink",   dark: "#EC4899", light: "#DB2777" },
  { id: "teal",   label: "Teal",   dark: "#14B8A6", light: "#0D9488" },
];

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["Enter"], description: "Send message" },
  { keys: ["Shift", "Enter"], description: "New line in message" },
  { keys: ["Esc"], description: "Close modal / Cancel reply" },
  { keys: ["@"], description: "Mention a user" },
  { keys: ["Cmd", "F"], description: "Search messages" },
  { keys: ["Cmd", "K"], description: "Search messages (alt)" },
  { keys: ["Cmd", "B"], description: "Toggle bookmarks" },
  { keys: ["Cmd", "V"], description: "Paste image to attach" },
  { keys: ["/"], description: "Focus message input" },
  { keys: ["Double-click"], description: "Quick react with thumbs up" },
  { keys: ["Long press"], description: "Open message actions (mobile)" },
];

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
  const [tab, setTab] = useState<Tab>("profile");
  const [mounted, setMounted] = useState(false);
  const { theme, themePreference, setThemePreference, accentColor, setAccentColor, density, setDensity } = useTheme();

  // Bio editing
  const [bioValue, setBioValue] = useState(user.bio ?? "");
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const bioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Appearance preferences
  const [fontSize, setFontSize] = useState<FontSize>("default");
  const [enterToSend, setEnterToSend] = useState(true);
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>("modern");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");
  const [reduceMotion, setReduceMotion] = useState(false);

  // Privacy preferences
  const [readReceipts, setReadReceipts] = useState(true);
  const [showTyping, setShowTyping] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [aiCheck, setAiCheck] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => setMounted(true), []);

  // Load preferences
  useEffect(() => {
    const fs = localStorage.getItem("dt-font-size") as FontSize | null;
    if (fs === "small" || fs === "large") setFontSize(fs);
    const ets = localStorage.getItem("dt-enter-to-send");
    if (ets === "false") setEnterToSend(false);
    const bs = localStorage.getItem("dt-bubble-style") as BubbleStyle | null;
    if (bs === "minimal" || bs === "classic") setBubbleStyle(bs);
    const tf = localStorage.getItem("dt-time-format") as TimeFormat | null;
    if (tf === "24h") setTimeFormat("24h");
    const rm = localStorage.getItem("dt-reduce-motion");
    if (rm === "true") setReduceMotion(true);
    const rr = localStorage.getItem("dt-read-receipts");
    if (rr === "false") setReadReceipts(false);
    const st = localStorage.getItem("dt-show-typing");
    if (st === "false") setShowTyping(false);
    const so = localStorage.getItem("dt-show-online");
    if (so === "false") setShowOnline(false);
    const ac = localStorage.getItem("dt-ai-check");
    if (ac === "true") setAiCheck(true);
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

  function handleBubbleStyleChange(style: BubbleStyle) {
    setBubbleStyle(style);
    if (style === "modern") {
      document.documentElement.removeAttribute("data-bubble-style");
      localStorage.removeItem("dt-bubble-style");
    } else {
      document.documentElement.setAttribute("data-bubble-style", style);
      localStorage.setItem("dt-bubble-style", style);
    }
  }

  function handleTimeFormatChange(tf: TimeFormat) {
    setTimeFormat(tf);
    if (tf === "12h") {
      localStorage.removeItem("dt-time-format");
    } else {
      localStorage.setItem("dt-time-format", tf);
    }
  }

  function handleReduceMotionToggle() {
    const next = !reduceMotion;
    setReduceMotion(next);
    if (next) {
      document.documentElement.setAttribute("data-reduce-motion", "true");
      localStorage.setItem("dt-reduce-motion", "true");
    } else {
      document.documentElement.removeAttribute("data-reduce-motion");
      localStorage.removeItem("dt-reduce-motion");
    }
  }

  function handlePrivacyToggle(key: "dt-read-receipts" | "dt-show-typing" | "dt-show-online", value: boolean, setter: (v: boolean) => void) {
    const next = !value;
    setter(next);
    localStorage.setItem(key, String(next));
  }

  function handleClearLocalData() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("dt-"));
    keys.forEach(k => localStorage.removeItem(k));
    document.documentElement.removeAttribute("data-accent");
    document.documentElement.removeAttribute("data-density");
    document.documentElement.removeAttribute("data-font-size");
    document.documentElement.removeAttribute("data-bubble-style");
    document.documentElement.removeAttribute("data-reduce-motion");
    setThemePreference("dark");
    setAccentColor("gold");
    setDensity("default");
    setFontSize("default");
    setBubbleStyle("modern");
    setTimeFormat("12h");
    setReduceMotion(false);
    setReadReceipts(true);
    setShowTyping(true);
    setShowOnline(true);
    setAiCheck(false);
    setEnterToSend(true);
    setClearConfirm(false);
  }

  function stagger(index: number): React.CSSProperties {
    return { animationDelay: `${index * 0.05}s` };
  }

  const accentHex = ACCENT_COLORS.find(c => c.id === accentColor)?.[theme === "dark" ? "dark" : "light"] ?? "#FCAA26";
  const fontSizePreviewPx = fontSize === "small" ? "13px" : fontSize === "large" ? "15px" : "14px";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
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
    {
      id: "chat",
      label: "Chat",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: "shortcuts",
      label: "Shortcuts",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" />
          <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
          <path d="M7 16h10" />
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
            ? "shadow-[0_0_8px_rgba(var(--acc-rgb),0.3)]"
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

  function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
    return (
      <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2 px-0.5 flex items-center gap-1.5 group/label">
        {icon && (
          <span className="inline-flex text-muted group-hover/label:text-accent group-hover/label:scale-110 transition-all duration-200">
            {icon}
          </span>
        )}
        {children}
      </p>
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
      <div className="relative w-full h-full sm:w-[calc(100vw-2rem)] sm:max-w-[560px] sm:h-[min(38rem,calc(100dvh-4rem))] bg-surface sm:border sm:border-border sm:rounded-2xl shadow-2xl shadow-black/30 overflow-hidden flex flex-col sm:flex-row animate-fade-scale" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>

        {/* === MOBILE HEADER === */}
        <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-border sm:hidden relative">
          <h2 className="text-base font-semibold text-foreground font-heading">Settings</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 -mr-1 rounded-lg text-muted hover:text-foreground active:bg-surface transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {/* Accent underline bar */}
          <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${accentHex}, transparent)` }} />
        </div>

        {/* === MOBILE TABS (horizontal pills) === */}
        <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto sm:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
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
            <p className="text-[10px] text-muted/50 text-center mt-2">D&T Chat v1.0</p>
          </div>
        </div>

        {/* === CONTENT === */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div key={tab} className="animate-tab-enter">
          {/* Profile (merged Account + Avatar) */}
          {tab === "profile" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Profile</h3>
              <p className="text-xs text-muted mb-5">Your identity and how you appear</p>

              {/* Profile card with accent gradient banner */}
              <div className="mb-5 rounded-xl bg-background border border-border overflow-hidden animate-settings-item" style={stagger(0)}>
                <div className="h-20 relative" style={{ background: `linear-gradient(135deg, ${accentHex}55, ${accentHex}20, transparent)` }}>
                  <div className="absolute -bottom-6 left-4">
                    <div className="ring-4 ring-background rounded-full" style={{ boxShadow: `0 0 20px ${accentHex}33` }}>
                      <Avatar displayName={user.displayName} userId={user.id} avatarId={user.avatarId} size="lg" />
                    </div>
                  </div>
                </div>
                <div className="pt-8 pb-4 px-4">
                  <p className="text-sm font-semibold text-foreground font-heading">{user.displayName}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="animate-settings-item" style={stagger(1)}>
                  <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Display Name</label>
                  <p className="mt-1.5 text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border">{user.displayName}</p>
                </div>
                <div className="animate-settings-item" style={stagger(2)}>
                  <label className="text-[11px] font-medium text-muted uppercase tracking-wider">Email</label>
                  <p className="mt-1.5 text-sm text-foreground px-3 py-2 rounded-lg bg-background border border-border">{user.email}</p>
                </div>
                <div className="animate-settings-item" style={stagger(3)}>
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

              {/* Avatar section */}
              <div className="mt-6 pt-5 border-t border-border animate-settings-item" style={stagger(4)}>
                <SectionLabel icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                }>Avatar</SectionLabel>
                <AvatarPicker
                  currentAvatarId={user.avatarId ?? null}
                  onSelect={onAvatarChange}
                />
              </div>

              {/* Mobile logout */}
              <div className="sm:hidden mt-8 pt-4 border-t border-border animate-settings-item" style={stagger(5)}>
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

          {/* Appearance — pure visual settings */}
          {tab === "appearance" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Appearance</h3>
              <p className="text-xs text-muted mb-5">Customize how things look</p>

              <div className="space-y-5">
                {/* Theme section — 3 cards */}
                <div className="animate-settings-item" style={stagger(0)}>
                  <SectionLabel icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  }>Theme</SectionLabel>
                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Dark theme card */}
                    <button
                      onClick={() => setThemePreference("dark")}
                      className={`relative rounded-xl border-2 p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        themePreference === "dark"
                          ? "border-accent shadow-[0_0_12px_rgba(var(--acc-rgb),0.15)]"
                          : "border-border hover:border-muted"
                      }`}
                    >
                      <div className="rounded-lg overflow-hidden border border-[#2C2C2C] bg-[#141414] p-2 mb-2">
                        <div className="h-1.5 w-6 rounded-full bg-[#2C2C2C] mb-1.5" />
                        <div className="flex gap-1">
                          <div className="h-2.5 flex-1 rounded bg-[#FAFAFA] opacity-90" />
                          <div className="h-2.5 w-5 rounded" style={{ backgroundColor: accentHex }} />
                        </div>
                        <div className="h-1.5 w-10 rounded bg-[#2C2C2C] mt-1.5" />
                        <div className="flex gap-1 mt-1">
                          <div className="h-2.5 flex-1 rounded bg-[#181818]" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground">Dark</span>
                        {themePreference === "dark" && (
                          <span className="text-[9px] font-medium text-accent">Active</span>
                        )}
                      </div>
                    </button>

                    {/* Light theme card */}
                    <button
                      onClick={() => setThemePreference("light")}
                      className={`relative rounded-xl border-2 p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        themePreference === "light"
                          ? "border-accent shadow-[0_0_12px_rgba(var(--acc-rgb),0.15)]"
                          : "border-border hover:border-muted"
                      }`}
                    >
                      <div className="rounded-lg overflow-hidden border border-[#E5E5E5] bg-[#F9F9F9] p-2 mb-2">
                        <div className="h-1.5 w-6 rounded-full bg-[#E5E5E5] mb-1.5" />
                        <div className="flex gap-1">
                          <div className="h-2.5 flex-1 rounded bg-[#141414] opacity-90" />
                          <div className="h-2.5 w-5 rounded" style={{ backgroundColor: accentHex }} />
                        </div>
                        <div className="h-1.5 w-10 rounded bg-[#E5E5E5] mt-1.5" />
                        <div className="flex gap-1 mt-1">
                          <div className="h-2.5 flex-1 rounded bg-[#F0F0F0]" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground">Light</span>
                        {themePreference === "light" && (
                          <span className="text-[9px] font-medium text-accent">Active</span>
                        )}
                      </div>
                    </button>

                    {/* System theme card */}
                    <button
                      onClick={() => setThemePreference("system")}
                      className={`relative rounded-xl border-2 p-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        themePreference === "system"
                          ? "border-accent shadow-[0_0_12px_rgba(var(--acc-rgb),0.15)]"
                          : "border-border hover:border-muted"
                      }`}
                    >
                      {/* Half-dark / half-light mockup */}
                      <div className="rounded-lg overflow-hidden border border-border mb-2 flex">
                        <div className="flex-1 bg-[#141414] p-2">
                          <div className="h-1.5 w-4 rounded-full bg-[#2C2C2C] mb-1.5" />
                          <div className="h-2.5 w-full rounded bg-[#FAFAFA] opacity-90 mb-1" />
                          <div className="h-1.5 w-6 rounded bg-[#2C2C2C]" />
                        </div>
                        <div className="flex-1 bg-[#F9F9F9] p-2">
                          <div className="h-1.5 w-4 rounded-full bg-[#E5E5E5] mb-1.5" />
                          <div className="h-2.5 w-full rounded bg-[#141414] opacity-90 mb-1" />
                          <div className="h-1.5 w-6 rounded bg-[#E5E5E5]" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-foreground">System</span>
                        {themePreference === "system" && (
                          <span className="text-[9px] font-medium text-accent">Active</span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Accent color section */}
                <div className="animate-settings-item" style={stagger(1)}>
                  <SectionLabel icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                    </svg>
                  }>Accent Color</SectionLabel>
                  <div className="p-3.5 rounded-xl bg-background border border-border">
                    <div className="grid grid-cols-7 gap-2">
                      {ACCENT_COLORS.map((c) => (
                        <div key={c.id} className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => setAccentColor(c.id)}
                            className={`w-8 h-8 rounded-full transition-all hover:scale-110 active:scale-95 ${
                              accentColor === c.id
                                ? "ring-2 ring-offset-2 ring-accent ring-offset-background scale-110"
                                : "hover:ring-1 hover:ring-border"
                            }`}
                            style={{ backgroundColor: theme === "dark" ? c.dark : c.light }}
                          />
                          <span className={`text-[9px] font-medium ${accentColor === c.id ? "text-accent" : "text-muted"}`}>{c.label}</span>
                        </div>
                      ))}
                    </div>
                    {/* Mini chat preview showing accent in action */}
                    <div className="mt-3 p-3 rounded-lg bg-surface border border-border/50">
                      <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Preview</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-start">
                          <div className="px-3 py-1.5 rounded-xl bg-background border border-border rounded-bl-sm max-w-[80%]">
                            <p className="text-xs text-foreground">Hey <span className="font-semibold text-accent">@you</span>, check this out</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <div className="px-3 py-1.5 rounded-xl bg-foreground text-background rounded-br-sm max-w-[80%]">
                            <p className="text-xs">Looks great!</p>
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-[10px]">
                            <span style={{ color: accentHex }}>+1</span>
                            <span>reaction</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message display section */}
                <div className="animate-settings-item" style={stagger(2)}>
                  <SectionLabel icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }>Messages</SectionLabel>
                  <div className="space-y-3">
                    {/* Bubble style */}
                    <div className="p-3.5 rounded-xl bg-background border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Bubble style</p>
                          <p className="text-[11px] text-muted">Choose message bubble appearance</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Modern */}
                        <button
                          onClick={() => handleBubbleStyleChange("modern")}
                          className={`rounded-lg border-2 p-2.5 transition-all ${
                            bubbleStyle === "modern" ? "border-accent bg-accent/5" : "border-border hover:border-muted"
                          }`}
                        >
                          <div className="space-y-1 mb-1.5">
                            <div className="h-2 w-full rounded-xl bg-surface border border-border" />
                            <div className="h-2 w-3/4 rounded-xl bg-foreground ml-auto" />
                          </div>
                          <p className={`text-[10px] font-medium ${bubbleStyle === "modern" ? "text-accent" : "text-muted"}`}>Modern</p>
                        </button>
                        {/* Minimal */}
                        <button
                          onClick={() => handleBubbleStyleChange("minimal")}
                          className={`rounded-lg border-2 p-2.5 transition-all ${
                            bubbleStyle === "minimal" ? "border-accent bg-accent/5" : "border-border hover:border-muted"
                          }`}
                        >
                          <div className="space-y-1 mb-1.5">
                            <div className="h-2 w-full border-l-2 border-border pl-1" />
                            <div className="h-2 w-3/4 border-r-2 ml-auto pr-1" style={{ borderColor: accentHex }} />
                          </div>
                          <p className={`text-[10px] font-medium ${bubbleStyle === "minimal" ? "text-accent" : "text-muted"}`}>Minimal</p>
                        </button>
                        {/* Classic */}
                        <button
                          onClick={() => handleBubbleStyleChange("classic")}
                          className={`rounded-lg border-2 p-2.5 transition-all ${
                            bubbleStyle === "classic" ? "border-accent bg-accent/5" : "border-border hover:border-muted"
                          }`}
                        >
                          <div className="space-y-1 mb-1.5">
                            <div className="h-2 w-full rounded-[2px] bg-surface border border-border" />
                            <div className="h-2 w-3/4 rounded-[2px] bg-foreground ml-auto" />
                          </div>
                          <p className={`text-[10px] font-medium ${bubbleStyle === "classic" ? "text-accent" : "text-muted"}`}>Classic</p>
                        </button>
                      </div>
                    </div>

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
                      {/* Live chat preview */}
                      <div className="mt-3 p-3 rounded-lg bg-surface border border-border/50">
                        <p className="text-[10px] text-muted mb-2 uppercase tracking-wider">Preview</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-start">
                            <div className="px-3 py-1.5 rounded-xl bg-background border border-border rounded-bl-sm max-w-[75%]">
                              <p style={{ fontSize: fontSizePreviewPx }} className="text-foreground">Hey, how&apos;s it going?</p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <div className="px-3 py-1.5 rounded-xl bg-foreground text-background rounded-br-sm max-w-[75%]">
                              <p style={{ fontSize: fontSizePreviewPx }}>Pretty good! Just working on the project.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chat density */}
                    <div className="p-3.5 rounded-xl bg-background border border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">Message density</p>
                          <p className="text-[11px] text-muted">Adjust spacing between messages</p>
                        </div>
                      </div>
                      <SegmentedControl
                        value={density}
                        options={[
                          { id: "compact", label: "Compact" },
                          { id: "default", label: "Default" },
                          { id: "comfortable", label: "Comfortable" },
                        ]}
                        onChange={(id) => setDensity(id as Density)}
                      />
                    </div>
                  </div>
                </div>

                {/* Accessibility section */}
                <div className="animate-settings-item" style={stagger(3)}>
                  <SectionLabel icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="21.17" y1="8" x2="12" y2="8" />
                      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                    </svg>
                  }>Accessibility</SectionLabel>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Reduce motion</p>
                        <p className="text-[11px] text-muted">{reduceMotion ? "Animations disabled" : "Disable animations and transitions"}</p>
                      </div>
                    </div>
                    <ToggleSwitch on={reduceMotion} onToggle={handleReduceMotionToggle} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat — behavior & input settings */}
          {tab === "chat" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Chat</h3>
              <p className="text-xs text-muted mb-5">How the chat behaves</p>

              <div className="space-y-3">
                {/* Enter to send */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(0)}>
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

                {/* Time format */}
                <div className="p-3.5 rounded-xl bg-background border border-border animate-settings-item" style={stagger(1)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Time format</p>
                      <p className="text-[11px] text-muted">How timestamps are displayed</p>
                    </div>
                  </div>
                  <SegmentedControl
                    value={timeFormat}
                    options={[
                      { id: "12h", label: "12-hour" },
                      { id: "24h", label: "24-hour" },
                    ]}
                    onChange={(id) => handleTimeFormatChange(id as TimeFormat)}
                  />
                </div>

                {/* AI Writing Assistant */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(2)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">AI Writing Assistant</p>
                      <p className="text-[11px] text-muted">{aiCheck ? "Checks spelling & grammar before sending" : "Fix spelling & grammar before sending"}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={aiCheck} onToggle={() => {
                    const next = !aiCheck;
                    setAiCheck(next);
                    localStorage.setItem("dt-ai-check", String(next));
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Notifications</h3>
              <p className="text-xs text-muted mb-5">Manage how you get notified</p>

              <div className="space-y-3">
                {/* Sound */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(0)}>
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

                {/* Browser notifications */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(1)}>
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
          )}

          {/* Privacy */}
          {tab === "privacy" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Privacy</h3>
              <p className="text-xs text-muted mb-5">Control what others can see</p>

              <div className="space-y-3">
                {/* Read receipts */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(0)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Read receipts</p>
                      <p className="text-[11px] text-muted">{readReceipts ? "Others can see when you read messages" : "Read receipts hidden"}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={readReceipts} onToggle={() => handlePrivacyToggle("dt-read-receipts", readReceipts, setReadReceipts)} />
                </div>

                {/* Typing indicators */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(1)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Typing indicators</p>
                      <p className="text-[11px] text-muted">{showTyping ? "Others can see when you're typing" : "Typing indicators hidden"}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={showTyping} onToggle={() => handlePrivacyToggle("dt-show-typing", showTyping, setShowTyping)} />
                </div>

                {/* Online status */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border gap-3 animate-settings-item" style={stagger(2)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Online status</p>
                      <p className="text-[11px] text-muted">{showOnline ? "Others can see when you're online" : "Online status hidden"}</p>
                    </div>
                  </div>
                  <ToggleSwitch on={showOnline} onToggle={() => handlePrivacyToggle("dt-show-online", showOnline, setShowOnline)} />
                </div>

                {/* Clear local data */}
                <div className="p-3.5 rounded-xl bg-background border border-border animate-settings-item" style={stagger(3)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Clear local data</p>
                      <p className="text-[11px] text-muted">Reset all preferences to defaults</p>
                    </div>
                  </div>
                  {clearConfirm ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-red-400 flex-1">Are you sure? This cannot be undone.</p>
                      <button
                        onClick={handleClearLocalData}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        Yes, clear
                      </button>
                      <button
                        onClick={() => setClearConfirm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground bg-surface border border-border transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setClearConfirm(true)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/5 border border-red-500/15 hover:bg-red-500/10 transition-colors"
                    >
                      Clear all preferences
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shortcuts */}
          {tab === "shortcuts" && (
            <div className="p-4 sm:p-6">
              <h3 className="text-base font-semibold text-foreground mb-1 font-heading">Keyboard Shortcuts</h3>
              <p className="text-xs text-muted mb-5">Quick actions for power users</p>

              <div className="space-y-1">
                {SHORTCUTS.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors animate-settings-item"
                    style={stagger(i)}
                  >
                    <span className="text-sm text-foreground">{s.description}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && <span className="text-[10px] text-muted">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded-md bg-background border border-border text-[11px] font-mono font-medium text-muted shadow-sm">
                            {k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
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
        onClick={() => { setOpen(true); setTab("profile"); }}
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
