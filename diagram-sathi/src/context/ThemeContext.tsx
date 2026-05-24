import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";
export type Accent = "purple" | "orange" | "green" | "blue" | "silver";

export const ACCENT_MAP: Record<Accent, string> = {
  purple: "#803bff",
  orange: "#ea580c",
  green: "#10b981",
  blue: "#0284c7",
  silver: "#64748b",
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  const [accent, setAccentState] = useState<Accent>(() => {
    const saved = localStorage.getItem("accent") as Accent;
    return saved && ACCENT_MAP[saved] ? saved : "purple";
  });

  useEffect(() => {
    // Apply theme class and data-attribute to document root
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Apply dynamic primary accent color hex to CSS root variable
    const root = window.document.documentElement;
    root.style.setProperty("--primary", ACCENT_MAP[accent]);
    localStorage.setItem("accent", accent);
  }, [accent]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccent = (newAccent: Accent) => {
    setAccentState(newAccent);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

