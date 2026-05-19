'use client';

import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

const TICKER_ITEMS = [
  {
    dot: '#ea580c',
    text: 'Cooling center now open · Central Library, 200 Park Ave',
  },
  {
    dot: '#059669',
    text: 'Free food distribution today · Unity Church · 12PM–3PM',
  },
  {
    dot: '#f97316',
    text: 'Road closure: Main St between 4th & 5th Ave until 5PM',
  },
  {
    dot: '#60a5fa',
    text: 'Shelter capacity update: Hope Shelter at 90% · overflow at Elm St',
  },
  {
    dot: '#059669',
    text: 'Volunteer shift needed · Food Bank · Today 2PM–6PM',
  },
  {
    dot: '#dc2626',
    text: 'Heat advisory in effect · avoid outdoor activity 11AM–4PM',
  },
];

export const DashboardTicker: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip } = useLocationContext();
  const hasLocation = !!zip;

  // Ticker items for seamless scrolling (duplicated)
  const tickerItems = [...TICKER_ITEMS, ...TICKER_ITEMS];

  const tickerBg = isDark
    ? 'linear-gradient(90deg, #111314 0%, #0d0f12 100%)'
    : 'linear-gradient(90deg, #f7f8fa 0%, #f4f5f7 100%)';
  const tickerBorder = isDark ? '#1e2028' : '#e0e2e8';
  const tickerShadow = isDark
    ? '2px 2px 0px rgba(0,0,0,0.5)'
    : '2px 2px 0px rgba(0,0,0,0.04)';
  const mutedText = isDark ? '#444' : '#bbb';

  // Calculate duration: 40 seconds for all items to scroll past (slower)
  const totalDuration = '40s';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 42,
        marginBottom: '1rem',
        background: tickerBg,
        border: `1px solid ${tickerBorder}`,
        boxShadow: tickerShadow,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {/* Left label */}
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
        <Bell size={10} color={isDark ? '#555' : '#aaa'} strokeWidth={2} />
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
          NEAR YOU
        </span>
        <span
          style={{
            fontSize: '0.5rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: isDark ? '#2a2a2a' : '#ddd',
            border: `1px solid ${isDark ? '#252525' : '#e8e8e8'}`,
            padding: '1px 3px',
          }}
        >
          DEMO
        </span>
      </div>

      {/* Ticker / empty state - scrollable area */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          position: 'relative',
        }}
      >
        {hasLocation ? (
          <motion.div
            key="ticker-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              minWidth: '200%',
              animation: `ticker ${totalDuration} linear infinite`,
            }}
          >
            {tickerItems.map((item, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  paddingLeft: '2rem',
                  paddingRight: '2rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.72rem',
                  color: isDark ? '#8a9ab0' : '#555',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: item.dot,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                {item.text}
              </span>
            ))}
          </motion.div>
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
