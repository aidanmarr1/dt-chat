"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl shadow-black/30 animate-fade-scale overflow-hidden" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
        <div className="px-5 pt-5 pb-2">
          <h3 id="confirm-title" className="text-sm font-semibold text-foreground font-heading">{title}</h3>
          <p id="confirm-desc" className="text-xs text-muted mt-1.5 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2.5 px-5 pb-5 pt-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-background border border-border rounded-xl hover:bg-border/50 transition-all duration-200 active:scale-[0.98] animate-fade-in"
            style={{ animationDelay: "0.05s" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] animate-fade-in ${
              destructive
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/35"
                : "bg-accent text-background hover:brightness-110 shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/30"
            }`}
            style={{ animationDelay: "0.1s" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
