#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# theme-injection-tw4.sh
#   Tailwind v4 + Framer Motion theme injection for the Next.js/Fastify bootstrap
#   Injects: dark/light toggle (dark default), CSS tokens via @theme, animated
#   ThemeToggleButton with Motion, ThemeProvider (data-theme on <html>)
# ─────────────────────────────────────────────────────────────────────────────
# Designed for bootstrap v3.0.0 output:
#   - Tailwind v4 (CSS-first config via @theme, no tailwind.config.js)
#   - shadcn/ui initialized (cn() in src/lib/utils.ts)
#   - motion v12 already in dependencies
#   - CNA-generated globals.css with @import "tailwindcss"
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# =================================================
# UX / logging helpers
# =================================================
trap 'echo -e "\n\033[0;31m✖ Failed at line $LINENO\033[0m"; exit 1' ERR

if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  BLUE='\033[0;34m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' BOLD='' DIM='' NC=''
fi

section() { echo; echo -e "${BOLD}${BLUE}════════ $1 ════════${NC}"; }
step()    { echo -e "${BLUE}▶${NC} $1"; }
ok()      { echo -e "${GREEN}✔${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
die()     { echo -e "${RED}✖ $1${NC}"; exit 1; }

START_TIME=$(date +%s)

# =================================================
# PROJECT SETUP
# =================================================
section "PROJECT SETUP"

echo "Enter the path to your project root (contains backend/ and frontend/):"
read -r PROJECT_PATH

PROJECT_PATH="${PROJECT_PATH/#\~/$HOME}"

[[ -d "$PROJECT_PATH" ]]          || die "Path does not exist: $PROJECT_PATH"
[[ -d "$PROJECT_PATH/frontend" ]] || die "No frontend/ directory in: $PROJECT_PATH"

PROJECT_NAME="$(basename "$PROJECT_PATH")"
PROJECT_ROOT="$PROJECT_PATH"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

ok "Project: $PROJECT_NAME"
ok "Frontend: $FRONTEND_DIR"

cd "$FRONTEND_DIR"

# Validate expected bootstrap output
[[ -f package.json ]]        || die "No package.json — is this a bootstrapped frontend?"
[[ -f src/app/globals.css ]] || die "No src/app/globals.css — expected CNA output"
[[ -f src/app/layout.tsx ]]  || die "No src/app/layout.tsx"
[[ -f src/app/page.tsx ]]    || die "No src/app/page.tsx"
[[ -f src/lib/utils.ts ]]    || die "No src/lib/utils.ts — shadcn not initialized?"

# Verify motion is installed
if ! grep -q '"motion"' package.json; then
  warn "motion not found in package.json — installing"
  pnpm add motion
fi

ok "Bootstrap output validated"

# =================================================
# 1. GLOBALS.CSS — Tailwind v4 @theme + dark/light tokens
# =================================================
section "THEME CSS"

step "Rewriting src/app/globals.css (backup created)"
cp src/app/globals.css src/app/globals.css.bak

cat > src/app/globals.css <<'CSS'
@import "tailwindcss";

/* ─────────────────────────────────────────────────
   Tailwind v4 — CSS-first theme configuration
   Token taxonomy: --color-{role}
   Dark is default. Light applied via [data-theme="light"].
   ───────────────────────────────────────────────── */

/* ── Dark theme (default) ── */
@theme {
  --color-bg:              #0f0f0f;
  --color-bg-alt:          #1a1a1a;
  --color-surface:         #1e1e1e;
  --color-surface-alt:     #2a2a2a;
  --color-text:            #e8e8e8;
  --color-text-muted:      #888888;
  --color-border:          #2e2e2e;
  --color-border-strong:   #444444;
  --color-primary:         #60a5fa;
  --color-primary-hover:   #93c5fd;
  --color-shadow:          rgba(0, 0, 0, 0.4);
}

/* ── Light overrides ── */
:root[data-theme="light"] {
  --color-bg:              #fafafa;
  --color-bg-alt:          #f0f0f0;
  --color-surface:         #ffffff;
  --color-surface-alt:     #f5f5f5;
  --color-text:            #111111;
  --color-text-muted:      #666666;
  --color-border:          #e0e0e0;
  --color-border-strong:   #999999;
  --color-primary:         #2563eb;
  --color-primary-hover:   #1d4ed8;
  --color-shadow:          rgba(0, 0, 0, 0.08);
}

/* ── Reset ── */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* ── Base body ── */
body {
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Smooth theme transitions (bg, text, border only — no layout thrash) ── */
body,
body * {
  transition:
    background-color 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

/* ── Disable transitions on initial load to prevent FOUC flash ── */
html.no-transitions,
html.no-transitions * {
  transition: none !important;
}

/* ── Focus ring ── */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
CSS
ok "globals.css rewritten with Tailwind v4 @theme tokens (dark default)"

# =================================================
# 2. THEME PROVIDER — data-theme on <html>, localStorage persistence
# =================================================
section "THEME PROVIDER"

step "Creating src/components/ThemeProvider.tsx"
mkdir -p src/components

cat > src/components/ThemeProvider.tsx <<'TSX'
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
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

/**
 * Manages dark/light theme via `data-theme` attribute on `<html>`.
 *
 * - Persists to localStorage
 * - Falls back to system preference, then dark
 * - Blocks transitions on first paint to prevent FOUC
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;

    // Block transitions during hydration
    root.classList.add('no-transitions');

    const stored = localStorage.getItem('theme') as Theme | null;
    const initial: Theme =
      stored ??
      (window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark');

    root.dataset.theme = initial;
    setTheme(initial);

    // Re-enable transitions after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('no-transitions');
      });
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
TSX
ok "ThemeProvider.tsx created"

# =================================================
# 3. THEME TOGGLE BUTTON — Motion-animated icon swap
# =================================================
section "THEME TOGGLE BUTTON"

step "Creating src/components/ThemeToggleButton.tsx"

cat > src/components/ThemeToggleButton.tsx <<'TSX'
'use client';

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Animated dark/light toggle.
 * Uses Motion for a smooth icon rotation + fade on swap.
 * Tailwind v4 utility classes reference @theme tokens directly.
 */
export function ThemeToggleButton() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`
        relative flex items-center justify-center
        size-9 rounded-lg cursor-pointer
        border border-border-strong
        bg-surface text-text
        hover:bg-surface-alt
        active:scale-95
        transition-transform duration-150
      `.trim()}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute text-base leading-none"
        >
          {isDark ? (
            <SunIcon />
          ) : (
            <MoonIcon />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/* Inline SVG icons — no external dependency */
function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
TSX
ok "ThemeToggleButton.tsx created"

# =================================================
# 4. LAYOUT.TSX — Wrap with ThemeProvider
# =================================================
section "LAYOUT INJECTION"

step "Rewriting src/app/layout.tsx (backup created)"
cp src/app/layout.tsx src/app/layout.tsx.bak

cat > src/app/layout.tsx <<'TSX'
import type { Metadata } from 'next';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Full-Stack Starter',
  description: 'Next.js + Fastify scaffold',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
TSX
ok "layout.tsx rewritten with ThemeProvider"

# =================================================
# 5. LANDING PAGE — inject toggle into header
# =================================================
section "LANDING PAGE"

step "Rewriting src/app/page.tsx (backup created)"
cp src/app/page.tsx src/app/page.tsx.bak

cat > src/app/page.tsx <<'TSX'
'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

export default function LandingPage() {
  const [showInfo, setShowInfo] = useState(false);
  const [readmeContent, setReadmeContent] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleInfo = async () => {
    if (!showInfo && readmeContent === '') {
      setLoading(true);
      try {
        const res = await fetch('/README.md');
        setReadmeContent(await res.text());
      } catch {
        setReadmeContent('Unable to load README from /frontend/public/');
      }
      setLoading(false);
    }
    setShowInfo((prev) => !prev);
  };

  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* ── Header ── */}
      <header className="flex items-center justify-between border-b border-border-strong px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Next.js / TypeScript + Fastify Bootstrap
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleInfo}
            className={`
              rounded-lg border border-border-strong
              bg-surface px-4 py-1.5 text-sm font-medium text-text
              hover:bg-surface-alt cursor-pointer
              transition-colors duration-150
            `.trim()}
          >
            {loading ? 'Loading…' : showInfo ? 'Hide README' : 'README'}
          </button>
          <ThemeToggleButton />
        </div>
      </header>

      {/* ── README panel ── */}
      {showInfo && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mx-auto max-w-4xl px-6 py-8"
        >
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-muted">
            {readmeContent || 'No content available'}
          </pre>
        </motion.section>
      )}
    </div>
  );
}
TSX
ok "page.tsx rewritten with ThemeToggleButton + Motion"

# =================================================
# SUMMARY
# =================================================
section "COMPLETE"

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo
echo -e "${GREEN}${BOLD}Theme injection complete.${NC}  (${ELAPSED}s)"
echo
echo -e "${BOLD}Files written:${NC}"
echo -e "  ${DIM}src/app/globals.css${NC}        Tailwind v4 @theme tokens (dark default)"
echo -e "  ${DIM}src/app/layout.tsx${NC}         ThemeProvider wrapper"
echo -e "  ${DIM}src/app/page.tsx${NC}           Landing page with toggle + Motion"
echo -e "  ${DIM}src/components/ThemeProvider.tsx${NC}"
echo -e "  ${DIM}src/components/ThemeToggleButton.tsx${NC}"
echo
echo -e "${BOLD}Backups:${NC}"
echo -e "  ${DIM}src/app/globals.css.bak${NC}"
echo -e "  ${DIM}src/app/layout.tsx.bak${NC}"
echo -e "  ${DIM}src/app/page.tsx.bak${NC}"
echo
echo -e "${BOLD}Run:${NC}"
echo -e "  ${DIM}cd $FRONTEND_DIR && pnpm dev${NC}"