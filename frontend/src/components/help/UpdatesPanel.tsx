'use client';

import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
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

const updateTypeColor = {
  info: '#3b82f6',
  warning: '#ea580c',
  critical: '#dc2626',
};

export const UpdatesPanel: FC = () => {
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
      <Bell size={16} color={mutedText} strokeWidth={1.5} />
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
        <div style={{ height: 2, background: '#ea580c' }} />

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
                background: '#ea580c',
                flexShrink: 0,
              }}
            />
            <Bell size={14} color="#ea580c" strokeWidth={2.5} />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              LATEST UPDATES
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {hasLocation ? (
            <motion.div
              key="updates-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {DEMO_UPDATES.map((u, i) => {
                const col = updateTypeColor[u.type];
                return (
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
                    <div
                      style={{
                        position: 'relative',
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: col,
                        }}
                      />
                      {u.type === 'critical' && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: -2,
                            borderRadius: '50%',
                            border: `1px solid ${col}`,
                            opacity: 0.4,
                            animation: 'pulse 2s ease-out infinite',
                          }}
                        />
                      )}
                    </div>
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
                        color: isDark ? '#303030' : '#c0c0c0',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {u.ago}
                    </div>
                  </div>
                );
              })}
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
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
