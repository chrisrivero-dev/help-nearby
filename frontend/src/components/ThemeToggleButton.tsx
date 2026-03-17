'use client';

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './useTheme';

/**
 * Animated dark/light toggle.
 * Uses Framer Motion for a smooth icon rotation + fade on swap.
 * No border, no fill - transparent background with gold icons.
 */
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: 'none',
        backgroundColor: 'transparent',
        transition: 'transform 0.2s ease',
      }}
      whileHover={{ backgroundColor: 'transparent' }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ position: 'absolute', fontSize: '18px', lineHeight: '1' }}
        >
          {isDark ? (
            <SunIcon />
          ) : (
            <MoonIcon />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/* Inline SVG icons - no external dependency */
function SunIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D4AF37"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#514e57"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
