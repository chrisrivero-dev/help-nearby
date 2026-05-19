'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ChevronRight, ArrowRight, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import { normalizeLocation } from '@/lib/location/normalizeLocation';
import { haversineDistanceMiles } from '@/lib/location/distance';
import { RESOURCES_90012 } from '@/data/resources.90012';
import type { ProductionResource } from '@/data/resources.types';

interface SeedResource extends ProductionResource {
  distanceMi: number;
}

export const ResourcesPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, isDemo } = useLocationContext();

  const [nearbyResources, setNearbyResources] = useState<SeedResource[] | null>(
    null,
  );
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const fetchNearbyResources = useCallback(async (zipCode: string) => {
    setNearbyLoading(true);
    setNearbyResources(null);

    if (zipCode !== '90012') {
      setNearbyResources([]);
      setNearbyLoading(false);
      return;
    }

    try {
      const loc = await normalizeLocation(zipCode);
      if (!loc.isValid) {
        setNearbyResources([]);
        setNearbyLoading(false);
        return;
      }

      const withDist = RESOURCES_90012.map((r) => ({
        ...r,
        distanceMi: haversineDistanceMiles(
          loc.latitude,
          loc.longitude,
          r.latitude,
          r.longitude,
        ),
      })).sort((a, b) => a.distanceMi - b.distanceMi);

      setNearbyResources(withDist);
    } catch {
      setNearbyResources([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (zip && !isDemo) {
      fetchNearbyResources(zip);
    }
  }, [zip, isDemo, fetchNearbyResources]);

  const formatDist = (mi: number) =>
    mi < 0.1
      ? '< 0.1 mi'
      : mi < 10
        ? `${mi.toFixed(1)} mi`
        : `${Math.round(mi)} mi`;

  const formatVerifiedDate = (iso: string) => {
    const [year, month, day] = iso.split('-');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  const categoryConfig: Record<
    ProductionResource['category'],
    { Icon: typeof Heart; color: string }
  > = {
    health: { Icon: Heart, color: '#dc2626' },
    library: { Icon: Heart, color: '#7c3aed' },
    government: { Icon: Heart, color: '#059669' },
    social_services: { Icon: Heart, color: '#d97706' },
  };

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';

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
      <Heart size={16} color={mutedText} strokeWidth={1.5} />
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
        <div style={{ height: 2, background: '#d97706' }} />

        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: `1px solid ${divider}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 2,
                height: 16,
                background: '#d97706',
                flexShrink: 0,
              }}
            />
            <Heart size={14} color="#d97706" strokeWidth={2.5} />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              NEARBY HELP
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
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
                Nearby Help is not available in this ZIP yet.
              </span>
            </motion.div>
          ) : nearbyResources !== null && nearbyResources.length > 0 ? (
            <motion.div
              key="help-real"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {nearbyResources.map((r) => {
                const { Icon: CatIcon, color } = categoryConfig[r.category];
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.9rem',
                      padding: '0.9rem 1.4rem',
                      borderBottom: `1px solid ${divider}`,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDark ? color + '14' : color + '0f',
                        border: `1px solid ${color}35`,
                      }}
                    >
                      <CatIcon size={14} color={color} strokeWidth={2} />
                    </div>
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
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.7rem',
                          color: mutedText,
                          marginTop: '0.06rem',
                        }}
                      >
                        {r.type} · {r.address}, {r.city}, {r.state} {r.zip}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.7rem',
                          color: mutedText,
                          marginTop: '0.06rem',
                        }}
                      >
                        {r.hours}
                        {r.phone ? ` · ${r.phone}` : ''}
                      </div>
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
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: isDark ? '#4a7abf' : '#2563eb',
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={9} /> Source
                        </a>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: isDark ? '#363636' : '#bbb',
                          }}
                        >
                          ·
                        </span>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: isDark ? '#363636' : '#bbb',
                          }}
                        >
                          Source-verified {formatVerifiedDate(r.verifiedAt)}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: isDark ? '#363636' : '#bbb',
                          }}
                        >
                          ·
                        </span>
                        <span
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.62rem',
                            color: isDark ? '#2e2e2e' : '#c0c0c0',
                            fontStyle: 'italic',
                          }}
                        >
                          Call before visiting — information may change.
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
                      <span
                        style={{
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          color: mutedText,
                        }}
                      >
                        {formatDist(r.distanceMi)}
                      </span>
                      <ChevronRight size={12} color={mutedText} />
                    </div>
                  </div>
                );
              })}
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
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
