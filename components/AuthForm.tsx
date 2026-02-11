"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

type Tab = "login" | "signup";

export default function AuthForm() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "signup") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, displayName, password, confirmPassword }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Signup failed");
        } else {
          router.push("/chat");
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed");
        } else {
          router.push("/chat");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function switchTab(newTab: Tab) {
    setTab(newTab);
    setError("");
    setEmail("");
    setDisplayName("");
    setPassword("");
    setConfirmPassword("");
  }

  // Password strength
  const passwordStrength = (() => {
    if (!password || tab !== "signup") return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400"][passwordStrength];

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative">
      {/* Decorative background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-scale relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 512 512">
              <defs>
                <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FCAA26"/>
                  <stop offset="100%" stopColor="#E09500"/>
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="108" fill="var(--srf)"/>
              <path d="M256 112c-88.4 0-160 60.3-160 134.6 0 42.1 22.9 79.8 58.8 105.2l-14.8 54.2 62.4-31.2c16.8 5.2 35 8 54 8 88.4 0 160-60.3 160-134.6S344.4 112 256 112z" fill="url(#fg)"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">D&T <span className="text-accent">Chat</span></h1>
          <p className="text-sm text-muted mt-1">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex mb-6 bg-surface rounded-xl p-1 border border-border">
          <button
            type="button"
            onClick={() => switchTab("login")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all active:scale-95 ${
              tab === "login"
                ? "bg-accent text-background shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchTab("signup")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all active:scale-95 ${
              tab === "signup"
                ? "bg-accent text-background shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "signup" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How others will see you"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,170,38,0.12)] transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,170,38,0.12)] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "At least 6 characters" : "Enter your password"}
                className="w-full px-4 py-3 pr-11 bg-surface border border-border rounded-xl text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,170,38,0.12)] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-all active:scale-90 p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {/* Password strength meter */}
            {tab === "signup" && password.length > 0 && (
              <div className="mt-2 animate-fade-in">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= level ? strengthColor : "bg-border"}`} />
                  ))}
                </div>
                <p className={`text-[10px] mt-1 ml-0.5 ${passwordStrength <= 1 ? "text-red-400" : passwordStrength === 2 ? "text-orange-400" : passwordStrength === 3 ? "text-yellow-400" : "text-green-400"}`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {tab === "signup" && (
            <div className="animate-fade-in">
              <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type it again"
                  className={`w-full px-4 py-3 pr-11 bg-surface border rounded-xl text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(252,170,38,0.12)] transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-400/50"
                      : confirmPassword && confirmPassword === password
                      ? "border-green-400/50"
                      : "border-border"
                  }`}
                  required
                />
                {confirmPassword && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${confirmPassword === password ? "text-green-400" : "text-red-400"}`}>
                    {confirmPassword === password ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-400/10 border border-red-400/20 rounded-xl animate-shake">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-1 bg-accent text-background font-semibold rounded-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-accent/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                {tab === "login" ? "Logging in..." : "Creating account..."}
              </span>
            ) : tab === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        {/* Bottom hint */}
        <p className="text-center text-xs text-muted mt-6">
          {tab === "login" ? (
            <>New here? <button type="button" onClick={() => switchTab("signup")} className="text-accent hover:underline">Create an account</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => switchTab("login")} className="text-accent hover:underline">Log in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
