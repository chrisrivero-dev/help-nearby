/**
 * Design Tokens - Main Export
 * Centralized design system for Help Nearby
 */

// Re-export all tokens
export { colors, themeColors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { radius } from './radius';
export { motion } from './motion';

// Re-export types
export type { ColorKey, ThemeColorKey } from './colors';
export type { SpacingKey } from './spacing';
export type { TypographyKey, TypographyTextKey } from './typography';
export type { RadiusKey } from './radius';
export type { MotionKey } from './motion';

// Combined theme interface
export interface Theme {
  name: 'light' | 'dark';
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: Record<string, unknown>;
}