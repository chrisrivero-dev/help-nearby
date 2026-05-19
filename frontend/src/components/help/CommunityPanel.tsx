'use client';

import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

const DEMO_COMMUNITY = [
  {
    title: 'Food Bank Volunteers Needed',
    org: 'Unity Church',
    when: 'Today · 2PM–6PM',
    type: 'volunteer' as const,
  },
  {
    title: 'Blanket & Supply Drive',
    org: 'Red Cross Chapter',
    when: 'Ongoing · This week',
    type: 'donation' as const,
  },
  {
    title: 'Community Aid Fair',
    org: 'City Outreach Network',
    when: 'Sat May 18 · 10AM–2PM',
    type: 'event' as const,
  },
  {
    title: 'Nonprofit Resource Drive',
    org: 'Community Alliance',
    when: 'Sun May 19 · 9AM–1PM',
    type: 'donation' as const,
  },
];

const communityTypeColor = {
  volunteer: '#059669',
  donation: '#d97706',
  event: '#7c3aed',
};

export const CommunityPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip, isDemo } = useLocationContext();
  const hasLocation = !!zip;

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
      <Users size={16} color={mutedText} strokeWidth={1.5} />
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
        Enter your location to see community action items.
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
        <div style={{ height: 2, background: '#059669' }} />

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
                background: '#059669',
                flexShrink: 0,
              }}
            />
            <Users size={14} color="#059669" strokeWidth={2.5} />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              COMMUNITY ACTION
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {hasLocation ? (
            <motion.div
              key="community-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {DEMO_COMMUNITY.map((item, i) => {
                const typeColor = communityTypeColor[item.type];
                return (
                  <div
                    key={item.title}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      padding: '0.82rem 1.4rem',
                      borderBottom:
                        i < DEMO_COMMUNITY.length - 1
                          ? `1px solid ${divider}`
                          : undefined,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '0.18rem',
                        padding: '0.18rem 0.45rem',
                        background: typeColor + '18',
                        border: `1px solid ${typeColor}38`,
                        color: typeColor,
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
                        {item.org} · {item.when}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: '1rem 1.4rem' }}>
                <button
                  style={{
                    width: '100%',
                    padding: '0.62rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    letterSpacing: '0.1em',
                    color: '#fff',
                    backgroundColor: '#059669',
                    border: '1.5px solid #059669',
                    cursor: 'pointer',
                    boxShadow: '3px 3px 0px rgba(0,0,0,0.25)',
                  }}
                >
                  GET INVOLVED →
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="community-locked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LockedPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
