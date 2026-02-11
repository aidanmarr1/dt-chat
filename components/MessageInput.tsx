"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent, DragEvent } from "react";
import EmojiPicker from "./EmojiPicker";
import { formatFileSize } from "@/lib/file-utils";
import type { Message } from "@/lib/types";

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
}

export default function MessageInput({
  onSend,
  onTyping,
  disabled,
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dt-draft") ?? "";
    }
    return "";
  });
  const [showEmoji, setShowEmoji] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [justSent, setJustSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef(0);

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

  const handleTyping = useCallback(() => {
    if (!onTyping) return;
    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      lastTypingRef.current = now;
      onTyping();
    }
  }, [onTyping]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  async function handleSend() {
    const trimmed = value.trim();
    if ((!trimmed && !filePreview) || disabled || uploading) return;

    let fileData: { fileName: string; fileType: string; fileSize: number; filePath: string } | undefined;

    if (filePreview) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", filePreview.file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          setUploading(false);
          return;
        }
        fileData = await res.json();
      } catch {
        setUploading(false);
        return;
      }
      setUploading(false);
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
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg">
            {filePreview.previewUrl ? (
              <img
                src={filePreview.previewUrl}
                alt="Preview"
                className="w-10 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-background border border-border flex items-center justify-center text-[10px] font-bold text-muted">
                FILE
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm text-foreground truncate max-w-[50vw] sm:max-w-[200px]">
                {filePreview.file.name}
              </p>
              <p className="text-xs text-muted">
                {formatFileSize(filePreview.file.size)}
              </p>
            </div>
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
      <div className="flex items-end gap-2 p-4">
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-all active:scale-90 shrink-0"
          title="Attach file"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.tar,.gz"
        />

        {/* Emoji button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="p-2.5 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-all active:scale-90"
            title="Emoji"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            />
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
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
            placeholder={replyingTo ? `Reply to ${replyingTo.displayName}...` : "Type a message..."}
            rows={1}
            style={{ transition: "height 0.12s ease-out, border-color 0.15s" }}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,170,38,0.12)] resize-none text-base sm:text-sm"
          />
          {value.length > 1800 && (
            <span className={`absolute bottom-1 right-3 text-[10px] pointer-events-none animate-fade-in ${
              value.length > 1950 ? "text-red-400" : "text-muted"
            }`}>
              {value.length}/2000
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || uploading || (!value.trim() && !filePreview)}
          className={`p-2.5 bg-accent text-background rounded-xl hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-90 shadow-sm shadow-accent/20 ${justSent ? "animate-send-fly" : ""} ${(value.trim() || filePreview) && !disabled ? "animate-glow-pulse" : ""}`}
        >
          {uploading ? (
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
