import { useCallback, useEffect, useRef, useState } from "react";

export type Theme = "light" | "dark";
export type ThemeMode = Theme | "auto"; // "auto" = dark from 19:00 to 05:00

const STORAGE_KEY = "theme"; // stores mode: "light" | "dark" | "auto"

function isInNightWindow(d: Date = new Date()): boolean {
  const h = d.getHours();
  // Night window: 19:00 - 23:59 and 00:00 - 04:59
  return h >= 19 || h < 5;
}

function computeEffectiveTheme(mode: ThemeMode, now: Date = new Date()): Theme {
  if (mode === "auto") {
    return isInNightWindow(now) ? "dark" : "light";
  }
  return mode;
}

function getInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  } catch {}
  // Default to system preference for first load if nothing stored
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}

function msUntilNextBoundary(now: Date = new Date()): number {
  // Next 05:00 or 19:00 boundary
  const next = new Date(now.getTime());
  const hour = now.getHours();
  if (hour >= 19 || hour < 5) {
    // In dark window -> next boundary is 05:00 next day if before 5, else today/tomorrow accordingly
    if (hour >= 19) {
      // next is tomorrow at 05:00
      next.setDate(now.getDate() + 1);
    }
    next.setHours(5, 0, 0, 0);
  } else {
    // In light window -> next boundary is 19:00 today
    next.setHours(19, 0, 0, 0);
    if (next <= now) {
      // safety: if passed, go to tomorrow 19:00
      next.setDate(next.getDate() + 1);
    }
  }
  return next.getTime() - now.getTime();
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [theme, setThemeState] = useState<Theme>(() => computeEffectiveTheme(getInitialMode()));
  const timerRef = useRef<number | null>(null);

  const applyThemeClass = useCallback((t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  // Persist mode and apply effective theme
  useEffect(() => {
    const effective = computeEffectiveTheme(mode);
    setThemeState(effective);
    applyThemeClass(effective);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {}

    // Manage timer only in auto mode
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (mode === "auto") {
      const wait = Math.max(250, msUntilNextBoundary());
      timerRef.current = window.setTimeout(() => {
        const nextEffective = computeEffectiveTheme("auto");
        setThemeState(nextEffective);
        applyThemeClass(nextEffective);
      }, wait);
    }

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, applyThemeClass]);

  // Optional: Keep legacy system sync behavior only when user hasn't explicitly chosen a mode before
  useEffect(() => {
    const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mql) return;
    const onChange = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        // if user never picked (no stored) we might respond to system; if stored exists, we respect it.
        if (stored !== "light" && stored !== "dark" && stored !== "auto") {
          const sys = mql.matches ? "dark" : "light";
          setModeState(sys);
        }
      } catch {}
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const toggleTheme = useCallback(() => {
    // Binary toggle between light/dark; if in auto, toggle into opposite explicit theme
    setModeState((prev) => {
      const current = prev === "auto" ? computeEffectiveTheme("auto") : (prev as Theme);
      return current === "dark" ? "light" : "dark";
    });
  }, []);
  const cycleMode = useCallback(() => {
    setModeState((prev) => (prev === "light" ? "dark" : prev === "dark" ? "auto" : "light"));
  }, []);

  return { theme, mode, setMode, toggleTheme, cycleMode };
}
