"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function GateForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
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
        router.push("/auth");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/8 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-32 -left-24 w-64 h-64 rounded-full bg-accent/6 blur-3xl animate-float-slow [animation-delay:2.5s]" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-accent/5 blur-3xl animate-float-slow [animation-delay:5s]" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-scale relative z-10">
        <div className="bg-surface/60 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl shadow-black/10 p-8">
          {/* Lock icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center animate-gentle-float shadow-lg shadow-accent/10">
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
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] transition-all shadow-sm"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full mt-4 py-3 bg-accent text-background font-semibold rounded-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-accent/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  Checking...
                </span>
              ) : "Enter"}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-border/40 pt-4 mt-6">
            <p className="text-center text-xs text-muted/60">Private access only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
