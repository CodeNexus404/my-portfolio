"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";

type ThemeScopeValue = {
  theme: ThemeMode;
  toggle: () => void;
  setTheme: (t: ThemeMode) => void;
};

const ThemeScopeContext = createContext<ThemeScopeValue | null>(null);

/**
 * Wraps an area in an independent, persisted theme. Each area (public site,
 * dashboard) uses its own `storageKey` so changing one never affects the other.
 *
 * The theme is applied as `.theme-light` / `.theme-dark` on a `display:contents`
 * wrapper, so it establishes design tokens + drives Tailwind's `dark:` variant
 * for its subtree without touching <html> (which would couple the two areas).
 */
export function ThemeScopeProvider({
  storageKey,
  defaultTheme = "dark",
  children,
}: {
  storageKey: string;
  defaultTheme?: ThemeMode;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const saved = window.localStorage.getItem(storageKey);
    return saved === "light" || saved === "dark" ? saved : defaultTheme;
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const toggle = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  const className = theme === "dark" ? "theme-dark" : "theme-light";

  return (
    <ThemeScopeContext.Provider value={{ theme, toggle, setTheme }}>
      <div className={`${className} contents`}>{children}</div>
    </ThemeScopeContext.Provider>
  );
}

/** Read the nearest ThemeScope (theme + controls). Throws if used outside one. */
export function useScopedTheme(): ThemeScopeValue {
  const ctx = useContext(ThemeScopeContext);
  if (!ctx) {
    throw new Error("useScopedTheme must be used within a ThemeScopeProvider");
  }
  return ctx;
}
