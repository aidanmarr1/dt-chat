"use client";

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from "react";
import { useRouter } from "next/navigation";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import DateSeparator from "./DateSeparator";
import TypingIndicator from "./TypingIndicator";
import OnlineUsers from "./OnlineUsers";
import SettingsMenu from "./SettingsMenu";
import SearchMessages from "./SearchMessages";
import PinnedMessages from "./PinnedMessages";
import BookmarksPanel from "./BookmarksPanel";
import MediaGallery from "./MediaGallery";
import PollCreator from "./PollCreator";
import CelebrationEffects from "./CelebrationEffects";
import ReminderPicker from "./ReminderPicker";
import RemindersPanel from "./RemindersPanel";
import StatusPicker from "./StatusPicker";
import ThreadPanel from "./ThreadPanel";
import TodoPanel from "./TodoPanel";
import ConfirmDialog from "./ConfirmDialog";
import KeyboardShortcuts from "./KeyboardShortcuts";
import ImageLightbox from "./ImageLightbox";
import { useToast } from "./Toast";
import { playNotificationSound } from "@/lib/sounds";
import type { Message, User, OnlineUser, Bookmark, Reminder } from "@/lib/types";
import { fetchSettings, saveSetting } from "@/lib/settings-sync";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Merge server messages with local pending/older/deleted optimistic state */
function mergeMessages(
  prev: Message[],
  newMessages: Message[],
  pendingIds: Set<string>,
  olderIds: Set<string>,
  pendingDeleteIds: Set<string>,
): Message[] {
  const serverIds = new Set(newMessages.map((m) => m.id));
  const pendingMsgs = prev.filter(
    (m) => pendingIds.has(m.id) && !serverIds.has(m.id)
  );
  const olderMsgs = prev.filter(
    (m) => olderIds.has(m.id) && !serverIds.has(m.id)
  );
  // Clean up pending IDs the server now knows about
  for (const id of pendingIds) {
    if (serverIds.has(id)) pendingIds.delete(id);
  }
  let merged = [...olderMsgs, ...newMessages, ...pendingMsgs];
  // Filter out optimistically deleted messages
  if (pendingDeleteIds.size > 0) {
    merged = merged.filter((m) => !pendingDeleteIds.has(m.id));
    for (const id of pendingDeleteIds) {
      if (!serverIds.has(id)) pendingDeleteIds.delete(id);
    }
  }
  return merged;
}

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [headerShadow, setHeaderShadow] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [isOffline, setIsOffline] = useState(false);
  const [failedPolls, setFailedPolls] = useState(0);
  const failedPollsRef = useRef(0);
  // Feature 1: Celebration Effects
  const [reduceMotion, setReduceMotion] = useState(false);
  // Feature 2: Reminders
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  // Feature 3: Status
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  // Feature 4: Threads
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  // Feature 5: Todos
  const [showTodos, setShowTodos] = useState(false);
  const [todoCount, setTodoCount] = useState(0);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const olderMessageIdsRef = useRef<Set<string>>(new Set());
  const unreadSeparatorIdRef = useRef<string | null>(null);
  const unreadSeparatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todoCountFetched = useRef(false);
  const newMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const lastReadReceiptRef = useRef<string | null>(null);
  const lastSeenCountRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const pendingMessageIdsRef = useRef<Set<string>>(new Set());
  const pendingDeleteIdsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const { toast } = useToast();

  // Keep refs in sync with state (avoids stale closures in polling/intervals)
  messagesRef.current = messages;
  failedPollsRef.current = failedPolls;

  // Compute online user IDs for message avatar presence dots
  const onlineUserIds = useMemo(() => new Set(onlineUsers.map(u => u.id)), [onlineUsers]);

  // Update browser tab title with unread count
  useEffect(() => {
    function updateTitle() {
      if (unreadCount > 0 && (document.visibilityState === "hidden" || !isAtBottom)) {
        document.title = `(${unreadCount}) D&T Chat`;
      } else {
        document.title = "D&T Chat";
      }
    }
    updateTitle();
    document.addEventListener("visibilitychange", updateTitle);
    return () => {
      document.removeEventListener("visibilitychange", updateTitle);
      document.title = "D&T Chat";
    };
  }, [unreadCount, isAtBottom]);

  // Track online/offline status
  useEffect(() => {
    function goOffline() { setIsOffline(true); }
    function goOnline() { setIsOffline(false); setFailedPolls(0); setWasOffline(true); }
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Reconnection success toast
  useEffect(() => {
    if (wasOffline && !isOffline && failedPolls < 3) {
      toast("Back online!", "success");
      setWasOffline(false);
    }
  }, [wasOffline, isOffline, failedPolls, toast]);

  // Load sound + notification preferences
  useEffect(() => {
    const stored = localStorage.getItem("dt-sound");
    if (stored === "false") setSoundEnabled(false);
    const notifStored = localStorage.getItem("dt-notifications");
    if (notifStored === "true" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      setNotificationsEnabled(true);
    }
    const tf = localStorage.getItem("dt-time-format");
    if (tf === "24h") setTimeFormat("24h");
    // Load reduce motion preference
    const rm = localStorage.getItem("dt-reduce-motion");
    if (rm === "true") setReduceMotion(true);

    // Load bookmarks from DB
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data) => {
        if (data.bookmarks && data.bookmarks.length > 0) {
          setBookmarks(data.bookmarks);
        } else {
          // One-time migration from localStorage
          try {
            const stored = localStorage.getItem("dt-bookmarks");
            if (stored) {
              const local: Bookmark[] = JSON.parse(stored);
              if (local.length > 0) {
                Promise.all(
                  local.map((b) =>
                    fetch("/api/bookmarks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(b),
                    }).then((r) => r.json())
                  )
                ).then((results) => {
                  const migrated = results
                    .filter((r) => r.bookmark)
                    .map((r) => r.bookmark);
                  if (migrated.length > 0) setBookmarks(migrated);
                  localStorage.removeItem("dt-bookmarks");
                });
              }
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => {
        // Fallback: load from localStorage if API fails
        try {
          const stored = localStorage.getItem("dt-bookmarks");
          if (stored) setBookmarks(JSON.parse(stored));
        } catch { /* ignore */ }
      });

    // Load reminders from DB
    fetch("/api/reminders")
      .then((res) => res.json())
      .then((data) => {
        if (data.reminders && data.reminders.length > 0) {
          setReminders(data.reminders);
        } else {
          // One-time migration from localStorage
          try {
            const stored = localStorage.getItem("dt-reminders");
            if (stored) {
              const local: Reminder[] = JSON.parse(stored);
              if (local.length > 0) {
                Promise.all(
                  local.map((r) =>
                    fetch("/api/reminders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(r),
                    }).then((res) => res.json())
                  )
                ).then((results) => {
                  const migrated = results
                    .filter((r) => r.reminder)
                    .map((r) => r.reminder);
                  if (migrated.length > 0) setReminders(migrated);
                  localStorage.removeItem("dt-reminders");
                });
              }
            }
          } catch { /* ignore */ }
        }
      })
      .catch(() => {
        // Fallback: load from localStorage if API fails
        try {
          const stored = localStorage.getItem("dt-reminders");
          if (stored) setReminders(JSON.parse(stored));
        } catch { /* ignore */ }
      });

    // Sync settings from DB (DB is authoritative for cross-device sync)
    fetchSettings().then(s => {
      if (Object.keys(s).length === 0) return;

      if (s["dt-sound"]) {
        localStorage.setItem("dt-sound", s["dt-sound"]);
        setSoundEnabled(s["dt-sound"] !== "false");
      }

      if (s["dt-notifications"]) {
        localStorage.setItem("dt-notifications", s["dt-notifications"]);
        if (s["dt-notifications"] === "true" && typeof Notification !== "undefined" && Notification.permission === "granted") {
          setNotificationsEnabled(true);
        } else {
          setNotificationsEnabled(false);
        }
      }

      if (s["dt-time-format"]) {
        if (s["dt-time-format"] === "24h") {
          localStorage.setItem("dt-time-format", "24h");
          setTimeFormat("24h");
        } else {
          localStorage.removeItem("dt-time-format");
          setTimeFormat("12h");
        }
      }

      if (s["dt-reduce-motion"]) {
        if (s["dt-reduce-motion"] === "true") {
          localStorage.setItem("dt-reduce-motion", "true");
          setReduceMotion(true);
        } else {
          localStorage.removeItem("dt-reduce-motion");
          setReduceMotion(false);
        }
      }
    });
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("dt-sound", String(next));
    saveSetting("dt-sound", String(next));
  }

  function toggleNotifications() {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem("dt-notifications", "false");
      saveSetting("dt-notifications", "false");
      return;
    }
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      setNotificationsEnabled(true);
      localStorage.setItem("dt-notifications", "true");
      saveSetting("dt-notifications", "true");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          setNotificationsEnabled(true);
          localStorage.setItem("dt-notifications", "true");
          saveSetting("dt-notifications", "true");
        }
      });
    }
  }

  // Update page title with unread indicator + clear on tab focus
  useEffect(() => {
    if (showNewMessages && unreadCount > 0) {
      document.title = `(${unreadCount}) D&T Chat`;
    } else if (showNewMessages) {
      document.title = "(New) D&T Chat";
    } else {
      document.title = "D&T Chat";
    }
  }, [showNewMessages, unreadCount]);

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden && isAtBottom) {
        setShowNewMessages(false);
        setUnreadCount(0);
        document.title = "D&T Chat";
        // Auto-scroll to bottom when returning to tab if user was at bottom
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAtBottom]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable) return;
      if (e.key === "/") {
        e.preventDefault();
        // The input is a contentEditable div, not a textarea
        document.querySelector<HTMLDivElement>('[role="textbox"][contenteditable]')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setShowBookmarks((prev) => !prev);
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Throttled scroll handler using rAF — avoids excessive state updates during fast scrolling
  const scrollRafRef = useRef(0);
  const handleScroll = useCallback((e: React.UIEvent) => {
    if (scrollRafRef.current) return;
    // Capture target before entering rAF to avoid stale event reference
    const el = e.target as HTMLElement;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      setHeaderShadow(el.scrollTop > 0);
      setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
    });
  }, []);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessages(false);
    setUnreadCount(0);
    if (latestMessageIdRef.current) {
      postReadReceipt(latestMessageIdRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollToMessage(messageId: string) {
    const el = document.getElementById(messageId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("animate-highlight");
      // Force reflow to restart animation
      void el.offsetWidth;
      el.classList.add("animate-highlight");
    } else {
      toast("Message is outside current view", "info");
    }
  }

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 403) {
          router.push("/");
          return null;
        }
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
        const sinceParam = latestMessageIdRef.current ? `?since=${latestMessageIdRef.current}` : "";
        const res = await fetch(`/api/messages${sinceParam}`);
        if (res.status === 403) { router.push("/"); return; }
        if (!res.ok) { setFailedPolls((prev) => prev + 1); return; }
        const data = await res.json();

        // Successful poll — clear failed state
        setFailedPolls((prev) => {
          if (prev >= 3) setWasOffline(true);
          return 0;
        });
        setIsOffline((prev) => {
          if (prev) setWasOffline(true);
          return false;
        });

        // Lightweight poll — nothing changed, only update online/typing
        if (data.messages === null) {
          startTransition(() => {
            setOnlineCount(data.onlineCount);
            setOnlineUsers(data.onlineUsers || []);
            setTypingUsers(data.typingUsers || []);
          });
          return;
        }

        const newMessages: Message[] = data.messages.map(
          (m: { createdAt: string | Date } & Omit<Message, "createdAt">) => ({
            ...m,
            createdAt:
              typeof m.createdAt === "string"
                ? m.createdAt
                : new Date(m.createdAt).toISOString(),
          })
        );

        startTransition(() => {
          setOnlineCount(data.onlineCount);
          setOnlineUsers(data.onlineUsers || []);
          setTypingUsers(data.typingUsers || []);
          if (typeof data.hasMore === "boolean") setHasOlderMessages(data.hasMore);
        });

        if (newMessages.length > 0) {
          // Mark as loaded after first successful fetch
          if (!messagesLoaded) setMessagesLoaded(true);

          const latestId = newMessages[newMessages.length - 1].id;
          if (latestId !== latestMessageIdRef.current) {
            const prevLatest = latestMessageIdRef.current;
            // Track new messages (arrived after initial load) — use ref to avoid stale closure
            if (prevLatest) {
              const existingIds = new Set(messagesRef.current.map((m) => m.id));
              for (const nm of newMessages) {
                if (!existingIds.has(nm.id)) {
                  newMessageIdsRef.current.add(nm.id);
                  // Auto-clear after 3s so animation doesn't replay
                  const nmId = nm.id;
                  setTimeout(() => newMessageIdsRef.current.delete(nmId), 3000);
                  // Set unread separator to first new message when user is scrolled up
                  if (!isNearBottom() && !unreadSeparatorIdRef.current) {
                    unreadSeparatorIdRef.current = nm.id;
                  }
                }
              }
            }
            const lastMsg = newMessages[newMessages.length - 1];
            if (prevLatest && lastMsg.userId !== user!.id) {
              if (soundEnabled) playNotificationSound();
              if (
                notificationsEnabled &&
                typeof Notification !== "undefined" &&
                Notification.permission === "granted" &&
                document.visibilityState === "hidden"
              ) {
                new Notification(lastMsg.displayName, {
                  body: lastMsg.content || lastMsg.fileName || "Sent a file",
                  tag: "dt-chat",
                });
              }
            }

            latestMessageIdRef.current = latestId;

            // Merge: keep any pending optimistic messages + older history the server hasn't returned
            setMessages((prev) => mergeMessages(
              prev, newMessages, pendingMessageIdsRef.current, olderMessageIdsRef.current, pendingDeleteIdsRef.current
            ));

            if (isNearBottom()) {
              setTimeout(() => scrollToBottom(), 50);
              postReadReceipt(latestId);
              lastSeenCountRef.current = newMessages.length;
            } else {
              // Absolute unread count formula — avoids stale closure issues
              const newCount = newMessages.length - lastSeenCountRef.current;
              if (newCount > 0) {
                setUnreadCount(newCount);
              }
              setShowNewMessages(true);
            }
          } else {
            // Same latest ID — still merge pending messages
            setMessages((prev) => mergeMessages(
              prev, newMessages, pendingMessageIdsRef.current, olderMessageIdsRef.current, pendingDeleteIdsRef.current
            ));
          }
        }
      } catch {
        setFailedPolls((prev) => prev + 1);
      }
    }

    fetchMessages();
    // Adaptive polling: faster when active, slower after failures, slower when tab hidden
    let pollTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    async function poll() {
      if (cancelled) return;
      await fetchMessages();
      if (cancelled) return;
      const fp = failedPollsRef.current;
      const hidden = document.visibilityState === "hidden";
      // Base delay: 2s active, 8s hidden; backoff on failures up to 30s
      const baseDelay = hidden ? 8000 : 2000;
      const delay = fp > 0
        ? Math.min(baseDelay * Math.pow(2, fp), 30000)
        : baseDelay;
      pollTimer = setTimeout(poll, delay);
    }
    pollTimer = setTimeout(poll, 2000);
    // Resume fast polling when tab becomes visible again
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        clearTimeout(pollTimer);
        poll();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { cancelled = true; clearTimeout(pollTimer); document.removeEventListener("visibilitychange", handleVisibility); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isNearBottom, scrollToBottom, soundEnabled, notificationsEnabled]);

  // When user scrolls to bottom, reset unread
  useEffect(() => {
    if (isAtBottom) {
      setShowNewMessages(false);
      setUnreadCount(0);
      lastSeenCountRef.current = messages.length;
      // Clear unread separator after a delay so user sees it briefly
      if (unreadSeparatorIdRef.current) {
        if (unreadSeparatorTimeoutRef.current) clearTimeout(unreadSeparatorTimeoutRef.current);
        unreadSeparatorTimeoutRef.current = setTimeout(() => {
          unreadSeparatorIdRef.current = null;
          unreadSeparatorTimeoutRef.current = null;
        }, 5000);
      }
    }
  }, [isAtBottom, messages.length]);

  const loadingOlderLockRef = useRef(false);
  async function loadOlderMessages() {
    if (loadingOlderLockRef.current || messages.length === 0) return;
    loadingOlderLockRef.current = true;
    const oldestId = messages[0].id;
    setLoadingOlder(true);
    try {
      const res = await fetch(`/api/messages?before=${oldestId}`);
      if (!res.ok) return;
      const data = await res.json();
      const olderMsgs: Message[] = (data.messages || []).map(
        (m: { createdAt: string | Date } & Omit<Message, "createdAt">) => ({
          ...m,
          createdAt:
            typeof m.createdAt === "string"
              ? m.createdAt
              : new Date(m.createdAt).toISOString(),
        })
      );
      if (olderMsgs.length > 0) {
        // Track these IDs so polling preserves them
        for (const m of olderMsgs) olderMessageIdsRef.current.add(m.id);
        // Preserve scroll position
        const container = scrollContainerRef.current;
        const prevHeight = container?.scrollHeight || 0;
        setMessages((prev) => [...olderMsgs, ...prev]);
        // Restore scroll position after render — double rAF for paint reliability
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (container) {
              const newHeight = container.scrollHeight;
              container.scrollTop += newHeight - prevHeight;
            }
          });
        });
      }
      setHasOlderMessages(data.hasMore === true);
    } catch {
      toast("Failed to load older messages", "error");
    } finally {
      setLoadingOlder(false);
      loadingOlderLockRef.current = false;
    }
  }

  async function handleSend(
    content: string,
    file?: { fileName: string; fileType: string; fileSize: number; filePath: string },
    replyToId?: string
  ) {
    try {
      // Post read receipt after sending
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, ...file, replyToId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || "Failed to send message", "error");
        return;
      }
      const data = await res.json();

      const newMsg: Message = {
        ...data.message,
        createdAt:
          typeof data.message.createdAt === "string"
            ? data.message.createdAt
            : new Date(data.message.createdAt).toISOString(),
      };

      // Track as pending so polling merges it until server catches up
      pendingMessageIdsRef.current.add(newMsg.id);
      setTimeout(() => pendingMessageIdsRef.current.delete(newMsg.id), 10000);

      setMessages((prev) => {
        lastSeenCountRef.current = prev.length + 1;
        return [...prev, newMsg];
      });
      latestMessageIdRef.current = newMsg.id;
      setTimeout(() => scrollToBottom(), 50);
    } catch {
      toast("Failed to send message", "error");
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      const myName = user?.displayName || "You";
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const reactions = (msg.reactions || []).map((r) => ({ ...r, reactedByNames: [...(r.reactedByNames || [])] }));
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            if (existing.reacted) {
              const newCount = existing.count - 1;
              const newNames = existing.reactedByNames.filter((n) => n !== myName);
              if (newCount <= 0) {
                return { ...msg, reactions: reactions.filter((r) => r.emoji !== emoji) };
              }
              return { ...msg, reactions: reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: newCount, reacted: false, reactedByNames: newNames } : r
              )};
            } else {
              return { ...msg, reactions: reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true, reactedByNames: [...r.reactedByNames, myName] } : r
              )};
            }
          } else {
            return { ...msg, reactions: [...reactions, { emoji, count: 1, reacted: true, reactedByNames: [myName] }] };
          }
        })
      );
    } catch {
      toast("Failed to react", "error");
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
        const data = await res.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, editedAt: new Date().toISOString(), linkPreviews: data.linkPreviews ?? [] }
              : msg
          )
        );
        toast("Message edited");
      }
    } catch {
      toast("Failed to edit", "error");
    }
  }

  function handleDelete(messageId: string) {
    setDeleteConfirmId(messageId);
  }

  async function confirmDelete() {
    const messageId = deleteConfirmId;
    if (!messageId) return;
    setDeleteConfirmId(null);

    // Track optimistic deletion so polling doesn't re-add it
    pendingDeleteIdsRef.current.add(messageId);
    setTimeout(() => pendingDeleteIdsRef.current.delete(messageId), 10000);

    // Save message for revert, animate exit then remove
    const savedMsg = messages.find((m) => m.id === messageId);
    setDeletingIds((prev) => new Set(prev).add(messageId));
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDeletingIds((prev) => { const next = new Set(prev); next.delete(messageId); return next; });
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Message deleted");
      } else {
        // Revert on failure — re-insert the saved message
        if (savedMsg) {
          setMessages((prev) => [...prev, savedMsg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
        }
        pendingDeleteIdsRef.current.delete(messageId);
        toast("Failed to delete", "error");
      }
    } catch {
      if (savedMsg) {
        setMessages((prev) => [...prev, savedMsg].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      }
      pendingDeleteIdsRef.current.delete(messageId);
      toast("Failed to delete", "error");
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

    toast(wantAction === "pin" ? "Message pinned" : "Message unpinned");

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
      toast("Failed to update pin", "error");
    }
  }

  async function handleUpdatePinLabel(messageId: string, label: string) {
    const trimmed = label.trim();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, pinLabel: trimmed || null } : m
      )
    );
    try {
      await fetch(`/api/messages/${messageId}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmed }),
      });
    } catch {
      toast("Failed to update label", "error");
    }
  }

  function handleBookmark(messageId: string) {
    const exists = bookmarks.find((b) => b.messageId === messageId);
    if (exists) {
      // Optimistic remove
      const prev = bookmarks;
      setBookmarks((b) => b.filter((x) => x.messageId !== messageId));
      toast("Bookmark removed");
      fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      }).catch(() => {
        setBookmarks(prev);
        toast("Failed to remove bookmark", "error");
      });
    } else {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg) return;
      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        messageId: msg.id,
        content: msg.content,
        displayName: msg.displayName,
        createdAt: msg.createdAt,
        bookmarkedAt: new Date().toISOString(),
        fileName: msg.fileName,
      };
      // Optimistic add
      const prev = bookmarks;
      setBookmarks((b) => [newBookmark, ...b]);
      toast("Message bookmarked");
      fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msg.id,
          content: msg.content,
          displayName: msg.displayName,
          createdAt: msg.createdAt,
          fileName: msg.fileName,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.bookmark) {
            // Update with server-assigned id
            setBookmarks((b) =>
              b.map((x) => (x.id === newBookmark.id ? { ...x, id: data.bookmark.id } : x))
            );
          }
        })
        .catch(() => {
          setBookmarks(prev);
          toast("Failed to bookmark message", "error");
        });
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    // Optimistic update
    setMessages((prev) =>
      prev.map((msg) => {
        if (!msg.poll || msg.poll.id !== pollId) return msg;
        const currentVoted = msg.poll.options.find((o) => o.voted);
        const updatedOptions = msg.poll.options.map((o) => {
          if (o.id === optionId) {
            // Toggle this option
            if (o.voted) {
              return { ...o, voted: false, votes: o.votes - 1 };
            }
            return { ...o, voted: true, votes: o.votes + 1 };
          }
          // Remove vote from previously voted option
          if (currentVoted && o.id === currentVoted.id && currentVoted.id !== optionId) {
            return { ...o, voted: false, votes: o.votes - 1 };
          }
          return o;
        });

        const clickedWasVoted = msg.poll.options.find((o) => o.id === optionId)?.voted;
        const totalDelta = clickedWasVoted ? -1 : (currentVoted && currentVoted.id !== optionId ? 0 : 1);

        return {
          ...msg,
          poll: {
            ...msg.poll,
            options: updatedOptions,
            totalVotes: msg.poll.totalVotes + totalDelta,
          },
        };
      })
    );

    try {
      await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
    } catch {
      toast("Failed to vote", "error");
    }
  }

  async function handleCreatePoll(question: string, options: string[]) {
    setShowPollCreator(false);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options }),
      });
      if (!res.ok) {
        toast("Failed to create poll", "error");
        return;
      }
      const data = await res.json();
      const newMsg: Message = {
        ...data.message,
        createdAt:
          typeof data.message.createdAt === "string"
            ? data.message.createdAt
            : new Date(data.message.createdAt).toISOString(),
      };
      setMessages((prev) => {
        lastSeenCountRef.current = prev.length + 1;
        return [...prev, newMsg];
      });
      latestMessageIdRef.current = newMsg.id;
      setTimeout(() => scrollToBottom(), 50);
    } catch {
      toast("Failed to create poll", "error");
    }
  }

  function postReadReceipt(messageId: string) {
    if (messageId === lastReadReceiptRef.current) return;
    lastReadReceiptRef.current = messageId;
    fetch("/api/read-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastReadMessageId: messageId }),
    }).catch(() => {});
  }

  function handleTyping() {
    fetch("/api/typing", { method: "POST" }).catch(() => {});
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  }

  // Fetch todo count on mount for badge
  useEffect(() => {
    if (todoCountFetched.current) return;
    todoCountFetched.current = true;
    fetch("/api/todos")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.todos) {
          setTodoCount(data.todos.filter((t: { completed: boolean }) => !t.completed).length);
        }
      })
      .catch(() => {});
  }, []);

  // === Feature 2: Reminder handlers ===
  function handleSetReminder(messageId: string, reminderTime: number) {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const tempId = crypto.randomUUID();
    const reminder: Reminder = {
      id: tempId,
      messageId,
      messagePreview: msg.content?.slice(0, 100) || msg.fileName || "Message",
      reminderTime,
      createdAt: Date.now(),
    };
    // Optimistic add
    const prev = reminders;
    setReminders((r) => [...r, reminder]);
    toast("Reminder set");
    fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId,
        messagePreview: reminder.messagePreview,
        reminderTime,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reminder) {
          setReminders((r) =>
            r.map((x) => (x.id === tempId ? { ...x, id: data.reminder.id } : x))
          );
        }
      })
      .catch(() => {
        setReminders(prev);
        toast("Failed to set reminder", "error");
      });
  }

  function handleDeleteReminder(reminderId: string) {
    // Optimistic remove
    const prev = reminders;
    setReminders((r) => r.filter((x) => x.id !== reminderId));
    toast("Reminder removed");
    fetch(`/api/reminders/${reminderId}`, { method: "DELETE" }).catch(() => {
      setReminders(prev);
      toast("Failed to delete reminder", "error");
    });
  }

  // Snooze a reminder
  function handleSnoozeReminder(reminder: Reminder, minutes: number) {
    const tempId = crypto.randomUUID();
    const snoozed: Reminder = {
      ...reminder,
      id: tempId,
      reminderTime: Date.now() + minutes * 60 * 1000,
    };
    // Optimistic: remove old, add snoozed
    const prev = reminders;
    setReminders((r) => [...r.filter((x) => x.id !== reminder.id), snoozed]);
    toast(`Snoozed for ${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}`);
    // Delete old + create new via API
    fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" }).catch(() => {});
    fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: snoozed.messageId,
        messagePreview: snoozed.messagePreview,
        reminderTime: snoozed.reminderTime,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.reminder) {
          setReminders((r) =>
            r.map((x) => (x.id === tempId ? { ...x, id: data.reminder.id } : x))
          );
        }
      })
      .catch(() => {
        setReminders(prev);
        toast("Failed to snooze reminder", "error");
      });
  }

  // Check reminders periodically — use messagesRef to avoid restarting interval on every poll
  useEffect(() => {
    if (reminders.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const currentMessages = messagesRef.current;

      // Orphan cleanup: remove reminders whose message no longer exists
      const messageIds = new Set(currentMessages.map((m) => m.id));
      const orphans = reminders.filter((r) => !messageIds.has(r.messageId) && currentMessages.length > 0);
      if (orphans.length > 0) {
        for (const o of orphans) {
          fetch(`/api/reminders/${o.id}`, { method: "DELETE" }).catch(() => {});
        }
        setReminders((prev) =>
          prev.filter((r) => messageIds.has(r.messageId) || currentMessages.length === 0)
        );
      }

      const due = reminders.filter((r) => r.reminderTime <= now && messageIds.has(r.messageId));
      if (due.length === 0) return;
      for (const r of due) {
        // Play sound on reminder fire
        if (soundEnabled) playNotificationSound();
        toast(`Reminder: ${r.messagePreview}`, "info", {
          label: "Snooze 15m",
          onClick: () => handleSnoozeReminder(r, 15),
        });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Reminder", { body: r.messagePreview, tag: `reminder-${r.id}` });
        }
        scrollToMessage(r.messageId);
      }
      // Delete fired reminders from DB
      for (const r of due) {
        fetch(`/api/reminders/${r.id}`, { method: "DELETE" }).catch(() => {});
      }
      setReminders((prev) => prev.filter((r) => r.reminderTime > now));
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, soundEnabled]);

  // === Feature 3: Status handler ===
  async function handleSetStatus(status: string | null, expiresIn?: number | null) {
    try {
      await fetch("/api/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, expiresIn }),
      });
      setUser((prev) => prev ? { ...prev, status } : prev);
      toast(status ? "Status updated" : "Status cleared");
    } catch {
      toast("Failed to update status", "error");
    }
  }

  // === Feature 4: Thread computed values ===
  const replyCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const msg of messages) {
      if (msg.replyToId) {
        map.set(msg.replyToId, (map.get(msg.replyToId) || 0) + 1);
      }
    }
    return map;
  }, [messages]);

  // Collect all images for lightbox navigation
  const allImages = useMemo(() => {
    const imgs: { src: string; alt: string; messageId: string }[] = [];
    for (const msg of messages) {
      if (msg.fileType?.startsWith("image/") && msg.filePath) {
        const src = msg.filePath.startsWith("http") ? msg.filePath : `/api/files/${msg.filePath}`;
        imgs.push({ src, alt: msg.fileName || "Image", messageId: msg.id });
      }
    }
    return imgs;
  }, [messages]);

  function openLightbox(imageSrc: string) {
    const idx = allImages.findIndex((img) => img.src === imageSrc);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setShowLightbox(true);
  }

  const threadParent = threadParentId ? messages.find((m) => m.id === threadParentId) : null;
  const threadReplies = threadParentId ? messages.filter((m) => m.replyToId === threadParentId) : [];

  function handleViewThread(messageId: string) {
    setThreadParentId(messageId);
  }

  async function handleThreadReply(content: string, replyToId: string) {
    await handleSend(content, undefined, replyToId);
  }

  const reminderMessageIds = useMemo(() => new Set(reminders.map((r) => r.messageId)), [reminders]);
  const reminderTimeMap = useMemo(() => new Map(reminders.map((r) => [r.messageId, r.reminderTime])), [reminders]);

  const pinnedMessages = useMemo(() => messages.filter((m) => m.isPinned), [messages]);
  const showConnectionIssue = isOffline || failedPolls >= 3;
  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.messageId)), [bookmarks]);

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

      // Unread separator
      if (unreadSeparatorIdRef.current === msg.id) {
        const newCount = messages.length - i;
        elements.push(
          <div key="unread-sep" className="flex items-center gap-3 my-4 animate-fade-in">
            <div className="flex-1 h-[1.5px] bg-accent/50 shadow-[0_0_6px_rgba(var(--acc-rgb),0.3)]" />
            <span className="text-[11px] font-semibold text-background bg-accent px-3 py-0.5 rounded-full shadow-sm shadow-accent/30">
              {newCount > 0 ? `${newCount} new message${newCount === 1 ? "" : "s"}` : "New messages"}
            </span>
            <div className="flex-1 h-[1.5px] bg-accent/50" />
          </div>
        );
      }

      const isNew = newMessageIdsRef.current.has(msg.id);

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
          onBookmark={handleBookmark}
          isBookmarked={bookmarkedIds.has(msg.id)}
          onVote={handleVote}
          currentDisplayName={user!.displayName}
          currentUserId={user!.id}
          timeFormat={timeFormat}
          onReminder={handleSetReminder}
          hasReminder={reminderMessageIds.has(msg.id)}
          reminderTime={reminderTimeMap.get(msg.id) ?? null}
          replyCount={replyCountMap.get(msg.id) || 0}
          onViewThread={handleViewThread}
          isNew={isNew}
          onImageClick={openLightbox}
          isDeleting={deletingIds.has(msg.id)}
          onlineUserIds={onlineUserIds}
        />
      );
    }

    return elements;
  }

  if (!user) {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 border-b border-border glass">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-5 w-24 rounded-md animate-shimmer" />
              <div className="h-4 w-16 rounded-full animate-shimmer" style={{ animationDelay: "0.05s" }} />
            </div>
            <div className="h-3 w-20 rounded-md animate-shimmer mt-1.5" style={{ animationDelay: "0.1s" }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[0.15, 0.2, 0.25, 0.3, 0.35].map((d, i) => (
                <div key={i} className="h-8 w-8 rounded-lg animate-shimmer" style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
            <div className="w-px h-5 bg-border/40" />
            <div className="h-8 w-8 rounded-lg animate-shimmer" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-5">
          {[0.6, 0.4, 0.75, 0.5, 0.35, 0.55].map((w, i) => (
            <div key={i} className={`flex animate-fade-in ${i % 3 === 1 ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${i * 0.1}s` }}>
              {i % 3 !== 1 && <div className="w-7 h-7 rounded-full animate-shimmer mr-2.5 mt-1 shrink-0" />}
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
    <div className="flex flex-col h-dvh relative" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/[0.04] blur-3xl animate-float-slow" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-accent/[0.03] blur-3xl animate-float-slower" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/[0.025] blur-3xl animate-float-slow [animation-delay:4s]" />
      </div>
      {/* Connection status banner */}
      {showConnectionIssue && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 text-xs font-medium animate-slide-down-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          {isOffline ? "You're offline -- check your connection" : "Connection lost -- reconnecting..."}
        </div>
      )}

      {/* Header */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 border-b border-border glass header-accent-line transition-shadow ${headerShadow ? "shadow-lg shadow-background/50" : ""}`}>
        <div className="min-w-0 mr-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-semibold tracking-tight font-heading">D&T <span className="text-accent">Chat</span></h1>
              <span className={`relative w-1.5 h-1.5 rounded-full transition-colors ${showConnectionIssue ? "bg-yellow-500 animate-online-pulse" : "bg-green-500 animate-online-ring"}`} title={showConnectionIssue ? "Connection issue" : "Connected"} />
            </div>
            <button
              onClick={() => setShowStatusPicker(true)}
              className="hidden sm:flex text-[10px] px-2 py-0.5 rounded-full bg-surface/60 hover:bg-surface text-muted hover:text-accent transition-all truncate max-w-[140px] items-center gap-1"
              title="Set your status"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              {user?.status || "Set status"}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <OnlineUsers users={onlineUsers} count={onlineCount} currentUserId={user?.id} typingUsers={typingUsers} />
            {messages.length > 0 && (
              <span className="text-[10px] text-muted/50 hidden sm:inline">{messages.length.toLocaleString()} messages</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Desktop toolbar buttons */}
          <div className="hidden sm:flex items-center gap-0.5 rounded-xl p-0.5 bg-surface/50 border border-border/50">
            {/* Search — promoted to first for discoverability */}
            <button
              onClick={() => setShowSearch(true)}
              className={`p-2 rounded-lg transition-all active:scale-95 ${showSearch ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-surface"}`}
              title="Search (Ctrl+F)"
              aria-label="Search messages"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {/* Media gallery */}
            <button
              onClick={() => setShowMediaGallery(true)}
              className={`p-2 rounded-lg transition-all active:scale-95 ${showMediaGallery ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-surface"}`}
              title="Media gallery"
              aria-label="Media gallery"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
            {/* Bookmarks */}
            <button
              onClick={() => setShowBookmarks(true)}
              className={`p-2 rounded-lg transition-all active:scale-95 relative ${showBookmarks ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-surface"}`}
              title="Bookmarks"
              aria-label="Bookmarks"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              {bookmarks.length > 0 && !showBookmarks && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
              )}
            </button>
            {/* To-Do */}
            <button
              onClick={() => setShowTodos(true)}
              className={`p-2 rounded-lg transition-all active:scale-95 relative ${showTodos ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-surface"}`}
              title="To-do list"
              aria-label="To-do list"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {todoCount > 0 && !showTodos && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
              )}
            </button>
            {/* Reminders */}
            <button
              onClick={() => setShowReminders(true)}
              className={`p-2 rounded-lg transition-all active:scale-95 relative ${showReminders ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-surface"}`}
              title="Reminders"
              aria-label="Reminders"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {reminders.length > 0 && !showReminders && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
              )}
            </button>
          </div>
          {/* Mobile overflow menu */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-surface transition-all active:scale-95 relative"
              title="More"
              aria-label="More options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
              {(bookmarks.length > 0 || todoCount > 0 || reminders.length > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-background" />
              )}
            </button>
            {showMobileMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMobileMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-surface/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/20 z-40 overflow-hidden animate-slide-down p-1.5">
                  {[
                    { label: "Search", icon: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>, action: () => { setShowSearch(true); setShowMobileMenu(false); } },
                    { label: "Media", icon: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>, action: () => { setShowMediaGallery(true); setShowMobileMenu(false); } },
                    { label: "Bookmarks", badge: bookmarks.length, icon: <><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" /></>, action: () => { setShowBookmarks(true); setShowMobileMenu(false); } },
                    { label: "To-Do", badge: todoCount, icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>, action: () => { setShowTodos(true); setShowMobileMenu(false); } },
                    { label: "Reminders", badge: reminders.length, icon: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>, action: () => { setShowReminders(true); setShowMobileMenu(false); } },
                  ].map((item, i) => (
                    <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-foreground hover:bg-border/40 transition-colors rounded-lg" style={{ animationDelay: `${i * 30}ms` }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                        {item.icon}
                      </svg>
                      <span className="flex-1 text-left">{item.label}</span>
                      {(item as { badge?: number }).badge ? <span className="text-[10px] text-accent font-semibold bg-accent/10 px-1.5 py-0.5 rounded-full">{(item as { badge: number }).badge}</span> : null}
                    </button>
                  ))}
                  <div className="mx-2 my-1 h-px bg-border/50" />
                  <button onClick={() => { setShowStatusPicker(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-foreground hover:bg-border/40 transition-colors rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                      <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                    <span className="flex-1 text-left">{user?.status ? "Change status" : "Set status"}</span>
                    {user?.status && <span className="text-[10px] text-muted truncate max-w-[60px]">{user.status}</span>}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="hidden sm:block w-px h-5 bg-border/40" />
          <SettingsMenu
            user={user}
            onAvatarChange={(avatarId) => setUser((prev) => prev ? { ...prev, avatarId } : prev)}
            onBioChange={(bio) => setUser((prev) => prev ? { ...prev, bio } : prev)}
            onLogout={handleLogout}
            soundEnabled={soundEnabled}
            onSoundToggle={toggleSound}
            notificationsEnabled={notificationsEnabled}
            onNotificationsToggle={toggleNotifications}
          />
        </div>
      </div>

      {/* Search overlay */}
      {showSearch && (
        <SearchMessages
          onClose={() => setShowSearch(false)}
          onScrollTo={scrollToMessage}
        />
      )}

      {/* Bookmarks panel */}
      {showBookmarks && (
        <BookmarksPanel
          bookmarks={bookmarks}
          onClose={() => setShowBookmarks(false)}
          onScrollTo={scrollToMessage}
          onRemove={handleBookmark}
        />
      )}

      {/* Media gallery */}
      {showMediaGallery && (
        <MediaGallery onClose={() => setShowMediaGallery(false)} />
      )}

      {/* Poll creator */}
      {showPollCreator && (
        <PollCreator
          onClose={() => setShowPollCreator(false)}
          onCreate={handleCreatePoll}
        />
      )}

      {/* Reminders panel */}
      {showReminders && (
        <RemindersPanel
          reminders={reminders}
          onClose={() => setShowReminders(false)}
          onScrollTo={scrollToMessage}
          onDelete={handleDeleteReminder}
        />
      )}

      {/* Status picker */}
      {showStatusPicker && (
        <StatusPicker
          currentStatus={user?.status}
          onSet={handleSetStatus}
          onClose={() => setShowStatusPicker(false)}
        />
      )}

      {/* Thread panel */}
      {threadParent && (
        <ThreadPanel
          parentMessage={threadParent}
          replies={threadReplies}
          currentUserId={user!.id}
          currentDisplayName={user!.displayName}
          onClose={() => setThreadParentId(null)}
          onReply={handleThreadReply}
        />
      )}

      {/* Todo panel */}
      {showTodos && (
        <TodoPanel onClose={() => setShowTodos(false)} onTodoCountChange={setTodoCount} />
      )}

      {/* Celebration effects */}
      <CelebrationEffects messages={messages} reduceMotion={reduceMotion} />

      {/* Pinned messages */}
      <PinnedMessages
        messages={pinnedMessages}
        onScrollTo={scrollToMessage}
        onUnpin={handlePin}
        onUpdateLabel={handleUpdatePinLabel}
      />

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden">
        {/* Floating new-message pill */}
        {showNewMessages && !isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 text-xs font-semibold bg-accent text-background rounded-full shadow-lg shadow-accent/25 animate-slide-down animate-glow-pulse hover:shadow-accent/40 transition-shadow cursor-pointer"
          >
            {unreadCount > 0 ? `${unreadCount} new message${unreadCount === 1 ? "" : "s"}` : "New messages"} ↓
          </button>
        )}
        {/* Scroll shadow: top */}
        <div className={`absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-transparent z-[5] pointer-events-none transition-opacity duration-200 ${headerShadow ? "opacity-100" : "opacity-0"}`} />
        {/* Scroll shadow: bottom */}
        <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent z-[5] pointer-events-none transition-opacity duration-200 ${!isAtBottom ? "opacity-100" : "opacity-0"}`} />
        <div
          ref={scrollContainerRef}
          role="log"
          aria-live="polite"
          className="absolute inset-0 overflow-y-auto px-4 py-4 overscroll-contain scroll-smooth scroll-gpu"
          onScroll={handleScroll}
        >
          {!messagesLoaded && messages.length === 0 ? (
            /* Skeleton message loaders */
            <div className="space-y-5">
              {[0.6, 0.4, 0.75, 0.5, 0.35].map((w, i) => (
                <div key={i} className={`flex animate-fade-in ${i % 2 === 1 ? "justify-end" : "justify-start"}`} style={{ animationDelay: `${i * 80}ms` }}>
                  {i % 2 !== 1 && <div className="w-7 h-7 rounded-full animate-shimmer mr-2.5 mt-1 shrink-0" />}
                  <div className="space-y-1.5" style={{ width: `${w * 55}%` }}>
                    {i % 2 !== 1 && <div className="h-3 w-16 rounded-md animate-shimmer" style={{ animationDelay: `${i * 80 + 30}ms` }} />}
                    <div className={`rounded-2xl animate-shimmer ${i % 2 === 1 ? "h-10" : "h-14"}`} style={{ animationDelay: `${i * 80 + 60}ms` }} />
                    <div className="h-2.5 w-12 rounded-md animate-shimmer" style={{ animationDelay: `${i * 80 + 90}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center animate-gentle-float shadow-lg shadow-accent/5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center animate-spring-in" style={{ animationDelay: "0.5s" }}>
                  <span className="text-xs">✨</span>
                </div>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: "0.15s" }}>
                <p className="text-lg text-foreground font-medium mb-1 font-heading">{getGreeting()}, {user.displayName}!</p>
                <p className="text-muted text-sm">No messages yet — start the conversation!</p>
              </div>
              <div className="flex items-center gap-3 text-muted/50 text-xs animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-muted text-[10px] font-mono">/</kbd> focus</span>
                <span className="w-px h-3 bg-border" />
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-muted text-[10px] font-mono">@</kbd> mention</span>
                <span className="w-px h-3 bg-border" />
                <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-muted text-[10px] font-mono">?</kbd> shortcuts</span>
              </div>
            </div>
          ) : (
            <>
              {hasOlderMessages && messages.length > 0 && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingOlder}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted hover:text-foreground bg-gradient-to-b from-surface to-background border border-border rounded-full hover:border-accent hover:from-accent/5 hover:to-accent/10 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingOlder ? (
                      <>
                        <div className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                        Load older messages
                      </>
                    )}
                  </button>
                </div>
              )}
              {renderMessages()}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom FAB */}
        {!isAtBottom && (
          <div className="absolute bottom-4 right-4 z-10 animate-fab-in">
            <button
              onClick={scrollToBottom}
              className={`relative w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg ${
                showNewMessages
                  ? "bg-accent text-background shadow-accent/25 hover:shadow-accent/40 hover:shadow-xl animate-glow-pulse"
                  : "bg-surface/90 backdrop-blur-sm border border-border text-muted hover:text-foreground hover:border-accent hover:shadow-md"
              }`}
              aria-label={showNewMessages ? `${unreadCount} new messages` : "Scroll to bottom"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showNewMessages && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold bg-accent text-background rounded-full ring-2 ring-background animate-badge-bounce">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} onlineUsers={onlineUsers} />

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onlineUsers={onlineUsers}
        onCreatePoll={() => setShowPollCreator(true)}
      />

      {/* Delete confirmation dialog */}
      {deleteConfirmId && (
        <ConfirmDialog
          title="Delete message"
          message="Are you sure you want to delete this message? This can't be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}

      {/* Global image lightbox with navigation */}
      {showLightbox && allImages.length > 0 && (
        <ImageLightbox
          src={allImages[lightboxIndex]?.src || ""}
          alt={allImages[lightboxIndex]?.alt || ""}
          onClose={() => setShowLightbox(false)}
          images={allImages}
          initialIndex={lightboxIndex}
        />
      )}
    </div>
  );
}
