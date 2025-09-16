import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {}
  // Fallback to system preference
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyThemeClass = useCallback((t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme, applyThemeClass]);

  useEffect(() => {
    // Keep in sync if user changes system theme and no explicit preference was stored previously
    const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mql) return;
    const onChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== "light" && stored !== "dark") {
          setThemeState(mql.matches ? "dark" : "light");
        }
      } catch {}
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === "dark" ? "light" : "dark")), []);

  return { theme, setTheme, toggleTheme };
}
