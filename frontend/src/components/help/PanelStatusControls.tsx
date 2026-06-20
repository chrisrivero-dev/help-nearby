'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

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
  const cardText = isDark ? '#dedede' : '#111111';
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
  const mutedText = isDark ? '#7a7a7a' : '#888';

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
