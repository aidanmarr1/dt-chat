"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import DateSeparator from "./DateSeparator";
import TypingIndicator from "./TypingIndicator";
import OnlineUsers from "./OnlineUsers";
import ThemeToggle from "./ThemeToggle";
import SoundToggle from "./SoundToggle";
import SettingsMenu from "./SettingsMenu";
import SearchMessages from "./SearchMessages";
import PinnedMessages from "./PinnedMessages";
import { playNotificationSound } from "@/lib/sounds";
import type { Message, User, OnlineUser } from "@/lib/types";

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function isGroupable(a: Message, b: Message): boolean {
  if (a.userId !== b.userId) return false;
  const diff = Math.abs(
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return diff < 2 * 60 * 1000;
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [headerShadow, setHeaderShadow] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const router = useRouter();

  // Load sound preference
  useEffect(() => {
    const stored = localStorage.getItem("dt-sound");
    if (stored === "false") setSoundEnabled(false);
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("dt-sound", String(next));
  }

  // Update page title with unread indicator
  useEffect(() => {
    document.title = showNewMessages ? "(New) D&T Chat" : "D&T Chat";
  }, [showNewMessages]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector<HTMLTextAreaElement>("textarea")?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessages(false);
  }, []);

  function scrollToMessage(messageId: string) {
    const el = document.getElementById(messageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("animate-highlight");
      // Force reflow to restart animation
      void el.offsetWidth;
      el.classList.add("animate-highlight");
    }
  }

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/auth");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      });
  }, [router]);

  // Poll for messages
  useEffect(() => {
    if (!user) return;

    async function fetchMessages() {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const data = await res.json();

        const newMessages: Message[] = data.messages.map(
          (m: { createdAt: string | Date } & Omit<Message, "createdAt">) => ({
            ...m,
            createdAt:
              typeof m.createdAt === "string"
                ? m.createdAt
                : new Date(m.createdAt).toISOString(),
          })
        );

        setOnlineCount(data.onlineCount);
        setOnlineUsers(data.onlineUsers || []);
        setTypingUsers(data.typingUsers || []);

        if (newMessages.length > 0) {
          const latestId = newMessages[newMessages.length - 1].id;
          if (latestId !== latestMessageIdRef.current) {
            const prevLatest = latestMessageIdRef.current;
            if (
              prevLatest &&
              soundEnabled &&
              newMessages[newMessages.length - 1].userId !== user!.id
            ) {
              playNotificationSound();
            }

            latestMessageIdRef.current = latestId;
            setMessages(newMessages);

            if (isNearBottom()) {
              setTimeout(() => scrollToBottom(), 50);
            } else {
              setShowNewMessages(true);
            }
          } else {
            setMessages(newMessages);
          }
        }
      } catch {
        // Silently retry on next poll
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [user, isNearBottom, scrollToBottom, soundEnabled]);

  async function handleSend(
    content: string,
    file?: { fileName: string; fileType: string; fileSize: number; filePath: string },
    replyToId?: string
  ) {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, ...file, replyToId }),
      });

      if (!res.ok) return;
      const data = await res.json();

      const newMsg: Message = {
        ...data.message,
        createdAt:
          typeof data.message.createdAt === "string"
            ? data.message.createdAt
            : new Date(data.message.createdAt).toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      latestMessageIdRef.current = newMsg.id;
      setTimeout(() => scrollToBottom(), 50);
    } catch {
      // Handle error silently
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = [...(msg.reactions || [])];
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            if (existing.reacted) {
              existing.count--;
              existing.reacted = false;
              if (existing.count <= 0) {
                return { ...msg, reactions: reactions.filter((r) => r.emoji !== emoji) };
              }
            } else {
              existing.count++;
              existing.reacted = true;
            }
          } else {
            reactions.push({ emoji, count: 1, reacted: true });
          }
          return { ...msg, reactions };
        })
      );
    } catch {
      // Handle silently
    }
  }

  async function handleEdit(messageId: string, content: string) {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, editedAt: new Date().toISOString() }
              : msg
          )
        );
      }
    } catch {
      // Handle silently
    }
  }

  async function handleDelete(messageId: string) {
    try {
      const res = await fetch(`/api/messages/${messageId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: "", isDeleted: true } : msg
          )
        );
      }
    } catch {
      // Handle silently
    }
  }

  async function handlePin(messageId: string) {
    // Determine desired action from current local state
    const msg = messages.find((m) => m.id === messageId);
    const wantAction = msg?.isPinned ? "unpin" : "pin";

    // Optimistically update local state immediately
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              isPinned: wantAction === "pin",
              pinnedByName: wantAction === "pin" ? user!.displayName : null,
            }
          : m
      )
    );

    try {
      await fetch(`/api/messages/${messageId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: wantAction }),
      });
    } catch {
      // Revert on failure
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                isPinned: wantAction !== "pin",
                pinnedByName: wantAction !== "pin" ? msg?.pinnedByName ?? null : null,
              }
            : m
        )
      );
    }
  }

  function handleTyping() {
    fetch("/api/typing", { method: "POST" }).catch(() => {});
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  }

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  // Build grouped messages with day separators
  function renderMessages() {
    const elements: React.ReactNode[] = [];
    let lastDate = "";

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const msgDate = new Date(msg.createdAt).toDateString();

      if (msgDate !== lastDate) {
        elements.push(<DateSeparator key={`date-${msgDate}`} date={msg.createdAt} />);
        lastDate = msgDate;
      }

      const prev = i > 0 ? messages[i - 1] : null;
      const isGrouped = prev ? isGroupable(prev, msg) && isSameDay(prev.createdAt, msg.createdAt) : false;

      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.userId === user!.id}
          isGrouped={isGrouped}
          onReaction={handleReaction}
          onReply={(m) => setReplyingTo(m)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      );
    }

    return elements;
  }

  if (!user) {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border glass">
          <div>
            <div className="h-5 w-24 rounded-md animate-shimmer" />
            <div className="h-3 w-16 rounded-md animate-shimmer mt-1.5" style={{ animationDelay: "0.1s" }} />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-lg animate-shimmer" style={{ animationDelay: "0.2s" }} />
            <div className="h-8 w-8 rounded-lg animate-shimmer" style={{ animationDelay: "0.25s" }} />
            <div className="h-8 w-8 rounded-lg animate-shimmer" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-5">
          {[0.6, 0.4, 0.75, 0.5, 0.35, 0.55].map((w, i) => (
            <div key={i} className={`flex animate-fade-in ${i % 3 === 1 ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${i * 0.1}s` }}>
              {i % 3 !== 1 && <div className="w-7 h-7 rounded-full animate-shimmer mr-2.5 mt-auto shrink-0" />}
              <div className="space-y-1.5" style={{ width: `${w * 55}%` }}>
                {i % 3 !== 1 && <div className="h-3 w-16 rounded-md animate-shimmer" />}
                <div className={`rounded-2xl animate-shimmer ${i % 3 === 1 ? "h-10" : "h-12"}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-4 py-4 glass">
          <div className="h-11 rounded-xl animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Header */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border glass transition-shadow ${headerShadow ? "shadow-lg shadow-background/50" : ""}`}>
        <div className="min-w-0 mr-2">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight">D&T <span className="text-accent">Chat</span></h1>
          <OnlineUsers users={onlineUsers} count={onlineCount} />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="text-sm text-muted hidden md:inline">{user.displayName}</span>
          {/* Search */}
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 sm:p-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95"
            title="Search (Ctrl+F)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <SoundToggle enabled={soundEnabled} onToggle={toggleSound} />
          <SettingsMenu
            user={user}
            onAvatarChange={(avatarId) => setUser((prev) => prev ? { ...prev, avatarId } : prev)}
          />
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="text-xs text-muted hover:text-foreground transition-all active:scale-95 px-2 sm:px-2.5 py-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface hidden sm:block"
          >
            Log out
          </button>
          {/* Mobile logout - icon only */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95 sm:hidden"
            title="Log out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <SearchMessages
          onClose={() => setShowSearch(false)}
          onScrollTo={scrollToMessage}
        />
      )}

      {/* Pinned messages */}
      <PinnedMessages
        messages={pinnedMessages}
        onScrollTo={scrollToMessage}
        onUnpin={handlePin}
      />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain scroll-smooth"
        onScroll={(e) => {
          const el = e.target as HTMLElement;
          setHeaderShadow(el.scrollTop > 0);
          setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center animate-gentle-float">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <p className="text-foreground font-medium mb-1">No messages yet</p>
              <p className="text-muted text-sm">Start the conversation!</p>
              <p className="text-muted/50 text-xs mt-2">Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-muted text-[10px] font-mono">/</kbd> to focus input</p>
            </div>
          </div>
        ) : (
          renderMessages()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Scroll to bottom / New messages indicator */}
      {!isAtBottom && (
        <div className="flex justify-center -mt-12 mb-2 relative z-10 animate-slide-up">
          <button
            onClick={scrollToBottom}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all active:scale-95 shadow-lg backdrop-blur-sm ${
              showNewMessages
                ? "bg-accent text-background shadow-accent/20 animate-glow-pulse"
                : "bg-surface/90 border border-border text-foreground hover:border-accent hover:text-accent"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            {showNewMessages ? "New messages" : "Scroll to bottom"}
          </button>
        </div>
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
