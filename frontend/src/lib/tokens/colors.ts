/**
 * Design Token: Color System
 * 
 * Structure:
 * - brand: Primary/secondary brand colors
 * - neutral: Grayscale for text and backgrounds
 * - semantic: Contextual colors (success, error, warning)
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#f9c700',
    dark: '#000000',
    light: '#ffffff',
  },
  
  // Neutral grayscale
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0b0b0f',
  },
  
  // Semantic colors
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Page-specific colors (from globals.css)
  page: {
    bgLight: '#ffffff',
    bgDark: '#000000',
    headerLight: '#e6ecf1ff',
    headerDark: '#000000',
    border: '#000000',
  },
} as const;

/**
 * Theme-aware color mapping
 * Use `getColor('background')` to get appropriate color for current theme
 */
export const themeColors = {
  light: {
    background: colors.neutral[50],
    surface: colors.neutral[100],
    text: colors.neutral[900],
    textSecondary: colors.neutral[700],
    textMuted: colors.neutral[500],
    border: colors.neutral[200],
    accent: colors.brand.primary,
  },
  dark: {
    background: colors.neutral[950],
    surface: colors.neutral[900],
    text: colors.neutral[100],
    textSecondary: colors.neutral[400],
    textMuted: colors.neutral[500],
    border: colors.neutral[800],
    accent: colors.brand.primary,
  },
} as const;

export type ColorKey = keyof typeof colors;
export type ThemeColorKey = keyof typeof themeColors.light;