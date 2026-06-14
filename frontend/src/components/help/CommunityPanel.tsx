'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import type { CommunityOpportunity } from '@/lib/community/types';

const GOLD_COLOR = '#f59e0b';

function formatWhen(o: CommunityOpportunity): string | undefined {
  if (!o.startAt) return undefined;
  const start = new Date(o.startAt);
  if (Number.isNaN(start.getTime())) return undefined;
  return start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const CommunityPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip } = useLocationContext();
  const hasLocation = !!zip;
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [items, setItems] = useState<CommunityOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const isLive = items.length > 0;

  // Fetch real, approved, non-expired opportunities once the panel is opened
  // with a location set. There is no demo fallback — an empty result renders
  // the empty state below.
  useEffect(() => {
    if (!isExpanded || !hasLocation || loaded) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/community-opportunities')
      .then((r) => (r.ok ? r.json() : { opportunities: [] }))
      .then((d: { opportunities?: CommunityOpportunity[] }) => {
        if (cancelled) return;
        setItems(Array.isArray(d.opportunities) ? d.opportunities : []);
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
              COMMUNITY! NEARBY
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
                    VERIFIED OPPORTUNITIES
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
                      Only admin-verified, non-expired community opportunities
                      appear here. Nothing is shown until a record is approved.
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
              key="community-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!hasLocation ? (
                <EmptyOrLocked text="Enter your location to see community action items." />
              ) : loading ? (
                <EmptyOrLocked text="Loading community opportunities…" />
              ) : items.length === 0 ? (
                <EmptyOrLocked text="No verified community opportunities are currently listed nearby." />
              ) : (
                <>
                  {items.map((item, i) => {
                    const when = formatWhen(item);
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem',
                          padding: '0.82rem 1.4rem',
                          borderBottom:
                            i < items.length - 1
                              ? `1px solid ${divider}`
                              : undefined,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '0.18rem',
                            padding: '0.18rem 0.45rem',
                            background: isDark ? '#1a1a1a' : '#f5f5f5',
                            border: `1px solid ${divider}`,
                            color: mutedText,
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.57rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase' as const,
                            flexShrink: 0,
                            whiteSpace: 'nowrap' as const,
                          }}
                        >
                          {item.type}
                        </span>
                        <div>
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: cardText,
                              marginBottom: '0.12rem',
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.7rem',
                              color: mutedText,
                            }}
                          >
                            {item.organizationName}
                            {when ? ` · ${when}` : ''}
                          </div>
                          {item.sourceUrl ? (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '0.66rem',
                                color: GOLD_COLOR,
                                textDecoration: 'none',
                              }}
                            >
                              View source →
                            </a>
                          ) : null}
                        </div>
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
