"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function GateForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Wrong password");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        setPassword("");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/auth"), 700);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      if (!success) setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/8 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-32 -left-24 w-64 h-64 rounded-full bg-accent/6 blur-3xl animate-float-slow [animation-delay:2.5s]" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-accent/5 blur-3xl animate-float-slow [animation-delay:5s]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--acc-rgb),0.04)_0%,transparent_70%)]" />
        {/* Dot grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(var(--acc-rgb),0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-scale relative z-10">
        <div className={`bg-surface/60 backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/10 p-8 transition-all hover:border-border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${
          success ? "border-green-500/40" : "border-border/60"
        }`}>
          {/* Lock icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center animate-spring-in shadow-lg shadow-accent/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-center mb-2 tracking-tight font-heading">D&T <span className="text-accent">Chat</span></h1>
          <p className="text-muted text-center text-sm mb-6">
            Enter the password to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className={shaking ? "animate-shake" : ""}>
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] focus:shadow-md transition-all shadow-sm"
                  autoFocus
                  disabled={success}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 mt-3 bg-red-400/10 border border-red-400/20 rounded-xl animate-shake">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || success}
              className={`w-full mt-4 py-3 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-sm group/btn relative overflow-hidden ${
                success
                  ? "bg-green-500 text-white shadow-green-500/20 scale-[1.02]"
                  : "bg-accent text-background hover:brightness-110 disabled:opacity-50 shadow-accent/20"
              }`}
            >
              {/* Shimmer sweep on hover */}
              {!success && !loading && (
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer-sweep_1.5s_ease-in-out_infinite]" />
                </div>
              )}
              <span className="relative z-10">
                {success ? (
                  <span className="flex items-center justify-center gap-2 animate-fade-in">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-check"><polyline points="20 6 9 17 4 12" /></svg>
                    Access Granted
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    Checking...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Enter
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </span>
                )}
              </span>
            </button>

            {/* Keyboard hint */}
            {!loading && !success && password && (
              <p className="text-center text-[10px] text-muted/40 mt-2 animate-fade-in">
                Press Enter ↵
              </p>
            )}
          </form>

          {/* Footer */}
          <div className="border-t border-border/40 pt-4 mt-6">
            <p className="text-center text-xs text-muted/60 flex items-center justify-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Private access only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
