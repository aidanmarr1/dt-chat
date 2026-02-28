"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ src: string; alt: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const unreadSeparatorIdRef = useRef<string | null>(null);
  const todoCountFetched = useRef(false);
  const newMessageIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const lastReadReceiptRef = useRef<string | null>(null);
  const lastSeenCountRef = useRef(0);
  const router = useRouter();
  const { toast } = useToast();

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
    // Load bookmarks
    try {
      const storedBookmarks = localStorage.getItem("dt-bookmarks");
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
    } catch { /* ignore */ }
    // Load reduce motion preference
    const rm = localStorage.getItem("dt-reduce-motion");
    if (rm === "true") setReduceMotion(true);
    // Load reminders
    try {
      const storedReminders = localStorage.getItem("dt-reminders");
      if (storedReminders) setReminders(JSON.parse(storedReminders));
    } catch { /* ignore */ }

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
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAtBottom]);

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

        // Successful poll — clear failed state
        setFailedPolls((prev) => {
          if (prev >= 3) setWasOffline(true);
          return 0;
        });
        setIsOffline((prev) => {
          if (prev) setWasOffline(true);
          return false;
        });

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
          // Mark as loaded after first successful fetch
          if (!messagesLoaded) setMessagesLoaded(true);

          const latestId = newMessages[newMessages.length - 1].id;
          if (latestId !== latestMessageIdRef.current) {
            const prevLatest = latestMessageIdRef.current;
            // Track new messages (arrived after initial load)
            if (prevLatest) {
              const existingIds = new Set(messages.map((m) => m.id));
              for (const nm of newMessages) {
                if (!existingIds.has(nm.id)) {
                  newMessageIdsRef.current.add(nm.id);
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
            setMessages(newMessages);

            if (isNearBottom()) {
              setTimeout(() => scrollToBottom(), 50);
              postReadReceipt(latestId);
              lastSeenCountRef.current = newMessages.length;
            } else {
              // Count unread since user scrolled up
              const newCount = newMessages.length - lastSeenCountRef.current;
              if (newCount > 0) {
                setUnreadCount((prev) => prev + (newMessages.length - (messages.length || lastSeenCountRef.current)));
              }
              setShowNewMessages(true);
            }
          } else {
            setMessages(newMessages);
          }
        }
      } catch {
        setFailedPolls((prev) => prev + 1);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
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
        setTimeout(() => { unreadSeparatorIdRef.current = null; }, 5000);
      }
    }
  }, [isAtBottom, messages.length]);

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

      if (!res.ok) return;
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

    // Optimistically mark as deleted
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isDeleted: true } : msg
      )
    );

    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("Message deleted");
      } else {
        // Revert on failure
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isDeleted: false } : msg
          )
        );
        toast("Failed to delete", "error");
      }
    } catch {
      // Revert on failure
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isDeleted: false } : msg
        )
      );
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

  function handleBookmark(messageId: string) {
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.messageId === messageId);
      let next: Bookmark[];
      if (exists) {
        next = prev.filter((b) => b.messageId !== messageId);
        toast("Bookmark removed");
      } else {
        const msg = messages.find((m) => m.id === messageId);
        if (!msg) return prev;
        next = [
          {
            messageId: msg.id,
            content: msg.content,
            displayName: msg.displayName,
            createdAt: msg.createdAt,
            bookmarkedAt: new Date().toISOString(),
            fileName: msg.fileName,
          },
          ...prev,
        ];
        toast("Message bookmarked");
      }
      localStorage.setItem("dt-bookmarks", JSON.stringify(next));
      return next;
    });
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
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      messageId,
      messagePreview: msg.content?.slice(0, 100) || msg.fileName || "Message",
      reminderTime,
      createdAt: Date.now(),
    };
    setReminders((prev) => {
      const next = [...prev, reminder];
      localStorage.setItem("dt-reminders", JSON.stringify(next));
      return next;
    });
    toast("Reminder set");
  }

  function handleDeleteReminder(reminderId: string) {
    setReminders((prev) => {
      const next = prev.filter((r) => r.id !== reminderId);
      localStorage.setItem("dt-reminders", JSON.stringify(next));
      return next;
    });
    toast("Reminder removed");
  }

  // Snooze a reminder
  function handleSnoozeReminder(reminder: Reminder, minutes: number) {
    const snoozed: Reminder = {
      ...reminder,
      id: crypto.randomUUID(),
      reminderTime: Date.now() + minutes * 60 * 1000,
    };
    setReminders((prev) => {
      const next = [...prev, snoozed];
      localStorage.setItem("dt-reminders", JSON.stringify(next));
      return next;
    });
    toast(`Snoozed for ${minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}`);
  }

  // Check reminders periodically
  useEffect(() => {
    if (reminders.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();

      // Orphan cleanup: remove reminders whose message no longer exists
      const messageIds = new Set(messages.map((m) => m.id));
      const orphans = reminders.filter((r) => !messageIds.has(r.messageId) && messages.length > 0);
      if (orphans.length > 0) {
        setReminders((prev) => {
          const next = prev.filter((r) => messageIds.has(r.messageId) || messages.length === 0);
          localStorage.setItem("dt-reminders", JSON.stringify(next));
          return next;
        });
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
      setReminders((prev) => {
        const next = prev.filter((r) => r.reminderTime > now);
        localStorage.setItem("dt-reminders", JSON.stringify(next));
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, messages, soundEnabled]);

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

  const threadParent = threadParentId ? messages.find((m) => m.id === threadParentId) : null;
  const threadReplies = threadParentId ? messages.filter((m) => m.replyToId === threadParentId) : [];

  function handleViewThread(messageId: string) {
    setThreadParentId(messageId);
  }

  async function handleThreadReply(content: string, replyToId: string) {
    await handleSend(content, undefined, replyToId);
  }

  const reminderMessageIds = new Set(reminders.map((r) => r.messageId));
  const reminderTimeMap = new Map(reminders.map((r) => [r.messageId, r.reminderTime]));

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);
  const showConnectionIssue = isOffline || failedPolls >= 3;
  const bookmarkedIds = new Set(bookmarks.map((b) => b.messageId));

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
            <div className="flex-1 h-[1.5px] bg-accent/50" />
            <span className="text-[11px] font-semibold text-background bg-accent px-3 py-0.5 rounded-full shadow-sm">
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
        />
      );
    }

    return elements;
  }

  if (!user) {
    return (
      <div className="flex flex-col h-dvh">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border glass">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 rounded-md animate-shimmer" />
              <div className="h-4 w-16 rounded-full animate-shimmer" style={{ animationDelay: "0.05s" }} />
            </div>
            <div className="h-3 w-20 rounded-md animate-shimmer mt-1.5" style={{ animationDelay: "0.1s" }} />
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {[0.15, 0.2, 0.25, 0.3, 0.35, 0.4].map((d, i) => (
              <div key={i} className="h-8 w-8 rounded-lg animate-shimmer" style={{ animationDelay: `${d}s` }} />
            ))}
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
    <div className="flex flex-col h-dvh" style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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
          {isOffline ? "You're offline" : "Reconnecting..."}
        </div>
      )}

      {/* Header */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border glass transition-shadow ${headerShadow ? "shadow-lg shadow-background/50" : ""}`}>
        <div className="min-w-0 mr-2">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight font-heading">D&T <span className="text-accent">Chat</span></h1>
            <button
              onClick={() => setShowStatusPicker(true)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:border-accent text-muted hover:text-accent transition-all truncate max-w-[140px] flex items-center gap-1"
              title="Set your status"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              {user?.status || "Set status"}
            </button>
          </div>
          <OnlineUsers users={onlineUsers} count={onlineCount} currentUserId={user?.id} typingUsers={typingUsers} />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Media gallery */}
          <button
            onClick={() => setShowMediaGallery(true)}
            className="p-2 sm:p-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95"
            title="Media gallery"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </button>
          {/* Bookmarks */}
          <button
            onClick={() => setShowBookmarks(true)}
            className="p-2 sm:p-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95 relative"
            title="Bookmarks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-background text-[9px] font-bold rounded-full flex items-center justify-center">
                {bookmarks.length > 9 ? "9+" : bookmarks.length}
              </span>
            )}
          </button>
          {/* To-Do */}
          <button
            onClick={() => setShowTodos(true)}
            className="p-2 sm:p-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95 relative"
            title="To-do list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            {todoCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-background text-[9px] font-bold rounded-full flex items-center justify-center">
                {todoCount > 9 ? "9+" : todoCount}
              </span>
            )}
          </button>
          {/* Reminders */}
          <button
            onClick={() => setShowReminders(true)}
            className="p-2 sm:p-1.5 rounded-lg border border-border hover:border-accent hover:bg-surface text-muted hover:text-foreground transition-all active:scale-95 relative"
            title="Reminders"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {reminders.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-background text-[9px] font-bold rounded-full flex items-center justify-center">
                {reminders.length > 9 ? "9+" : reminders.length}
              </span>
            )}
          </button>
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
      />

      {/* Messages */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="absolute inset-0 overflow-y-auto px-4 py-4 overscroll-contain scroll-smooth"
          onScroll={(e) => {
            const el = e.target as HTMLElement;
            setHeaderShadow(el.scrollTop > 0);
            setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 100);
          }}
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
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center animate-gentle-float">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <p className="text-foreground font-medium mb-1 font-heading">{getGreeting()}, {user.displayName}!</p>
                <p className="text-muted text-sm">No messages yet — start the conversation!</p>
                <p className="text-muted/50 text-xs mt-2">Press <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-muted text-[10px] font-mono">/</kbd> to focus input</p>
              </div>
            </div>
          ) : (
            renderMessages()
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom FAB */}
        {!isAtBottom && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-fab-in">
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
              {showNewMessages
                ? unreadCount > 0
                  ? `${unreadCount} new message${unreadCount === 1 ? "" : "s"}`
                  : "New messages"
                : "Scroll to bottom"}
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
    </div>
  );
}
