/**
 * Design Token: Typography System
 * 
 * Based on Geist Sans and Geist Mono (your current fonts)
 */

export const typography = {
  // Font families
  families: {
    sans: 'var(--font-geist-sans), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  
  // Font sizes (CSS value)
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },
  
  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  // Line heights
  leading: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  // Letter spacing
  tracking: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text utility classes mapping
  text: {
    display: {
      fontFamily: 'var(--font-geist-sans)',
      fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    heading: {
      fontFamily: 'var(--font-geist-sans)',
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    subheading: {
      fontFamily: 'var(--font-geist-sans)',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    body: {
      fontFamily: 'var(--font-geist-sans)',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
    mono: {
      fontFamily: 'var(--font-geist-mono)',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
    },
  },
} as const;

export type TypographyKey = keyof typeof typography;
export type TypographyTextKey = keyof typeof typography.text;