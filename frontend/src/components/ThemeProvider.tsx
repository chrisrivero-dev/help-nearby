'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

/**
 * Manages dark/light theme via `data-theme` attribute on `<html>`.
 *
 * - Persists to localStorage
 * - Falls back to system preference, then dark
 * - Uses direct DOM manipulation for immediate visual updates
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem('theme') as Theme | null;
    const initial: Theme =
      stored ??
      (window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark');

    root.dataset.theme = initial;
    setTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const current = root.dataset.theme as Theme;
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    setTheme(next);
    localStorage.setItem('theme', next);
  }, []);

  const setThemeValue = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    root.dataset.theme = newTheme;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: setThemeValue }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
