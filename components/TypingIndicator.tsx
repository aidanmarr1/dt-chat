"use client";

import Avatar from "./Avatar";
import type { OnlineUser } from "@/lib/types";

interface TypingIndicatorProps {
  users: string[];
  onlineUsers?: OnlineUser[];
}

export default function TypingIndicator({ users, onlineUsers = [] }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const typingOnlineUsers = users
    .map((name) => onlineUsers.find((u) => u.displayName === name))
    .filter(Boolean) as OnlineUser[];

  const text =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="px-4 py-1.5 animate-fade-in">
      <div className="flex items-end gap-2">
        {/* Avatar stack for typing users */}
        <div className="flex items-center shrink-0 mb-0.5">
          {typingOnlineUsers.length > 0 ? (
            <div className="flex -space-x-1.5">
              {typingOnlineUsers.slice(0, 3).map((u, i) => (
                <div key={u.id} className="ring-2 ring-background rounded-full animate-pop-in" style={{ zIndex: 3 - i, animationDelay: `${i * 50}ms` }}>
                  <Avatar displayName={u.displayName} userId={u.id} avatarId={u.avatarId} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-6" />
          )}
        </div>
        <div>
          <p className="text-[10px] text-muted mb-0.5 px-1 font-medium">{text}</p>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl rounded-bl-sm shadow-sm shadow-accent/5 bg-surface/80 backdrop-blur-sm border border-accent/15" style={{ boxShadow: "0 0 12px rgba(var(--acc-rgb), 0.06), 0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="flex items-end gap-[3px] h-[18px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-accent inline-block"
                  style={{
                    animation: "typing-wave 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.12}s`,
                    height: "4px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
