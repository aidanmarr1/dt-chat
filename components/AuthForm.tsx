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
  const [success, setSuccess] = useState(false);
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
          setSuccess(true);
          setTimeout(() => router.push("/chat"), 700);
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
          setSuccess(true);
          setTimeout(() => router.push("/chat"), 700);
        }
      }
    } catch {
      setError("Something went wrong");
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

  // Password requirements for checklist
  const requirements = [
    { label: "6+ characters", met: password.length >= 6 },
    { label: "Uppercase & lowercase", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "A number", met: /\d/.test(password) },
    { label: "A special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-accent/8 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-accent/6 blur-3xl animate-float-slow [animation-delay:2.5s]" />
        <div className="absolute top-1/2 right-1/4 w-56 h-56 rounded-full bg-accent/4 blur-3xl animate-float-slow [animation-delay:5s]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--acc-rgb),0.04)_0%,transparent_70%)]" />
        {/* Dot grid texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(var(--acc-rgb),0.04)_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-scale relative z-10">
        {/* Logo — above the card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden shadow-lg shadow-accent/10 animate-spring-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512">
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
          <h1 className="text-2xl font-semibold tracking-tight font-heading">D&T <span className="text-accent">Chat</span></h1>
          <p key={tab} className="text-sm text-muted mt-1 font-heading animate-fade-in">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Glassmorphic card */}
        <div className={`bg-surface/60 backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/10 p-6 sm:p-8 transition-all hover:border-border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${
          success ? "border-green-500/40" : "border-border/60"
        }`}>
          {/* Tab Toggle with sliding indicator */}
          <div className="relative flex mb-6 bg-surface rounded-xl p-1 border border-border">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-accent rounded-lg shadow-sm transition-all duration-300 ease-out"
              style={{ left: tab === "login" ? "4px" : "calc(50% + 0px)" }}
            />
            <button
              type="button"
              onClick={() => switchTab("login")}
              className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-300 active:scale-95 flex items-center justify-center gap-1.5 ${
                tab === "login" ? "text-background" : "text-muted hover:text-foreground"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Log In
            </button>
            <button
              type="button"
              onClick={() => switchTab("signup")}
              className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-300 active:scale-95 flex items-center justify-center gap-1.5 ${
                tab === "signup" ? "text-background" : "text-muted hover:text-foreground"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "signup" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Display Name</label>
                <div className="relative group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors pointer-events-none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others will see you"
                    className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] focus:shadow-md transition-all shadow-sm"
                    required
                    disabled={success}
                  />
                </div>
              </div>
            )}

            <div className={tab === "signup" ? "animate-fade-in stagger-1" : ""}>
              <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Email</label>
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors pointer-events-none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] focus:shadow-md transition-all shadow-sm"
                  required
                  disabled={success}
                />
              </div>
            </div>

            <div className={tab === "signup" ? "animate-fade-in stagger-2" : ""}>
              <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors pointer-events-none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === "signup" ? "At least 6 characters" : "Enter your password"}
                  className="w-full pl-11 pr-11 py-3 bg-surface border border-border rounded-xl text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] focus:shadow-md transition-all shadow-sm"
                  required
                  disabled={success}
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
              {/* Password strength meter + requirements */}
              {tab === "signup" && password.length > 0 && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= level ? strengthColor : "bg-border"}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className={`text-[10px] ml-0.5 ${passwordStrength <= 1 ? "text-red-400" : passwordStrength === 2 ? "text-orange-400" : passwordStrength === 3 ? "text-yellow-400" : "text-green-400"}`}>
                      {strengthLabel}
                    </p>
                  </div>
                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                    {requirements.map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        {req.met ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full border border-border shrink-0" />
                        )}
                        <span className={`text-[10px] ${req.met ? "text-muted" : "text-muted/50"}`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {tab === "signup" && (
              <div className="animate-fade-in stagger-3">
                <label className="block text-xs font-medium text-muted mb-1.5 ml-1">Confirm Password</label>
                <div className="relative group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors pointer-events-none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    className={`w-full pl-11 pr-11 py-3 bg-surface border rounded-xl text-base text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(var(--acc-rgb),0.12)] focus:shadow-md transition-all shadow-sm ${
                      confirmPassword && confirmPassword !== password
                        ? "border-red-400/50"
                        : confirmPassword && confirmPassword === password
                        ? "border-green-400/50"
                        : "border-border"
                    }`}
                    required
                    disabled={success}
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
              disabled={loading || success}
              className={`w-full py-3 mt-1 font-semibold rounded-xl transition-all active:scale-[0.98] disabled:cursor-not-allowed shadow-sm group/btn relative overflow-hidden ${
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
                    {tab === "login" ? "Welcome!" : "Account Created!"}
                  </span>
                ) : loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                    {tab === "login" ? "Logging in..." : "Creating account..."}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    {tab === "login" ? "Log In" : "Create Account"}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </span>
                )}
              </span>
            </button>
          </form>

          {/* Bottom hint */}
          <div className="border-t border-border/40 pt-4 mt-6">
            <p className="text-center text-xs text-muted">
              {tab === "login" ? (
                <>New here?{" "}
                  <button type="button" onClick={() => switchTab("signup")} className="relative text-accent after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-accent hover:after:w-full after:transition-all after:duration-300">
                    Create an account
                  </button>
                </>
              ) : (
                <>Already have an account?{" "}
                  <button type="button" onClick={() => switchTab("login")} className="relative text-accent after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-accent hover:after:w-full after:transition-all after:duration-300">
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
