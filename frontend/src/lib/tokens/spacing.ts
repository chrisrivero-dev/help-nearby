/**
 * Design Token: Spacing System
 * 
 * Based on 4pt grid system
 * Matches your current project's spacing patterns
 */

export const spacing = {
  // Micro spacing (0.25rem - 0.75rem)
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  
  // Standard spacing (1rem - 2.5rem)
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  
  // Large spacing (3rem - 6rem)
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  
  // Section spacing (for page sections)
  section: '6rem',    // 96px
  sectionLarge: '8rem', // 128px
  
  // Layout-specific
  container: '1100px',
  containerWide: '1440px',
  containerNarrow: '720px',
} as const;

export type SpacingKey = keyof typeof spacing;