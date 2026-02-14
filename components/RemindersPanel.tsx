"use client";

import type { Reminder } from "@/lib/types";

interface RemindersPanelProps {
  reminders: Reminder[];
  onClose: () => void;
  onScrollTo: (messageId: string) => void;
  onDelete: (reminderId: string) => void;
}

export default function RemindersPanel({
  reminders,
  onClose,
  onScrollTo,
  onDelete,
}: RemindersPanelProps) {
  const sortedReminders = [...reminders].sort((a, b) => a.reminderTime - b.reminderTime);

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today ${time}`;
    if (isTomorrow) return `Tomorrow ${time}`;
    return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}`;
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <h2 className="text-base font-semibold font-heading">Reminders</h2>
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
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <p className="text-sm">No reminders set</p>
              <p className="text-xs text-muted/60">Set a reminder on any message</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedReminders.map((r) => (
                <div
                  key={r.id}
                  className="px-4 py-3 hover:bg-surface/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    onScrollTo(r.messageId);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-accent mb-0.5">
                        {formatTime(r.reminderTime)}
                      </p>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
