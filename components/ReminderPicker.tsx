"use client";

import { useState } from "react";

interface ReminderPickerProps {
  onSet: (time: number) => void;
  onClose: () => void;
}

export default function ReminderPicker({ onSet, onClose }: ReminderPickerProps) {
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  function getTomorrow9am(): number {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }

  const presets = [
    { label: "15 minutes", ms: 15 * 60 * 1000 },
    { label: "1 hour", ms: 60 * 60 * 1000 },
    { label: "3 hours", ms: 3 * 60 * 60 * 1000 },
    { label: "Tomorrow 9 AM", absolute: getTomorrow9am() },
  ];

  function handleCustom() {
    if (!customDate || !customTime) return;
    const dt = new Date(`${customDate}T${customTime}`);
    if (dt.getTime() <= Date.now()) return;
    onSet(dt.getTime());
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full right-0 mb-2 w-56 bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-xl animate-slide-down overflow-hidden z-50">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-foreground font-heading">Remind me</p>
        </div>
        <div className="p-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => onSet(p.absolute ?? Date.now() + p.ms!)}
              className="w-full text-left px-3 py-2 text-sm text-foreground rounded-lg hover:bg-background/60 transition-colors"
            >
              {p.label}
            </button>
          ))}
          <div className="h-px bg-border my-1 mx-2" />
          <div className="px-2 py-1.5 space-y-1.5">
            <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Custom</p>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
            />
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="w-full text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground"
            />
            <button
              onClick={handleCustom}
              disabled={!customDate || !customTime}
              className="w-full text-xs font-medium py-1.5 rounded-lg bg-accent text-background disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Set reminder
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
