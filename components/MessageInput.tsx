"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent, DragEvent, FormEvent, ClipboardEvent } from "react";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";
import { useToast } from "./Toast";

import Avatar from "./Avatar";
import { formatFileSize } from "@/lib/file-utils";
import type { Message, OnlineUser } from "@/lib/types";

function InputFileTypeIcon({ type }: { type: string }) {
  const isPdf = type === "application/pdf";
  const isDoc = type.includes("word") || type === "text/plain" || type === "text/csv";
  const isSpreadsheet = type.includes("excel") || type.includes("spreadsheet");
  const isPresentation = type.includes("powerpoint") || type.includes("presentation");
  const isArchive = type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("tar") || type.includes("gzip");
  const isAudio = type.startsWith("audio/");

  let label = "FILE";
  let color = "text-muted";
  if (isPdf) { label = "PDF"; color = "text-red-400"; }
  else if (isDoc) { label = "DOC"; color = "text-blue-400"; }
  else if (isSpreadsheet) { label = "XLS"; color = "text-green-400"; }
  else if (isPresentation) { label = "PPT"; color = "text-orange-400"; }
  else if (isArchive) { label = "ZIP"; color = "text-yellow-400"; }
  else if (isAudio) { label = "AUD"; color = "text-purple-400"; }

  return (
    <div className={`w-16 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-xs font-bold ${color}`}>
      {label}
    </div>
  );
}

const SLASH_COMMANDS: { name: string; description: string; type: "text" | "action"; value?: string; action?: string }[] = [
  { name: "giphy", description: "Open GIF picker", type: "action", action: "gif" },
  { name: "poll", description: "Create a poll", type: "action", action: "poll" },
  { name: "shrug", description: "¯\\_(ツ)_/¯", type: "text", value: "¯\\_(ツ)_/¯" },
];

interface FilePreview {
  file: File;
  previewUrl?: string;
}

interface MessageInputProps {
  onSend: (content: string, file?: { fileName: string; fileType: string; fileSize: number; filePath: string }, replyToId?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onlineUsers?: OnlineUser[];
  onCreatePoll?: () => void;
}

export default function MessageInput({
  onSend,
  onTyping,
  disabled,
  replyingTo,
  onCancelReply,
  onlineUsers = [],
  onCreatePoll,
}: MessageInputProps) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dt-draft") ?? "";
    }
    return "";
  });
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);

  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [enterToSend, setEnterToSend] = useState(true);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiChecking, setAiChecking] = useState(false);
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiToggleRef = useRef<HTMLButtonElement>(null);
  const gifToggleRef = useRef<HTMLButtonElement>(null);
  const lastTypingRef = useRef(0);

  // Load enter-to-send preference
  useEffect(() => {
    const stored = localStorage.getItem("dt-enter-to-send");
    if (stored === "false") setEnterToSend(false);
    const handler = () => {
      const v = localStorage.getItem("dt-enter-to-send");
      setEnterToSend(v !== "false");
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Auto-focus textarea on mount + resize to fit restored draft
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      if (el.value) {
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
      }
    }
  }, []);

  // Persist draft to localStorage
  useEffect(() => {
    if (value) {
      localStorage.setItem("dt-draft", value);
    } else {
      localStorage.removeItem("dt-draft");
    }
  }, [value]);

  // Clean up Object URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (filePreview?.previewUrl) URL.revokeObjectURL(filePreview.previewUrl);
    };
  }, [filePreview]);

  const handleTyping = useCallback(() => {
    if (!onTyping) return;
    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      lastTypingRef.current = now;
      onTyping();
    }
  }, [onTyping]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Slash command keyboard nav
    if (slashQuery !== null && filteredSlashCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % filteredSlashCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + filteredSlashCommands.length) % filteredSlashCommands.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        executeCommand(filteredSlashCommands[slashIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashQuery(null);
        return;
      }
    }

    // Mention autocomplete keyboard nav
    if (mentionQuery !== null && filteredMentionUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredMentionUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(filteredMentionUsers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (enterToSend) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    } else {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    }
    if (e.key === "Escape") {
      if (replyingTo) {
        onCancelReply?.();
      } else if (filePreview) {
        if (filePreview.previewUrl) URL.revokeObjectURL(filePreview.previewUrl);
        setFilePreview(null);
      } else {
        (e.target as HTMLTextAreaElement).blur();
      }
    }
  }

  // Block emoji input from keyboard / IME (only allow emojis from the picker)
  const emojiRegex = /\p{Extended_Pictographic}/u;

  function handleBeforeInput(e: FormEvent<HTMLTextAreaElement>) {
    const inputEvent = e.nativeEvent as InputEvent;
    if (inputEvent.data && emojiRegex.test(inputEvent.data)) {
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    // Check for pasted images first
    const files = e.clipboardData.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      e.preventDefault();
      handleFileSelect(files);
      return;
    }

    const text = e.clipboardData.getData("text");
    if (emojiRegex.test(text)) {
      e.preventDefault();
      const stripped = text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "");
      if (stripped) {
        document.execCommand("insertText", false, stripped);
      }
    }
  }

  async function handleSend() {
    const trimmed = value.trim();
    if ((!trimmed && !filePreview) || disabled || uploading || aiChecking) return;

    // Intercept slash commands typed directly (e.g. user types "/shrug" and hits Enter)
    if (trimmed.startsWith("/") && !trimmed.includes(" ")) {
      const cmdName = trimmed.slice(1).toLowerCase();
      const cmd = SLASH_COMMANDS.find((c) => c.name === cmdName);
      if (cmd) {
        executeCommand(cmd);
        return;
      }
    }

    // AI message check — auto-correct and send (always enabled)
    if (trimmed && !filePreview) {
      setAiChecking(true);
      try {
        const res = await fetch("/api/check-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.ok && data.corrected) {
            // Auto-send the corrected version
            onSend(data.corrected, undefined, replyingTo?.id);
            setValue("");
            localStorage.removeItem("dt-draft");
            setFilePreview(null);
            onCancelReply?.();
            setAiChecking(false);
            toast("Message auto-corrected", "success");
            setJustSent(true);
            setTimeout(() => setJustSent(false), 350);
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.focus();
            }
            return;
          }
        }
      } catch {
        // On error, proceed with sending as-is
      }
      setAiChecking(false);
    }

    let fileData: { fileName: string; fileType: string; fileSize: number; filePath: string } | undefined;

    if (filePreview) {
      setUploading(true);
      setUploadProgress(0);
      try {
        fileData = await new Promise<{ fileName: string; fileType: string; fileSize: number; filePath: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error("Upload failed"));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          const formData = new FormData();
          formData.append("file", filePreview.file);
          xhr.open("POST", "/api/upload");
          xhr.send(formData);
        });
      } catch {
        setUploading(false);
        setUploadProgress(0);
        return;
      }
      setUploading(false);
      setUploadProgress(0);
    }

    onSend(trimmed, fileData, replyingTo?.id);
    setValue("");
    localStorage.removeItem("dt-draft");
    setFilePreview(null);
    onCancelReply?.();
    setJustSent(true);
    setTimeout(() => setJustSent(false), 350);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
    handleTyping();
    checkMention();
    checkSlashCommand();
  }

  function checkSlashCommand() {
    const el = textareaRef.current;
    if (!el) { setSlashQuery(null); return; }
    const text = el.value;
    // Only trigger when the entire input starts with /
    if (text.startsWith("/")) {
      const query = text.slice(1);
      // Don't show if there are spaces (command already typed, user is writing more)
      if (!query.includes(" ")) {
        setSlashQuery(query);
        setSlashIndex(0);
      } else {
        setSlashQuery(null);
      }
    } else {
      setSlashQuery(null);
    }
  }

  const filteredSlashCommands = slashQuery !== null
    ? SLASH_COMMANDS.filter((c) => c.name.toLowerCase().startsWith(slashQuery.toLowerCase())).slice(0, 7)
    : [];

  function executeCommand(cmd: typeof SLASH_COMMANDS[0]) {
    setSlashQuery(null);
    setValue("");
    if (cmd.type === "text" && cmd.value) {
      onSend(cmd.value, undefined, replyingTo?.id);
      onCancelReply?.();
      setJustSent(true);
      setTimeout(() => setJustSent(false), 350);
    } else if (cmd.action === "gif") {
      setShowGif(true);
    } else if (cmd.action === "poll" && onCreatePoll) {
      onCreatePoll();
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  function checkMention() {
    const el = textareaRef.current;
    if (!el) { setMentionQuery(null); return; }
    const cursor = el.selectionStart;
    const textBefore = el.value.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  const filteredMentionUsers = mentionQuery !== null
    ? onlineUsers
        .filter((u) => u.displayName.toLowerCase().includes(mentionQuery.toLowerCase()))
        .sort((a, b) => {
          const q = mentionQuery.toLowerCase();
          const aPrefix = a.displayName.toLowerCase().startsWith(q) ? 0 : 1;
          const bPrefix = b.displayName.toLowerCase().startsWith(q) ? 0 : 1;
          return aPrefix - bPrefix;
        })
        .slice(0, 5)
    : [];

  function selectMention(user: OnlineUser) {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const textBefore = el.value.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      const start = cursor - match[0].length;
      const newVal = el.value.slice(0, start) + `@${user.displayName} ` + el.value.slice(cursor);
      setValue(newVal);
      setMentionQuery(null);
      setTimeout(() => {
        const newCursor = start + user.displayName.length + 2;
        el.selectionStart = el.selectionEnd = newCursor;
        el.focus();
      }, 0);
    }
  }

  function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File must be under 10 MB");
      setTimeout(() => setFileError(""), 3000);
      return;
    }
    setFileError("");
    const preview: FilePreview = { file };
    if (file.type.startsWith("image/")) {
      preview.previewUrl = URL.createObjectURL(file);
    }
    setFilePreview(preview);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newVal = value.slice(0, start) + emoji + value.slice(end);
      setValue(newVal);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + emoji.length;
        el.focus();
      }, 0);
    } else {
      setValue(value + emoji);
    }
  }

  function handleGifSelect(gifUrl: string) {
    onSend(gifUrl, undefined, replyingTo?.id);
    onCancelReply?.();
  }

  function renderPreview(text: string) {
    const parts = text.split(/(`.+?`|~~.+?~~|\*\*.+?\*\*|\*.+?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
        return <code key={i} className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-background border border-border">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
        return <del key={i} className="opacity-60">{part.slice(2, -2)}</del>;
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**") && part.length > 2) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    // If already wrapped, unwrap
    const textBefore = value.slice(Math.max(0, start - before.length), start);
    const textAfter = value.slice(end, end + after.length);
    if (textBefore === before && textAfter === after) {
      const newVal = value.slice(0, start - before.length) + selected + value.slice(end + after.length);
      setValue(newVal);
      setTimeout(() => { el.selectionStart = start - before.length; el.selectionEnd = end - before.length; el.focus(); }, 0);
      return;
    }
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(newVal);
    setTimeout(() => {
      if (selected) {
        el.selectionStart = start + before.length;
        el.selectionEnd = end + before.length;
      } else {
        el.selectionStart = el.selectionEnd = start + before.length;
      }
      el.focus();
    }, 0);
  }

  return (
    <div
      className={`border-t border-border glass ${
        dragOver ? "ring-2 ring-accent ring-inset" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 animate-slide-up">
          <div className="flex-1 px-3 py-1.5 rounded-lg bg-surface border-l-2 border-accent text-xs">
            <span className="font-medium text-foreground flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted shrink-0">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              Replying to {replyingTo.displayName}
            </span>
            <p className="text-muted truncate">
              {replyingTo.content
                ? replyingTo.content.length > 60
                  ? replyingTo.content.slice(0, 60) + "..."
                  : replyingTo.content
                : replyingTo.fileName || ""}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded hover:bg-surface transition-all active:scale-90 text-muted hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* File preview */}
      {filePreview && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 animate-slide-up">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg relative overflow-hidden">
            {filePreview.previewUrl ? (
              <img
                src={filePreview.previewUrl}
                alt="Preview"
                className="w-16 h-12 object-cover rounded-lg"
              />
            ) : (
              <InputFileTypeIcon type={filePreview.file.type} />
            )}
            <div className="min-w-0">
              <p className="text-sm text-foreground truncate max-w-[50vw] sm:max-w-[200px]">
                {filePreview.file.name}
              </p>
              <p className="text-xs text-muted">
                {formatFileSize(filePreview.file.size)}
                {uploading && uploadProgress > 0 && (
                  <span className="ml-1.5 text-accent">{uploadProgress}%</span>
                )}
              </p>
            </div>
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border">
                <div
                  className="h-full bg-accent transition-all duration-200 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (filePreview.previewUrl) URL.revokeObjectURL(filePreview.previewUrl);
              setFilePreview(null);
            }}
            className="p-1 rounded hover:bg-surface transition-all active:scale-90 text-muted hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div className="px-4 pt-2">
          <p className="text-red-400 text-xs animate-fade-in">{fileError}</p>
        </div>
      )}

      {/* Drag overlay */}
      {dragOver && (
        <div className="mx-4 my-3 py-6 flex flex-col items-center gap-2 border-2 border-dashed rounded-xl text-accent animate-pulse-border">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-sm font-medium">Drop file to attach</span>
        </div>
      )}

      {/* Input row */}
        <div className="flex items-center gap-2 p-4">
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all active:scale-90 shrink-0"
            title="Attach file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = "";
            }}
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz,audio/*"
          />

          {/* Emoji button */}
          <div className="relative shrink-0">
            <button
              ref={emojiToggleRef}
              onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}
              className="p-2.5 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all active:scale-90"
              title="Emoji"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </button>
            {showEmoji && (
              <EmojiPicker
                onSelect={insertEmoji}
                onClose={() => setShowEmoji(false)}
                toggleRef={emojiToggleRef}
              />
            )}
          </div>

          {/* GIF button */}
          <div className="relative shrink-0">
            <button
              ref={gifToggleRef}
              onClick={() => { setShowGif(!showGif); setShowEmoji(false); }}
              className="p-2.5 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all active:scale-90"
              title="GIF"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">GIF</text>
              </svg>
            </button>
            {showGif && (
              <GifPicker
                onSelect={handleGifSelect}
                onClose={() => setShowGif(false)}
                toggleRef={gifToggleRef}
              />
            )}
          </div>

          {/* Poll button */}
          {onCreatePoll && (
            <button
              onClick={onCreatePoll}
              className="p-2.5 text-muted hover:text-foreground hover:bg-surface rounded-xl transition-all active:scale-90 shrink-0"
              title="Create poll"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="block">
                <path d="M3 3h18" /><path d="M3 9h18" /><path d="M3 15h12" /><path d="M3 21h6" />
              </svg>
            </button>
          )}

          {/* Textarea */}
          <div className="flex-1 relative">
            {/* Slash command dropdown */}
            {slashQuery !== null && filteredSlashCommands.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-fade-in">
                {filteredSlashCommands.map((cmd, i) => (
                  <button
                    key={cmd.name}
                    onMouseDown={(e) => { e.preventDefault(); executeCommand(cmd); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      i === slashIndex ? "bg-accent/10 text-accent" : "text-foreground hover:bg-border/50"
                    }`}
                  >
                    <span className="font-mono text-xs text-accent font-medium">/{cmd.name}</span>
                    <span className="text-muted text-xs">{cmd.description}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Mention autocomplete dropdown */}
            {mentionQuery !== null && filteredMentionUsers.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-10 animate-fade-in">
                {filteredMentionUsers.map((u, i) => (
                  <button
                    key={u.id}
                    onMouseDown={(e) => { e.preventDefault(); selectMention(u); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      i === mentionIndex ? "bg-accent/10 text-accent" : "text-foreground hover:bg-border/50"
                    }`}
                  >
                    <div className="relative">
                      <Avatar displayName={u.displayName} userId={u.id} avatarId={u.avatarId} size="sm" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface" />
                    </div>
                    <span className="font-medium">{u.displayName}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Formatting toolbar */}
            {value.length > 0 && (
              <div className="absolute -top-7 left-0 hidden sm:flex items-center gap-0.5 bg-surface/95 backdrop-blur-sm border border-border rounded-lg px-1 py-0.5 shadow-sm animate-fade-in z-10">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); wrapSelection("**", "**"); }} className="p-1 rounded text-muted hover:text-foreground hover:bg-border/50 transition-all" title="Bold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); wrapSelection("*", "*"); }} className="p-1 rounded text-muted hover:text-foreground hover:bg-border/50 transition-all" title="Italic">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); wrapSelection("`", "`"); }} className="p-1 rounded text-muted hover:text-foreground hover:bg-border/50 transition-all font-mono text-[10px] font-bold" title="Code">
                  {"</>"}
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); wrapSelection("~~", "~~"); }} className="p-1 rounded text-muted hover:text-foreground hover:bg-border/50 transition-all" title="Strikethrough">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-2.83 4" /><path d="M14 12a4 4 0 0 1 0 8H6" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
                </button>
              </div>
            )}
            {/* Live formatting preview */}
            {value && /(\*\*.+?\*\*|\*.+?\*|`.+?`|~~.+?~~)/.test(value) && (
              <div className="absolute bottom-full left-0 right-0 mb-1 px-4 py-2 bg-surface/95 backdrop-blur-sm border border-border rounded-xl shadow-sm text-sm text-foreground whitespace-pre-wrap break-words animate-fade-in z-10">
                <p className="text-[10px] text-muted mb-1 font-medium">Preview</p>
                <p>{renderPreview(value)}</p>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                if (e.target.value.length <= 2000) {
                  setValue(e.target.value);
                }
                handleInput();
              }}
              onKeyDown={handleKeyDown}
              onBeforeInput={handleBeforeInput}
              onPaste={handlePaste}
              placeholder={replyingTo ? `Reply to ${replyingTo.displayName}...` : enterToSend ? "Type a message..." : "Type a message... (Cmd+Enter to send)"}
              rows={1}
              style={{ transition: "height 0.12s ease-out, border-color 0.15s" }}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] resize-none text-base sm:text-sm"
            />
            {value.length > 1000 && (
              <span className={`absolute bottom-1 right-3 text-[10px] pointer-events-none animate-fade-in ${
                value.length > 1950 ? "text-red-400 font-medium"
                : value.length > 1800 ? "text-orange-400"
                : value.length > 1500 ? "text-yellow-500/70"
                : "text-muted/50"
              }`}>
                {value.length}/2000
              </span>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || uploading || aiChecking || (!value.trim() && !filePreview)}
            className={`p-2.5 bg-accent text-background rounded-xl hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-90 shadow-sm shadow-accent/20 ${justSent ? "animate-send-fly" : ""} ${(value.trim() || filePreview) && !disabled ? "animate-glow-pulse" : ""}`}
          >
            {uploading || aiChecking ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform block">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
    </div>
  );
}
