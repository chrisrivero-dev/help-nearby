// styles/tokens.css.ts
import { createGlobalTheme } from '@vanilla-extract/css';

export const vars = createGlobalTheme(':root', {
  color: {
    // Base
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#64748b',
    border: '#e5e7eb',

    // Surfaces
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',

    // Brand / intent
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    danger: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
  },

  font: {
    family: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      xxl: '1.5rem',
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  space: {
    none: '0',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.08)',
    lg: '0 10px 15px rgba(0,0,0,0.12)',
  },

  zIndex: {
    base: '0',
    dropdown: '100',
    sticky: '200',
    modal: '300',
    toast: '400',
    overlay: '500',
  },

  transition: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
  },
});
