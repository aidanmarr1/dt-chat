"use client";

import Avatar from "./Avatar";
import type { OnlineUser } from "@/lib/types";

interface TypingIndicatorProps {
  users: string[];
  onlineUsers?: OnlineUser[];
}

export default function TypingIndicator({ users, onlineUsers = [] }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const firstUser = onlineUsers.find((u) => u.displayName === users[0]);

  const text =
    users.length === 1
      ? `${users[0]} is typing`
      : users.length === 2
      ? `${users[0]} and ${users[1]} are typing`
      : `${users[0]} and ${users.length - 1} others are typing`;

  return (
    <div className="px-4 py-1 animate-fade-in">
      <div className="flex items-end gap-2">
        {firstUser && (
          <div className="shrink-0 mb-0.5">
            <Avatar displayName={firstUser.displayName} userId={firstUser.id} avatarId={firstUser.avatarId} size="sm" />
          </div>
        )}
        {!firstUser && <div className="w-6 shrink-0" />}
        <div>
          <p className="text-[10px] text-muted mb-0.5 px-1 font-medium">{text}</p>
          <div className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-surface border border-border rounded-bl-sm shadow-sm">
            <div className="flex gap-[5px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-[7px] h-[7px] bg-accent/50 rounded-full inline-block"
                  style={{
                    animation: "pulse-dot 1.4s infinite ease-in-out",
                    animationDelay: `${i * 0.2}s`,
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
