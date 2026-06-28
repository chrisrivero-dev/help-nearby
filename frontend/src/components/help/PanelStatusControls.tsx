'use client';

import type { FC, ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Info, RefreshCw } from 'lucide-react';

/**
 * Shared panel-header status square. While loading it is an empty bordered
 * square that rotates in place like a gear, then smoothly fills green (ok) or
 * red (failed) once the status is known. Extracted from ResourcesPanel so every
 * panel uses the same indicator.
 */
export const PanelStatusSquare: FC<{
  loading: boolean;
  ok: boolean;
  isDark: boolean;
}> = ({ loading, ok, isDark }) => {
  const cardText = isDark ? '#f4f4f4' : '#111111';
  const statusColor = ok ? '#22c55e' : '#ef4444';

  return (
    <motion.div
      style={{
        width: 12,
        height: 12,
        borderRadius: 0,
        flexShrink: 0,
        border: '2px solid',
        transformOrigin: '50% 50%',
      }}
      animate={
        loading
          ? {
              rotate: [0, 90, 90, 180, 180, 270, 270, 360, 360],
              backgroundColor: 'rgba(0,0,0,0)',
              borderColor: cardText,
            }
          : {
              rotate: 0,
              backgroundColor: statusColor,
              borderColor: statusColor,
            }
      }
      transition={
        loading
          ? {
              rotate: {
                duration: 4,
                ease: 'easeInOut',
                times: [0, 0.075, 0.25, 0.325, 0.5, 0.575, 0.75, 0.825, 1],
                repeat: Infinity,
              },
              backgroundColor: { duration: 0.3 },
            }
          : {
              rotate: { duration: 0.3 },
              backgroundColor: { duration: 0.5 },
              borderColor: { duration: 0.5 },
            }
      }
    />
  );
};

/**
 * Shared panel-header refresh button. Spins continuously while loading and is
 * disabled during the fetch. Stops click propagation so it never toggles the
 * panel's collapse state. Extracted from ResourcesPanel.
 */
export const PanelRefreshButton: FC<{
  loading: boolean;
  onRefresh: () => void;
  isDark: boolean;
  label?: string;
}> = ({ loading, onRefresh, isDark, label = 'Refresh' }) => {
  const mutedText = isDark ? '#b8b8b8' : '#888';

  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        onRefresh();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: loading ? 'default' : 'pointer',
        color: mutedText,
        lineHeight: 0,
      }}
      animate={loading ? { rotate: 360 } : { rotate: 0 }}
      transition={
        loading
          ? { duration: 1, ease: 'linear', repeat: Infinity }
          : { duration: 0.2 }
      }
    >
      <RefreshCw size={13} />
    </motion.button>
  );
};

/**
 * Shared panel-header info popover. The info button opens a tooltip listing the
 * panel's data sources. The tooltip renders in a `document.body` portal with
 * fixed positioning so it paints above the fixed NavBar — a panel's own stacking
 * context (framer-motion transforms) traps an in-tree popover beneath it.
 * `title` is the popover heading; `children` is the body (e.g. the source list).
 */
export const PanelInfoPopover: FC<{
  isDark: boolean;
  title: string;
  ariaLabel?: string;
  children: ReactNode;
}> = ({ isDark, title, ariaLabel = 'About this panel', children }) => {
  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#b8b8b8' : '#888';
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const openPopover = useCallback(() => {
    if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    setOpen(true);
  }, []);

  return (
    <div
      ref={anchorRef}
      style={{ position: 'relative' }}
      onMouseEnter={openPopover}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPopover())}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: mutedText,
          lineHeight: 0,
        }}
      >
        <Info size={13} />
      </button>
      {open &&
        rect &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              bottom: window.innerHeight - rect.top + 12,
              right: window.innerWidth - rect.right,
              zIndex: 100002,
              minWidth: 240,
              maxWidth: 280,
              padding: '0.65rem 0.8rem',
              background: isDark ? '#0a0a0a' : '#ffffff',
              border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
              boxShadow: isDark
                ? '0 4px 12px rgba(0,0,0,0.6)'
                : '0 4px 12px rgba(0,0,0,0.08)',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            <div
              style={{
                fontWeight: 800,
                fontSize: '0.62rem',
                letterSpacing: '0.1em',
                color: cardText,
                marginBottom: '0.4rem',
              }}
            >
              {title}
            </div>
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
};
