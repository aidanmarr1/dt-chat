"use client";

interface DateSeparatorProps {
  date: string;
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  // Show day-of-week for dates within the last 7 days
  const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (daysDiff < 7) opts.weekday = "long";
  if (date.getFullYear() !== today.getFullYear()) opts.year = "numeric";
  return date.toLocaleDateString("en-US", opts);
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  const label = formatDateLabel(date);
  const isToday = label === "Today";

  return (
    <div className="flex items-center gap-4 my-5 animate-fade-in">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border/60" />
      <span className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-colors font-heading ${
        isToday
          ? "text-accent bg-accent/5 border-accent/20"
          : "text-muted bg-surface border-border"
      }`}>
        {label}
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border/60" />
    </div>
  );
}
