'use client';

import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

interface FEMAData {
  disasters: Array<{
    id: string;
    title: string;
    type: string;
    location: string;
    startDate: string | null;
    endDate: string | null;
    state: string;
  }>;
  error: string | null;
}

const INCIDENT_TYPE_COLORS: Record<string, string> = {
  Fire: '#ea580c',
  Flood: '#60a5fa',
  Storm: '#eab308',
  Earthquake: '#dc2626',
  Hurricane: '#f472b6',
  Tornado: '#f97316',
  'Severe Ice Storm': '#60a5fa',
  'Tropical Storm': '#f472b6',
};

const INCIDENT_TYPE_DEFAULT_COLOR = '#a855f7';

export const NewsTicker: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, latitude, longitude, isValid } = useLocationContext();
  const hasLocation = !!zip;

  const [disasters, setDisasters] = useState<FEMAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  const getDisasterColor = (type: string) => {
    const color = INCIDENT_TYPE_COLORS[type];
    return color || INCIDENT_TYPE_DEFAULT_COLOR;
  };

  const fetchDisasters = async () => {
    if (
      !hasLocation ||
      !isValid ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      setDisasters(null);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
      });
      const res = await fetch(`/api/fema-disasters?${params.toString()}`);
      const data = await res.json();
      setDisasters(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, [latitude, longitude, isValid, hasLocation]);

  // Ticker items - duplicates for seamless scrolling
  const tickerItems = useMemo(() => {
    if (disasters?.disasters && disasters.disasters.length > 0) {
      // Duplicate items for seamless scrolling
      return [...disasters.disasters, ...disasters.disasters];
    }
    // When empty, show "NOTHING TO SEE HERE!" message duplicated
    return [{ title: 'NOTHING TO SEE HERE!', location: '', type: 'Default' }];
  }, [disasters]);

  // Always play the ticker (unless manually paused)
  const shouldPlay = isPlaying;

  const tickerBg = isDark
    ? 'linear-gradient(90deg, #111314 0%, #0d0f12 100%)'
    : 'linear-gradient(90deg, #f7f8fa 0%, #f4f5f7 100%)';
  // Match NeoPanel's theme-aware border so the ticker blends with every other
  // panel (dark: #404040, light: #111111).
  const tickerBorder = isDark ? '#404040' : '#111111';
  const tickerShadow = isDark
    ? '2px 2px 0px rgba(0,0,0,0.5)'
    : '2px 2px 0px rgba(0,0,0,0.04)';

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        height: 42,
        background: tickerBg,
        border: `2px solid ${tickerBorder}`,
        // Drop the top border so it doesn't double against the NavBar's bottom
        // border above — the NavBar edge serves as the single seam.
        borderTop: 'none',
        boxShadow: tickerShadow,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Left label with play/pause control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0 1rem',
          flexShrink: 0,
          borderRight: `1px solid ${tickerBorder}`,
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: isDark ? '#555' : '#aaa',
            lineHeight: 0,
          }}
        >
          {isPlaying ? (
            <Pause size={12} strokeWidth={2} />
          ) : (
            <Play size={12} strokeWidth={2} />
          )}
        </button>
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            color: isDark ? '#444' : '#bbb',
            whiteSpace: 'nowrap',
          }}
        >
          NEWS! NEARBY
        </span>
      </div>

      {/* Ticker - always scrolls */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          position: 'relative',
        }}
      >
        {hasLocation ? (
          loading ? (
            <motion.div
              key="ticker-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: isDark ? '#555' : '#999',
                paddingLeft: '1rem',
                whiteSpace: 'nowrap',
              }}
            >
              NEWS FEEDING
              <span
                style={{
                  display: 'inline-flex',
                  marginLeft: '0.5rem',
                  gap: '0.3rem',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.15, 1, 0.15] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    }}
                  >
                    .
                  </motion.span>
                ))}
              </span>
            </motion.div>
          ) : error ? (
            <motion.div
              key="ticker-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.72rem',
                color: isDark ? '#333' : '#ccc',
                paddingLeft: '1rem',
                whiteSpace: 'nowrap',
              }}
            >
              Unable to load community alerts. Please try again later.
            </motion.div>
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                minWidth: '100%',
                animation: shouldPlay ? `ticker 40s linear infinite` : 'none',
              }}
            >
              {tickerItems.map((item, i) => {
                const isNothingToSee = item.title === 'NOTHING TO SEE HERE!';
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      paddingLeft: isNothingToSee ? '1rem' : '2rem',
                      paddingRight: isNothingToSee ? '1rem' : '2rem',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: isNothingToSee ? '0.88rem' : '0.72rem',
                      fontWeight: isNothingToSee ? 700 : 400,
                      color: isNothingToSee
                        ? isDark
                          ? '#555'
                          : '#999'
                        : isDark
                          ? '#8a9ab0'
                          : '#555',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.2,
                    }}
                  >
                    {!isNothingToSee && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          backgroundColor: getDisasterColor(item.type),
                          flexShrink: 0,
                          display: 'inline-block',
                        }}
                      />
                    )}
                    {item.title} {item.location && `· ${item.location}`}
                  </span>
                );
              })}
            </div>
          )
        ) : (
          <motion.span
            key="ticker-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.72rem',
              color: isDark ? '#333' : '#ccc',
              paddingLeft: '1rem',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            Enter your location above to see what's happening near you.
          </motion.span>
        )}
      </div>
    </div>
  );
};
