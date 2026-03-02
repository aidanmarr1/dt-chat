"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import UserProfilePopover from "./UserProfilePopover";
import type { OnlineUser } from "@/lib/types";

interface OnlineUsersProps {
  users: OnlineUser[];
  count: number;
  currentUserId?: string;
  typingUsers?: string[];
}

export default function OnlineUsers({ users, count, currentUserId, typingUsers = [] }: OnlineUsersProps) {
  const [open, setOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && users.length > 5 && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, users.length]);

  const previewUsers = users.slice(0, 3);
  const extraCount = Math.max(0, count - 3);

  const filteredUsers = search
    ? users.filter((u) => u.displayName.toLowerCase().includes(search.toLowerCase()))
    : users;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors group"
      >
        {/* Avatar stack */}
        <div className="flex items-center -space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-online-pulse glow-green mr-1" />
          {previewUsers.map((u, i) => (
            <div key={u.id} className="ring-2 ring-background rounded-full transition-transform group-hover:translate-x-0" style={{ zIndex: 3 - i }}>
              <Avatar displayName={u.displayName} userId={u.id} avatarId={u.avatarId} size="sm" />
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-surface border-2 border-background flex items-center justify-center text-[9px] font-bold text-muted" style={{ zIndex: 0 }}>
              +{extraCount}
            </div>
          )}
        </div>
        <span>{count} online</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-60 max-w-[calc(100vw-1.5rem)] bg-surface/95 backdrop-blur-md border border-border rounded-xl shadow-xl animate-slide-down overflow-hidden z-30">
          <div className="px-3 py-2.5 border-b border-border">
            <p className="text-xs font-semibold text-foreground font-heading">Online Now</p>
            <p className="text-[10px] text-muted">{users.length} {users.length === 1 ? "person" : "people"} active</p>
          </div>
          {/* Search filter for larger groups */}
          {users.length > 5 && (
            <div className="px-2 py-1.5 border-b border-border">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people..."
                className="w-full bg-background rounded-lg px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted/50 border border-border focus:border-accent/50 focus:outline-none transition-colors"
              />
            </div>
          )}
          <div className="max-h-[50vh] sm:max-h-52 overflow-y-auto p-1.5">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-muted text-center py-3">No matches</p>
            ) : (
              filteredUsers.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => setProfileUserId(u.id)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2.5 sm:py-2 rounded-lg hover:bg-background/60 transition-colors animate-fade-in text-left"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="relative">
                    <Avatar displayName={u.displayName} userId={u.id} avatarId={u.avatarId} size="sm" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface glow-green" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-foreground truncate block">
                      {u.displayName}
                      {u.id === currentUserId && (
                        <span className="ml-1.5 text-[9px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </span>
                    {typingUsers.includes(u.displayName) ? (
                      <span className="text-[10px] text-accent truncate block flex items-center gap-1">
                        typing
                        <span className="inline-flex gap-[2px]">
                          {[0, 1, 2].map((di) => (
                            <span key={di} className="w-[3px] h-[3px] bg-accent rounded-full inline-block" style={{ animation: "pulse-dot 1.4s infinite ease-in-out", animationDelay: `${di * 0.2}s` }} />
                          ))}
                        </span>
                      </span>
                    ) : u.status ? (
                      <span className="text-[10px] text-muted truncate block">{u.status}</span>
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {profileUserId && (
        <UserProfilePopover
          userId={profileUserId}
          currentUserId={currentUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}
    </div>
  );
}
