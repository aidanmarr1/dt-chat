"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";
export type AccentColor = "gold" | "blue" | "green" | "purple" | "red" | "pink" | "teal";
export type Density = "compact" | "default" | "comfortable";

interface ThemeContextValue {
  theme: Theme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setThemePreference: (p: ThemePreference) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  density: Density;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  themePreference: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
  setThemePreference: () => {},
  accentColor: "gold",
  setAccentColor: () => {},
  density: "default",
  setDensity: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("dark");
  const [accentColor, setAccentColorState] = useState<AccentColor>("gold");
  const [density, setDensityState] = useState<Density>("default");

  useEffect(() => {
    const stored = localStorage.getItem("dt-theme");
    if (stored === "system") {
      setThemePreferenceState("system");
      const resolved = getSystemTheme();
      setThemeState(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    } else if (stored === "light" || stored === "dark") {
      setThemePreferenceState(stored);
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setThemeState("light");
      document.documentElement.setAttribute("data-theme", "light");
    }

    const ac = localStorage.getItem("dt-accent") as AccentColor | null;
    if (ac && ["blue", "green", "purple", "red", "pink", "teal"].includes(ac)) {
      setAccentColorState(ac);
    }

    const dn = localStorage.getItem("dt-density") as Density | null;
    if (dn === "compact" || dn === "comfortable") {
      setDensityState(dn);
    }
  }, []);

  // Load settings from DB for fresh browsers (no localStorage yet)
  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.settings) return;
        const s = data.settings as Record<string, string>;

        if (!localStorage.getItem("dt-theme") && s["dt-theme"]) {
          const val = s["dt-theme"];
          localStorage.setItem("dt-theme", val);
          if (val === "system") {
            setThemePreferenceState("system");
            const resolved = getSystemTheme();
            setThemeState(resolved);
            document.documentElement.setAttribute("data-theme", resolved);
          } else if (val === "light" || val === "dark") {
            setThemePreferenceState(val);
            setThemeState(val);
            document.documentElement.setAttribute("data-theme", val);
          }
        }

        if (!localStorage.getItem("dt-accent") && s["dt-accent"]) {
          const ac = s["dt-accent"] as AccentColor;
          localStorage.setItem("dt-accent", ac);
          setAccentColorState(ac);
          document.documentElement.setAttribute("data-accent", ac);
        }

        if (!localStorage.getItem("dt-density") && s["dt-density"]) {
          const dn = s["dt-density"] as Density;
          localStorage.setItem("dt-density", dn);
          setDensityState(dn);
          document.documentElement.setAttribute("data-density", dn);
        }
      })
      .catch(() => {});
  }, []);

  // Listen for OS theme changes when preference is "system"
  useEffect(() => {
    if (themePreference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    function handleChange(e: MediaQueryListEvent) {
      const resolved = e.matches ? "light" : "dark";
      setThemeState(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [themePreference]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  function applyTheme(next: Theme) {
    setThemePreferenceState(next);
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("dt-theme", next);
  }

  function setThemePreference(pref: ThemePreference) {
    setThemePreferenceState(pref);
    localStorage.setItem("dt-theme", pref);
    if (pref === "system") {
      const resolved = getSystemTheme();
      setThemeState(resolved);
      document.documentElement.setAttribute("data-theme", resolved);
    } else {
      setThemeState(pref);
      document.documentElement.setAttribute("data-theme", pref);
    }
  }

  function setAccentColor(c: AccentColor) {
    setAccentColorState(c);
    if (c === "gold") {
      document.documentElement.removeAttribute("data-accent");
      localStorage.removeItem("dt-accent");
    } else {
      document.documentElement.setAttribute("data-accent", c);
      localStorage.setItem("dt-accent", c);
    }
  }

  function setDensity(d: Density) {
    setDensityState(d);
    if (d === "default") {
      document.documentElement.removeAttribute("data-density");
      localStorage.removeItem("dt-density");
    } else {
      document.documentElement.setAttribute("data-density", d);
      localStorage.setItem("dt-density", d);
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, themePreference, toggleTheme, setTheme: applyTheme, setThemePreference, accentColor, setAccentColor, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}
