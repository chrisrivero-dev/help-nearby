'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import type { LocalUpdate } from '@/lib/community/types';

const GOLD_COLOR = '#f59e0b';

function timeAgo(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  const diffMs = Date.now() - t;
  if (diffMs < 0) return undefined;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const UpdatesPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip } = useLocationContext();
  const hasLocation = !!zip;
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [items, setItems] = useState<LocalUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const isLive = items.length > 0;

  // Fetch real, approved, non-expired updates once opened with a location set.
  // No demo fallback — an empty result renders the empty state.
  useEffect(() => {
    if (!isExpanded || !hasLocation || loaded) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/local-updates')
      .then((r) => (r.ok ? r.json() : { updates: [] }))
      .then((d: { updates?: LocalUpdate[] }) => {
        if (cancelled) return;
        setItems(Array.isArray(d.updates) ? d.updates : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, hasLocation, loaded]);

  const EmptyOrLocked = ({ text }: { text: string }) => (
    <div
      style={{
        padding: '1.75rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.55rem',
        minHeight: 100,
      }}
    >
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
        {text}
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
        whileHover={{ x: -4, y: -4 }}
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
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setSourcesOpen(true)}
              onMouseLeave={() => setSourcesOpen(false)}
            >
              <button
                type="button"
                aria-label="About this panel"
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
                    VERIFIED UPDATES
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
                      Only admin-verified, non-expired local updates appear
                      here. Each carries a named source.
                    </li>
                  </ul>
                </div>
              )}
            </div>
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
            <motion.div
              key="updates-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!hasLocation ? (
                <EmptyOrLocked text="Enter your location to see latest updates." />
              ) : loading ? (
                <EmptyOrLocked text="Loading local updates…" />
              ) : items.length === 0 ? (
                <EmptyOrLocked text="No verified local updates are currently listed nearby." />
              ) : (
                <>
                  {items.map((u, i) => {
                    const ago = timeAgo(u.startsAt ?? u.updatedAt ?? u.createdAt);
                    return (
                      <div
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.8rem',
                          padding: '0.85rem 1.4rem',
                          borderBottom:
                            i < items.length - 1
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
                            {u.description}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.62rem',
                              color: mutedText,
                              marginTop: '0.2rem',
                            }}
                          >
                            Source:{' '}
                            {u.sourceUrl ? (
                              <a
                                href={u.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: GOLD_COLOR,
                                  textDecoration: 'none',
                                }}
                              >
                                {u.sourceName}
                              </a>
                            ) : (
                              u.sourceName
                            )}
                          </div>
                        </div>
                        {ago ? (
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.62rem',
                              color: mutedText,
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            {ago}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
