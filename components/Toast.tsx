"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "info" | "error";
  action?: ToastAction;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, type?: "success" | "info" | "error", action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: "success" | "info" | "error" = "success", action?: ToastAction) => {
    const id = ++nextId;
    const duration = action ? 4000 : 2500;
    setToasts((prev) => [...prev.slice(-2), { id, message, type, action, duration }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl text-sm font-medium shadow-xl backdrop-blur-xl animate-toast-in pointer-events-auto overflow-hidden ${
              t.type === "success"
                ? "bg-green-500/90 text-white shadow-green-500/25"
                : t.type === "error"
                ? "bg-red-500/90 text-white shadow-red-500/25"
                : "bg-surface/95 text-foreground border border-border shadow-black/15"
            }`}
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              {t.type === "success" && (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
              {t.type === "error" && (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </div>
              )}
              {t.type === "info" && (
                <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                </div>
              )}
              {t.message}
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className={`ml-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80 active:scale-95 ${
                    t.type === "success"
                      ? "bg-white/20 text-white"
                      : t.type === "error"
                      ? "bg-white/20 text-white"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <div
              className={`h-0.5 animate-shrink-bar ${
                t.type === "success"
                  ? "bg-white/30"
                  : t.type === "error"
                  ? "bg-white/30"
                  : "bg-accent/30"
              }`}
              style={{ animationDuration: `${t.duration}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
