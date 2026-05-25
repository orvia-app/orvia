"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { safeReadStorage, safeWriteStorage, STORAGE_KEYS } from "@/lib/storage";

export type Theme = "dark" | "light" | "system";

export type ResolvedTheme = "dark" | "light";

const DEFAULT_THEME: Theme = "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (next: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const raw = safeReadStorage<unknown>(STORAGE_KEYS.theme, null);

  if (raw === "dark" || raw === "light" || raw === "system") {
    return raw;
  }

  return null;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyDarkClass(isDark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const stored = readStoredTheme() ?? DEFAULT_THEME;
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyDarkClass(resolved === "dark");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (themeRef.current !== "system") return;
      const resolved = mq.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      applyDarkClass(resolved === "dark");
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    if (typeof window === "undefined") return;
    themeRef.current = next;
    setThemeState(next);
    safeWriteStorage(STORAGE_KEYS.theme, next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyDarkClass(resolved === "dark");
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
