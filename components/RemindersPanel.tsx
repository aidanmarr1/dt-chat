"use client";

import { useEffect } from "react";
import { useSwipeToClose } from "@/lib/hooks/useSwipeToClose";
import type { Reminder } from "@/lib/types";

interface RemindersPanelProps {
  reminders: Reminder[];
  onClose: () => void;
  onScrollTo: (messageId: string) => void;
  onDelete: (reminderId: string) => void;
}

function relativeReminderTime(ts: number): string {
  const now = Date.now();
  const diff = ts - now;
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (diff < 0) {
    // Overdue
    if (minutes < 1) return "overdue just now";
    if (minutes < 60) return `overdue by ${minutes}m`;
    if (hours < 24) return `overdue by ${hours}h`;
    return `overdue by ${days}d`;
  }

  // Upcoming
  if (minutes < 1) return "in less than a minute";
  if (minutes < 60) return `in ${minutes} min`;
  if (hours < 24) return `in ${hours}h`;
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}

export default function RemindersPanel({
  reminders,
  onClose,
  onScrollTo,
  onDelete,
}: RemindersPanelProps) {
  const panelRef = useSwipeToClose(onClose);
  const now = Date.now();
  const sortedReminders = [...reminders].sort((a, b) => a.reminderTime - b.reminderTime);
  const upcoming = sortedReminders.filter((r) => r.reminderTime > now);
  const overdue = sortedReminders.filter((r) => r.reminderTime <= now);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today ${time}`;
    if (isTomorrow) return `Tomorrow ${time}`;
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
  }

  function renderReminder(r: Reminder, i: number, isOverdue: boolean) {
    return (
      <div
        key={r.id}
        className={`px-4 py-3 hover:bg-surface/50 transition-colors cursor-pointer group animate-fade-in ${
          isOverdue ? "border-l-2 border-l-red-400/60" : ""
        }`}
        style={{ animationDelay: `${i * 50}ms` }}
        onClick={() => {
          onScrollTo(r.messageId);
          onClose();
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className={`text-xs font-medium ${isOverdue ? "text-red-400" : "text-accent"}`}>
                {formatTime(r.reminderTime)}
              </p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isOverdue ? "bg-red-500/10 text-red-400" : "bg-accent/10 text-accent"
              }`}>
                {relativeReminderTime(r.reminderTime)}
              </span>
            </div>
            <p className="text-sm text-foreground line-clamp-2 break-words">
              {r.messagePreview || "Message"}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(r.id);
            }}
            className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            title="Delete reminder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={panelRef} className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <div>
              <h2 className="text-base font-semibold font-heading">Your Reminders</h2>
              <p className="text-[10px] text-muted">Private -- only visible to you</p>
            </div>
            <span className="text-xs text-muted">({reminders.length})</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sortedReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted px-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center animate-gentle-float">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground animate-fade-in stagger-1">No reminders set</p>
              <p className="text-xs text-muted/60 text-center animate-fade-in stagger-2">Set a reminder on any message to get notified later</p>
              <p className="text-[10px] text-muted/40 animate-fade-in stagger-3">Use the clock icon on any message</p>
            </div>
          ) : (
            <div>
              {/* Overdue section */}
              {overdue.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-red-500/5 border-b border-border">
                    <p className="text-[11px] font-medium text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Overdue ({overdue.length})
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {overdue.map((r, i) => renderReminder(r, i, true))}
                  </div>
                </div>
              )}

              {/* Upcoming section */}
              {upcoming.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-accent/5 border-b border-border">
                    <p className="text-[11px] font-medium text-accent uppercase tracking-wider flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                      </svg>
                      Upcoming ({upcoming.length})
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {upcoming.map((r, i) => renderReminder(r, i, false))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
