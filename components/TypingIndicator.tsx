"use client";

interface TypingIndicatorProps {
  users: string[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="px-4 py-1.5 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border/50 text-xs text-muted">
        <div className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[5px] h-[5px] bg-accent/70 rounded-full inline-block"
              style={{
                animation: "pulse-dot 1.4s infinite ease-in-out",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <span>{text}</span>
      </div>
    </div>
  );
}
