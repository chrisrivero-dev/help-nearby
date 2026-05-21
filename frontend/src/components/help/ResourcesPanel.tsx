'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ExternalLink, Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import type {
  NearbyResource,
  NearbyResponse,
  SourceMeta,
} from '@/lib/resources/schema';

export const ResourcesPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, latitude, longitude, isValid } = useLocationContext();

  const [nearbyResources, setNearbyResources] = useState<
    NearbyResource[] | null
  >(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyDegraded, setNearbyDegraded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [sources, setSources] = useState<SourceMeta[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchNearbyResources = useCallback(async (lat: number, lng: number) => {
    setNearbyLoading(true);
    setNearbyResources(null);
    setNearbyDegraded(false);
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radiusMiles: '10',
      });
      const res = await fetch(`/api/nearby-resources?${params.toString()}`);
      if (!res.ok) {
        setNearbyResources([]);
        return;
      }
      const data = (await res.json()) as NearbyResponse;
      setNearbyResources(data.resources ?? []);
      setNearbyDegraded(Boolean(data.degraded));
      setSources(data.sources ?? []);
    } catch {
      setNearbyResources([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!zip) {
      setNearbyResources(null);
      setNearbyDegraded(false);
      return;
    }
    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      fetchNearbyResources(latitude, longitude);
    } else {
      // ZIP entered but lookup failed — show empty/unavailable, never demo.
      setNearbyResources([]);
      setNearbyDegraded(false);
    }
  }, [zip, isValid, latitude, longitude, fetchNearbyResources]);

  const resourceRenderKey = (r: NearbyResource, index: number) =>
    `${r.sourceName}:${r.id}:${r.latitude ?? ''}:${r.longitude ?? ''}:${index}`;

  const formatDist = (mi: number) =>
    mi < 0.1
      ? '< 0.1 mi'
      : mi < 10
        ? `${mi.toFixed(1)} mi`
        : `${Math.round(mi)} mi`;

  const formatChecked = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const gold = '#f59e0b';

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
      {/* Heart icon removed for neutral style */}
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
        Enter your location to see nearby alerts,
        <br />
        resources, and transit options.
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
            {sources.length > 0 && (
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 0,
                  background: !sources.some((s) => s.ok)
                    ? '#ef4444'
                    : '#22c55e',
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              RESOURCES! NEARBY
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
                aria-label="Show live data sources"
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
                    LIVE DATA SOURCES
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
                    {sources.map((s) => (
                      <li
                        key={s.id}
                        style={{
                          fontSize: '0.68rem',
                          color: mutedText,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.name} {s.ok ? '' : '(failed)'}
                      </li>
                    ))}
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
          {isExpanded && (
            <>
              {/* Not yet activated */}
              {!zip ? (
                <motion.div
                  key="help-locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '1rem' }}
                >
                  <LockedPanel />
                </motion.div>
              ) : nearbyLoading ? (
                <motion.div
                  key="help-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.78rem',
                      color: mutedText,
                    }}
                  >
                    Searching for nearby resources...
                  </span>
                </motion.div>
              ) : nearbyResources !== null && nearbyResources.length === 0 ? (
                <motion.div
                  key="help-unavailable"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '1.2rem 1.4rem' }}
                >
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.78rem',
                      color: mutedText,
                      lineHeight: 1.5,
                    }}
                  >
                    No live data sources cover this area yet. As more public
                    agencies publish open data, results will appear here.
                  </span>
                </motion.div>
              ) : nearbyResources !== null && nearbyResources.length > 0 ? (
                <motion.div
                  key="help-real"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {nearbyDegraded && (
                    <div
                      style={{
                        padding: '0.6rem 1.4rem',
                        borderBottom: `1px solid ${divider}`,
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.66rem',
                        letterSpacing: '0.06em',
                        color: isDark ? '#d97706' : '#92400e',
                        background: isDark ? '#1a120a' : '#fff7ed',
                      }}
                    >
                      LIVE DATA UNAVAILABLE — SHOWING LAST-KNOWN INFORMATION
                    </div>
                  )}
                  {nearbyResources.map((r, i) => (
                    <div
                      key={resourceRenderKey(r, i)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.9rem',
                        padding: '0.9rem 1.4rem',
                        borderBottom:
                          i < nearbyResources.length - 1
                            ? `1px solid ${divider}`
                            : undefined,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: cardText,
                          }}
                        >
                          {r.name}
                        </div>
                        {r.address && (
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.7rem',
                              color: mutedText,
                              marginTop: '0.06rem',
                            }}
                          >
                            {r.address}
                          </div>
                        )}
                        {r.phone && (
                          <div
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.7rem',
                              color: mutedText,
                              marginTop: '0.06rem',
                            }}
                          >
                            {r.phone}
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            marginTop: '0.38rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <a
                            href={r.website ?? r.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.62rem',
                              color: mutedText,
                              textDecoration: 'underline',
                            }}
                          >
                            <ExternalLink size={9} /> Source: {r.sourceName}
                          </a>
                          {r.lastChecked && (
                            <span
                              style={{
                                fontFamily: "'Poppins', sans-serif",
                                fontSize: '0.62rem',
                                color: mutedText,
                              }}
                            >
                              · Last checked {formatChecked(r.lastChecked)}
                            </span>
                          )}
                          <span
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontSize: '0.62rem',
                              color: mutedText,
                              fontStyle: 'italic',
                            }}
                          >
                            · Call before visiting — information may change.
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          flexShrink: 0,
                          paddingTop: '0.1rem',
                        }}
                      >
                        {typeof r.distanceMiles === 'number' && (
                          <span
                            style={{
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              color: mutedText,
                            }}
                          >
                            {formatDist(r.distanceMiles)}
                          </span>
                        )}
                        <ChevronRight size={12} color={mutedText} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="help-locked-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ padding: '1rem' }}
                >
                  <LockedPanel />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
