"use client";

import Avatar from "./Avatar";
import type { OnlineUser } from "@/lib/types";

interface TypingIndicatorProps {
  users: string[];
  onlineUsers?: OnlineUser[];
}

export default function TypingIndicator({ users, onlineUsers = [] }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users[0]} and ${users.length - 1} others are typing`;

  // Match typing user names to online users for avatars
  const typingOnlineUsers = users.slice(0, 3).map((name) =>
    onlineUsers.find((u) => u.displayName === name)
  );

  return (
    <div className="px-4 py-1.5 animate-fade-in">
      <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border/50 text-xs text-muted">
        {/* Typing user avatars */}
        <div className="flex items-center -space-x-1">
          {typingOnlineUsers.map((u, i) =>
            u ? (
              <div key={u.id} className="ring-1.5 ring-surface rounded-full" style={{ zIndex: 3 - i }}>
                <Avatar displayName={u.displayName} userId={u.id} avatarId={u.avatarId} size="xs" />
              </div>
            ) : null
          )}
        </div>
        <span className="text-muted/80">{text}</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[5px] h-[5px] bg-accent rounded-full inline-block"
              style={{
                animation: "pulse-dot 1.4s infinite ease-in-out",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
