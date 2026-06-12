'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

const DEMO_UPDATES = [
  {
    title: 'Cooling Center Now Open',
    detail: 'Central Library · 200 Park Ave',
    ago: '1h ago',
    type: 'info' as const,
  },
  {
    title: 'Road Closure: Main St',
    detail: 'Between 4th & 5th Ave until 5PM',
    ago: '3h ago',
    type: 'warning' as const,
  },
  {
    title: 'Free Food Distribution',
    detail: 'Unity Church · 12PM – 3PM',
    ago: '5h ago',
    type: 'info' as const,
  },
  {
    title: 'Emergency Shelter Activated',
    detail: 'Community Center · 800 Elm St',
    ago: '8h ago',
    type: 'critical' as const,
  },
];

const GOLD_COLOR = '#f59e0b';

export const UpdatesPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip } = useLocationContext();
  const hasLocation = !!zip;
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const accentColor = GOLD_COLOR;
  const isLive = false; // Static data only

  // Locked panel
  const LockedPanel = ({ minH = 100 }: { minH?: number }) => (
    <div
      style={{
        padding: '1.75rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.55rem',
        minHeight: minH,
      }}
    >
      {/* Bell icon removed for neutral style */}
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.78rem',
          color: mutedText,
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.65,
          maxWidth: 280,
        }}
      >
        Enter your location to see latest updates.
      </p>
    </div>
  );

  return (
    <motion.div
      style={{
        position: 'relative',
        breakInside: 'avoid',
        height: 'fit-content',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Back panel - static, zIndex 1 */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)'}`,
        }}
      />
      {/* Front panel - zIndex 2, lifts on hover */}
      <motion.div
        style={{
          background: isDark ? '#121212' : '#ffffff',
          border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
          position: 'relative',
          zIndex: 2,
        }}
        whileHover={{
          x: -4,
          y: -4,
        }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: `1px solid ${divider}`,
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Status indicator - moved left of title, flat bright square */}
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 0,
                background: isLive ? '#22c55e' : '#ef4444',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              UPDATES! NEARBY
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.56rem',
                letterSpacing: '0.12em',
                color: mutedText,
                border: `1px solid ${divider}`,
                background: isDark ? '#1a1a1a' : '#f5f5f5',
                padding: '0.14rem 0.4rem',
                flexShrink: 0,
              }}
            >
              PREVIEW
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {/* Info tooltip */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setSourcesOpen(true)}
              onMouseLeave={() => setSourcesOpen(false)}
            >
              <button
                type="button"
                aria-label="About this preview panel"
                aria-expanded={sourcesOpen}
                onClick={() => setSourcesOpen((v) => !v)}
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
              {sourcesOpen && (
                <div
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    zIndex: 99999,
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
                    PREVIEW PANEL
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.22rem',
                    }}
                  >
                    <li
                      style={{
                        fontSize: '0.68rem',
                        color: mutedText,
                        lineHeight: 1.4,
                      }}
                    >
                      Example content showing how this panel will work. Not
                      live local information.
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {/* Collapse indicator */}
            <motion.div
              style={{
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mutedText,
              }}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9L12 15L18 9" />
              </svg>
            </motion.div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <>
              {hasLocation ? (
                <motion.div
                  key="updates-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    style={{
                      padding: '0.6rem 1.4rem',
                      borderBottom: `1px solid ${divider}`,
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.66rem',
                      color: mutedText,
                      lineHeight: 1.5,
                    }}
                  >
                    Preview — example content only. Not live local
                    information.
                  </div>
                  {DEMO_UPDATES.map((u, i) => (
                    <div
                      key={u.title}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.8rem',
                        padding: '0.85rem 1.4rem',
                        borderBottom:
                          i < DEMO_UPDATES.length - 1
                            ? `1px solid ${divider}`
                            : undefined,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            color: cardText,
                            marginBottom: '0.14rem',
                          }}
                        >
                          {u.title}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.7rem',
                            color: mutedText,
                          }}
                        >
                          {u.detail}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.62rem',
                          color: mutedText,
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        {u.ago}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="updates-locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LockedPanel />
                </motion.div>
              )}
            </>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
