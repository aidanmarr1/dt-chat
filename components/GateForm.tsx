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
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm animate-fade-scale">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center animate-gentle-float">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,170,38,0.12)] transition-all"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 py-3 bg-accent text-background font-semibold rounded-lg hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Checking...
              </span>
            ) : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
