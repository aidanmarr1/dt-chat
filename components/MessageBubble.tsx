"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import ReactionBar from "./ReactionBar";
import ReactionPicker from "./ReactionPicker";
import ImageLightbox from "./ImageLightbox";
import LinkPreviewCard from "./LinkPreviewCard";
import AudioPlayer from "./AudioPlayer";
import UserProfilePopover from "./UserProfilePopover";
import { formatFileSize } from "@/lib/file-utils";
import type { Message } from "@/lib/types";

type TimeFormat = "12h" | "24h";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGrouped?: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (messageId: string, content: string) => void;
  onPin: (messageId: string) => void;
  currentDisplayName?: string;
  currentUserId?: string;
  timeFormat?: TimeFormat;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function emojiOnlyCount(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/[\p{Extended_Pictographic}\p{Emoji_Component}\uFE0F\u200D\s]/gu, "");
  if (stripped.length > 0) return null;
  const matches = trimmed.match(/\p{Extended_Pictographic}(\u200D\p{Extended_Pictographic})*/gu);
  return matches ? matches.length : null;
}

function isTenorUrl(url: string): boolean {
  return /^https?:\/\/media\.tenor\.com\/.+\.(gif|mp4)/i.test(url);
}

function isGifOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  return isTenorUrl(trimmed) && !trimmed.includes(" ");
}

function renderContent(text: string, isOwn: boolean, currentUserId?: string, currentDisplayName?: string) {
  const parts = text.split(/(https?:\/\/[^\s<]+|www\.[^\s<]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|@\w+)/g);
  return parts.map((part, i) => {
    if (part.match(/^(https?:\/\/|www\.)/)) {
      // Render Tenor GIF URLs as inline images
      if (isTenorUrl(part)) {
        return (
          <img key={i} src={part} alt="GIF" className="max-w-full max-h-64 rounded-lg" loading="lazy" />
        );
      }
      const displayText = part.length > 50 ? part.slice(0, 30) + "\u2026" + part.slice(-15) : part;
      return (
        <a key={i} href={part.match(/^https?:\/\//) ? part : `https://${part}`} target="_blank" rel="noopener noreferrer" title={part} className={`underline underline-offset-2 break-all transition-opacity hover:opacity-70 ${isOwn ? "" : "text-accent"}`}>
          {displayText}
        </a>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return <code key={i} className={`px-1.5 py-0.5 rounded text-[13px] font-mono border ${isOwn ? "bg-background/20 border-background/20" : "bg-background border-border"}`}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.match(/^@\w+/)) {
      return <span key={i} className="font-semibold text-accent">{part}</span>;
    }
    return part;
  });
}

function FileTypeIcon({ type }: { type: string }) {
  const isPdf = type === "application/pdf";
  const isDoc = type.includes("word") || type === "text/plain" || type === "text/csv";
  const isSpreadsheet = type.includes("excel") || type.includes("spreadsheet");
  const isPresentation = type.includes("powerpoint") || type.includes("presentation");
  const isArchive = type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("tar") || type.includes("gzip");

  let label = "FILE";
  let color = "text-muted";
  if (isPdf) { label = "PDF"; color = "text-red-400"; }
  else if (isDoc) { label = "DOC"; color = "text-blue-400"; }
  else if (isSpreadsheet) { label = "XLS"; color = "text-green-400"; }
  else if (isPresentation) { label = "PPT"; color = "text-orange-400"; }
  else if (isArchive) { label = "ZIP"; color = "text-yellow-400"; }

  return (
    <div className={`w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-[10px] font-bold ${color}`}>
      {label}
    </div>
  );
}

export default function MessageBubble({
  message,
  isOwn,
  isGrouped,
  onReaction,
  onReply,
  onEdit,
  onPin,
  currentDisplayName,
  currentUserId,
  timeFormat = "12h",
}: MessageBubbleProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  // Long-press for mobile touch
  function handleTouchStart() {
    longPressRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  }
  function handleTouchEnd() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }
  function handleTouchMove() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }

  function handleCopy() {
    const text = message.content || (fileUrl ?? "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Check if within edit window (15 min)
  const canEdit = isOwn && !message.isDeleted && (Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000);

  // Deleted message
  if (message.isDeleted) {
    return (
      <div
        id={message.id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isGrouped ? "mb-0.5" : "mb-3"} animate-fade-in`}
      >
        {!isOwn && !isGrouped && <div className="mr-2 mt-auto"><Avatar displayName={message.displayName} userId={message.userId} avatarId={message.avatarId} size="sm" /></div>}
        {!isOwn && isGrouped && <div className="w-6 mr-2" />}
        <div className="max-w-[88%] sm:max-w-[75%]">
          {!isOwn && !isGrouped && <p className="text-xs text-muted mb-1 px-1 font-medium">{message.displayName}</p>}
          <div className="px-4 py-2 rounded-xl bg-surface/50 border border-border/50 italic text-muted text-sm">
            This message was deleted
          </div>
        </div>
      </div>
    );
  }

  const isMentioned = !isOwn && currentDisplayName && message.content
    ? new RegExp(`@${currentDisplayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(message.content)
    : false;

  const isImage = message.fileType?.startsWith("image/");
  const isAudio = message.fileType?.startsWith("audio/");
  const hasFile = !!message.filePath;
  const fileUrl = hasFile
    ? message.filePath!.startsWith("http")
      ? message.filePath!
      : `/api/files/${message.filePath}`
    : null;
  const isGifOnly = !hasFile && message.content ? isGifOnlyMessage(message.content) : false;
  const emojiCount = !hasFile && message.content && !isGifOnly ? emojiOnlyCount(message.content) : null;
  const isLargeEmoji = emojiCount !== null && emojiCount >= 1 && emojiCount <= 3;

  function startEdit() {
    setEditValue(message.content);
    setEditing(true);
  }

  function saveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setEditing(false);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") {
      setEditing(false);
    }
  }

  return (
    <>
      <div
        id={message.id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} ${
          isGrouped ? "mb-0.5 msg-bubble" : "mb-3 msg-bubble-spaced"
        } animate-fade-in group rounded-lg -mx-2 px-2 py-0.5 hover:bg-foreground/[0.03] transition-colors ${isMentioned ? "ring-1 ring-accent/30 bg-accent/[0.04]" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowActions(false); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onDoubleClick={(e) => { e.preventDefault(); onReaction(message.id, "\ud83d\udc4d"); }}
        style={{ userSelect: "text", WebkitUserSelect: "text" }}
      >
        {/* Avatar for others */}
        {!isOwn && !isGrouped && (
          <div className="mr-2 mt-auto cursor-pointer" onClick={() => setShowProfile(true)}>
            <Avatar displayName={message.displayName} userId={message.userId} avatarId={message.avatarId} size="sm" />
          </div>
        )}
        {!isOwn && isGrouped && <div className="w-6 mr-2" />}

        <div className={`max-w-[88%] sm:max-w-[75%] relative ${isOwn ? "items-end" : "items-start"}`}>
          {/* Display name + pin indicator */}
          {!isOwn && !isGrouped && (
            <p className="text-xs text-muted mb-1 px-1 font-medium">
              <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => setShowProfile(true)}>{message.displayName}</span>
              {message.isPinned && (
                <span className="ml-1.5 text-accent" title={`Pinned by ${message.pinnedByName || "someone"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="inline -mt-0.5"><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
                </span>
              )}
            </p>
          )}
          {isOwn && !isGrouped && message.isPinned && (
            <p className="text-[10px] text-accent text-right mb-0.5 px-1" title={`Pinned by ${message.pinnedByName || "someone"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="inline -mt-0.5"><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" strokeWidth="2" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
              {" "}pinned
            </p>
          )}

          {/* Reply quote */}
          {message.replyToId && message.replyDisplayName && (
            <div
              className="px-3 py-1.5 mb-1 rounded-lg bg-background border-l-2 border-accent text-xs cursor-pointer hover:bg-border/30 active:scale-[0.99] transition-all"
              onClick={() => {
                const el = document.getElementById(message.replyToId!);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("!bg-accent/10");
                  setTimeout(() => el.classList.remove("!bg-accent/10"), 1500);
                }
              }}
            >
              <span className="font-medium text-foreground">{message.replyDisplayName}</span>
              <p className="text-muted truncate">
                {message.replyContent ? (message.replyContent.length > 80 ? message.replyContent.slice(0, 80) + "..." : message.replyContent) : ""}
              </p>
            </div>
          )}

          {/* Message content */}
          {editing ? (
            <div className="px-3 py-2 rounded-xl bg-surface border-2 border-accent animate-fade-scale">
              <textarea
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-transparent text-base sm:text-sm text-foreground resize-none focus:outline-none"
                rows={Math.min(editValue.split("\n").length + 1, 5)}
              />
              <div className="flex items-center gap-1.5 mt-1">
                <button onClick={saveEdit} className="text-[10px] text-accent hover:underline">Save</button>
                <span className="text-muted text-[10px]">|</span>
                <button onClick={() => setEditing(false)} className="text-[10px] text-muted hover:text-foreground">Cancel</button>
                <span className="text-muted text-[10px] ml-auto">Enter to save, Esc to cancel</span>
              </div>
            </div>
          ) : isLargeEmoji ? (
            <p className={`py-1 leading-none ${
              emojiCount === 1 ? "text-5xl" : emojiCount === 2 ? "text-4xl" : "text-3xl"
            }`}>
              {message.content}
            </p>
          ) : (
            <div
              className={`px-4 py-2.5 rounded-xl ${
                isOwn
                  ? `msg-bubble-sent bg-foreground text-background rounded-br-sm shadow-sm shadow-foreground/10 ${isGrouped ? "rounded-tr-sm" : ""}`
                  : `msg-bubble-content bg-surface border border-border text-foreground rounded-bl-sm ${isGrouped ? "rounded-tl-sm" : ""}`
              }`}
            >
              {/* File attachment */}
              {hasFile && fileUrl && (
                <div className="mb-1.5">
                  {isAudio ? (
                    <AudioPlayer src={fileUrl} isOwn={isOwn} />
                  ) : isImage ? (
                    <div className="relative">
                      {!imageLoaded && <div className="w-full h-48 rounded-lg animate-shimmer" />}
                      <img
                        src={fileUrl}
                        alt={message.fileName || "Image"}
                        className={`max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 hover:shadow-lg transition-all ${!imageLoaded ? "h-0 overflow-hidden" : ""}`}
                        onClick={() => setLightboxSrc(fileUrl)}
                        onLoad={() => setImageLoaded(true)}
                      />
                    </div>
                  ) : (
                    <a href={fileUrl} download={message.fileName} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${isOwn ? "border-background/20 hover:bg-background/10" : "border-border hover:bg-background"}`}>
                      <FileTypeIcon type={message.fileType || ""} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{message.fileName}</p>
                        <p className={`text-xs ${isOwn ? "text-background/60" : "text-muted"}`}>{message.fileSize ? formatFileSize(message.fileSize) : ""}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </a>
                  )}
                </div>
              )}

              {/* Text content */}
              {message.content && (
                <p className="text-sm whitespace-pre-wrap break-words msg-text">
                  {renderContent(message.content, isOwn, undefined, currentDisplayName)}
                </p>
              )}

              {/* Edited indicator */}
              {message.editedAt && (
                <p className={`text-[10px] mt-0.5 ${isOwn ? "text-background/50" : "text-muted"}`} title={`Edited ${new Date(message.editedAt).toLocaleString()}`}>
                  (edited)
                </p>
              )}

              {/* Link previews */}
              {message.linkPreviews && message.linkPreviews.length > 0 && (
                <div>
                  {message.linkPreviews.map((lp) => (
                    <LinkPreviewCard key={lp.id} preview={lp} isOwn={isOwn} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          <ReactionBar reactions={message.reactions || []} onToggle={(emoji) => onReaction(message.id, emoji)} />

          {/* Read receipts */}
          {isOwn && message.readBy && message.readBy.length > 0 && (
            <div className={`flex gap-0.5 mt-0.5 ${isOwn ? "justify-end" : "justify-start"} px-1`}>
              {message.readBy.map((reader) => (
                <div key={reader.userId} title={`Seen by ${reader.displayName}`}>
                  <Avatar displayName={reader.displayName} userId={reader.userId} avatarId={reader.avatarId} size="xs" />
                </div>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p
            className={`text-[10px] text-muted px-1 cursor-pointer hover:text-foreground ${isOwn ? "text-right" : "text-left"} ${isGrouped ? "mt-0.5 h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-150 overflow-hidden" : "mt-1"}`}
            title={new Date(message.createdAt).toLocaleString()}
            onClick={() => setShowAbsoluteTime((v) => !v)}
          >
            {showAbsoluteTime
              ? new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: timeFormat !== "24h" })
              : relativeTime(message.createdAt)}
          </p>

          {/* Action buttons — desktop: inline beside message */}
          {(hovered || showReactionPicker) && !showActions && !editing && (
            <div
              className={`absolute -top-1 ${isOwn ? "left-0 -translate-x-full pr-1" : "right-0 translate-x-full pl-1"} hidden sm:flex items-center gap-0.5`}
            >
              <button onClick={() => { onReply(message); }} className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-sm border border-border hover:bg-border hover:border-accent/30 transition-all active:scale-90 shadow-sm animate-pop-in" style={{ animationDelay: "0ms" }} title="Reply">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
              </button>

              <button onClick={() => { onPin(message.id); }} className={`p-1.5 rounded-lg border backdrop-blur-sm transition-all active:scale-90 shadow-sm animate-pop-in ${message.isPinned ? "bg-accent/15 border-accent/30 text-accent" : "bg-surface/90 border-border hover:bg-border hover:border-accent/30"}`} style={{ animationDelay: "30ms" }} title={message.isPinned ? "Unpin" : "Pin"}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill={message.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                </svg>
              </button>

              <button onClick={handleCopy} className={`p-1.5 rounded-lg border backdrop-blur-sm transition-all active:scale-90 shadow-sm animate-pop-in ${copied ? "bg-green-500/15 border-green-500/30 text-green-500" : "bg-surface/90 border-border hover:bg-border hover:border-accent/30"}`} style={{ animationDelay: "60ms" }} title={copied ? "Copied!" : "Copy"}>
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                )}
              </button>

              {canEdit && (
                <button onClick={() => { startEdit(); }} className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-sm border border-border hover:bg-border hover:border-accent/30 transition-all active:scale-90 shadow-sm animate-pop-in" style={{ animationDelay: "90ms" }} title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                </button>
              )}

              <div className="relative">
                <button onClick={() => setShowReactionPicker(!showReactionPicker)} className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-sm border border-border hover:bg-border hover:border-accent/30 transition-all active:scale-90 shadow-sm animate-pop-in" style={{ animationDelay: "150ms" }} title="React">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                </button>
                {showReactionPicker && (
                  <ReactionPicker onSelect={(emoji) => onReaction(message.id, emoji)} onClose={() => { setShowReactionPicker(false); setShowActions(false); }} />
                )}
              </div>
            </div>
          )}

          {/* Mobile action sheet — slides up from bottom */}
          {showActions && !editing && (
            <>
              <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden" onClick={() => { setShowActions(false); }} />
              <div className="fixed bottom-0 inset-x-0 z-50 sm:hidden animate-slide-up-sheet" style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}>
                <div className="mx-3 mb-2 bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
                  <button onClick={() => { onReply(message); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-border/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                    Reply
                  </button>
                  <div className="h-px bg-border mx-3" />
                  <button onClick={() => { onPin(message.id); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-border/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={message.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={message.isPinned ? "text-accent" : "text-muted"}>
                      <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                    </svg>
                    {message.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <div className="h-px bg-border mx-3" />
                  <button onClick={() => { handleCopy(); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-border/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Copy
                  </button>
                  <div className="h-px bg-border mx-3" />
                  <button onClick={() => { setShowReactionPicker(true); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-border/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                    React
                  </button>
                  {canEdit && (
                    <>
                      <div className="h-px bg-border mx-3" />
                      <button onClick={() => { startEdit(); setShowActions(false); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground active:bg-border/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        Edit
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => { setShowActions(false); }} className="w-full mx-3 mb-1 py-3.5 text-sm font-medium text-muted bg-surface border border-border rounded-2xl active:bg-border/50 transition-colors" style={{ width: "calc(100% - 1.5rem)" }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt={message.fileName || "Image"} onClose={() => setLightboxSrc(null)} />}
      {showProfile && (
        <UserProfilePopover
          userId={message.userId}
          currentUserId={currentUserId}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}
