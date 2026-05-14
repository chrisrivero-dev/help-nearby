'use client';

import { useContext, useEffect } from 'react';
import { ThemeContext } from './ThemeProvider';
import type { ReactNode } from 'react';

interface ThemeGuardProps {
  children: ReactNode;
  theme: 'dark' | 'light';
}

/**
 * ThemeGuard enforces a specific theme on the page.
 *
 * Use this for pages that must always be dark or light mode.
 * The theme is set immediately on mount, before any visual rendering,
 * preventing hydration flashes or FOUC.
 *
 * This also updates the React context, ensuring components using useTheme()
 * reflect the correct theme even when navigating between pages.
 */
export function ThemeGuard({ children, theme }: ThemeGuardProps) {
  const { setTheme } = useContext(ThemeContext);

  useEffect(() => {
    // This runs immediately when component mounts
    const root = document.documentElement;
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    setTheme(theme);
  }, [theme, setTheme]);

  return <>{children}</>;
}
