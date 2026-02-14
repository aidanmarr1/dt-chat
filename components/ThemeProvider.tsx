"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type AccentColor = "gold" | "blue" | "green" | "purple" | "red" | "pink" | "teal";
export type Density = "compact" | "default" | "comfortable";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  density: Density;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
  accentColor: "gold",
  setAccentColor: () => {},
  density: "default",
  setDensity: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accentColor, setAccentColorState] = useState<AccentColor>("gold");
  const [density, setDensityState] = useState<Density>("default");

  useEffect(() => {
    const stored = localStorage.getItem("dt-theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
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

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  function applyTheme(next: Theme) {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("dt-theme", next);
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
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: applyTheme, accentColor, setAccentColor, density, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}
