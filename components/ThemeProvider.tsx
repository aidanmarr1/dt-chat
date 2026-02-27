"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchSettings } from "@/lib/settings-sync";

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
    if (ac && ["gold", "blue", "green", "purple", "red", "pink", "teal"].includes(ac)) {
      setAccentColorState(ac);
    }

    const dn = localStorage.getItem("dt-density") as Density | null;
    if (dn === "compact" || dn === "comfortable") {
      setDensityState(dn);
    }
  }, []);

  // Sync settings from DB (DB is authoritative for cross-device sync)
  useEffect(() => {
    fetchSettings().then(s => {
      if (Object.keys(s).length === 0) return;

      // Theme
      if (s["dt-theme"]) {
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

      // Accent
      if (s["dt-accent"]) {
        const ac = s["dt-accent"];
        if (ac === "gold") {
          localStorage.removeItem("dt-accent");
          setAccentColorState("gold");
          document.documentElement.removeAttribute("data-accent");
        } else {
          localStorage.setItem("dt-accent", ac);
          setAccentColorState(ac as AccentColor);
          document.documentElement.setAttribute("data-accent", ac);
        }
      }

      // Density
      if (s["dt-density"]) {
        const dn = s["dt-density"];
        if (dn === "default") {
          localStorage.removeItem("dt-density");
          setDensityState("default");
          document.documentElement.removeAttribute("data-density");
        } else if (dn === "compact" || dn === "comfortable") {
          localStorage.setItem("dt-density", dn);
          setDensityState(dn);
          document.documentElement.setAttribute("data-density", dn);
        }
      }

      // Font size (DOM attribute applied early so it's ready before SettingsMenu opens)
      if (s["dt-font-size"]) {
        if (s["dt-font-size"] === "small" || s["dt-font-size"] === "large") {
          localStorage.setItem("dt-font-size", s["dt-font-size"]);
          document.documentElement.setAttribute("data-font-size", s["dt-font-size"]);
        } else {
          localStorage.removeItem("dt-font-size");
          document.documentElement.removeAttribute("data-font-size");
        }
      }

      // Bubble style
      if (s["dt-bubble-style"]) {
        if (s["dt-bubble-style"] === "minimal" || s["dt-bubble-style"] === "classic") {
          localStorage.setItem("dt-bubble-style", s["dt-bubble-style"]);
          document.documentElement.setAttribute("data-bubble-style", s["dt-bubble-style"]);
        } else {
          localStorage.removeItem("dt-bubble-style");
          document.documentElement.removeAttribute("data-bubble-style");
        }
      }

      // Reduce motion
      if (s["dt-reduce-motion"]) {
        if (s["dt-reduce-motion"] === "true") {
          localStorage.setItem("dt-reduce-motion", "true");
          document.documentElement.setAttribute("data-reduce-motion", "true");
        } else {
          localStorage.removeItem("dt-reduce-motion");
          document.documentElement.removeAttribute("data-reduce-motion");
        }
      }
    });
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
