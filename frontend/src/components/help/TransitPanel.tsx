'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

const MapVisualization: FC<{ isDark: boolean }> = ({ isDark }) => {
  const gold = '#f59e0b';
  const routeColor = isDark ? '#f59e0b' : '#d97706';
  const gridStroke = isDark ? '#ffffff06' : '#00000009';
  const labelColor = isDark ? '#c8d8ee' : '#1e3a5f';

  const you = { x: 185, y: 148 };
  const shelter = { x: 62, y: 70 };
  const food = { x: 292, y: 62 };
  const clinic = { x: 335, y: 142 };

  const pathS = `M ${you.x},${you.y} C ${you.x - 55},${you.y - 25} ${shelter.x + 65},${shelter.y + 32} ${shelter.x},${shelter.y}`;
  const pathF = `M ${you.x},${you.y} C ${you.x + 25},${you.y - 45} ${food.x - 30},${food.y + 42} ${food.x},${food.y}`;
  const pathC = `M ${you.x},${you.y} C ${you.x + 45},${you.y + 8} ${clinic.x - 22},${clinic.y - 8} ${clinic.x},${clinic.y}`;

  const pinColors = {
    shelter: '#3b82f6',
    food: isDark ? '#f59e0b' : '#d97706',
    clinic: '#dc2626',
  };

  return (
    <svg
      viewBox="0 0 380 215"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '215px', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="mapGrid"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 30 0 L 0 0 0 30"
            fill="none"
            stroke={gridStroke}
            strokeWidth="1"
          />
        </pattern>
        <radialGradient id="youGlow" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={gold}
            stopOpacity={isDark ? '0.35' : '0.22'}
          />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mapFadeBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="78%" stopColor="transparent" stopOpacity="0" />
          <stop
            offset="100%"
            stopColor={isDark ? '#121212' : '#ffffff'}
            stopOpacity="1"
          />
        </linearGradient>
      </defs>

      <rect width="380" height="215" fill="url(#mapGrid)" />

      <path
        d={pathS}
        stroke={routeColor}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5 3"
        opacity="0.75"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-8"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d={pathF}
        stroke={routeColor}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5 3"
        opacity="0.75"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-8"
          dur="1.2s"
          begin="0.4s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d={pathC}
        stroke={routeColor}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="5 3"
        opacity="0.6"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-8"
          dur="1.2s"
          begin="0.8s"
          repeatCount="indefinite"
        />
      </path>

      <circle
        cx={shelter.x}
        cy={shelter.y}
        r="15"
        fill={isDark ? '#0d1a2e' : '#dbeafe'}
        stroke={pinColors.shelter}
        strokeWidth="1.5"
      />
      <polygon
        points={`${shelter.x},${shelter.y - 7} ${shelter.x - 6},${shelter.y - 1} ${shelter.x + 6},${shelter.y - 1}`}
        fill={pinColors.shelter}
      />
      <rect
        x={shelter.x - 4}
        y={shelter.y - 1}
        width="8"
        height="6"
        rx="0.5"
        fill={pinColors.shelter}
      />
      <text
        x={shelter.x}
        y={shelter.y - 22}
        textAnchor="middle"
        fontSize="7.5"
        fill={labelColor}
        fontFamily="'Poppins', sans-serif"
        fontWeight="700"
      >
        Hope Shelter
      </text>
      <text
        x={shelter.x}
        y={shelter.y - 13}
        textAnchor="middle"
        fontSize="6.5"
        fill={isDark ? '#4a7abf' : '#60a5fa'}
        fontFamily="'Poppins', sans-serif"
      >
        0.4 mi
      </text>

      <circle
        cx={food.x}
        cy={food.y}
        r="15"
        fill={isDark ? '#1c1200' : '#fef3c7'}
        stroke={pinColors.food}
        strokeWidth="1.5"
      />
      <line
        x1={food.x - 3}
        y1={food.y - 6}
        x2={food.x - 3}
        y2={food.y + 6}
        stroke={pinColors.food}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1={food.x + 3}
        y1={food.y - 6}
        x2={food.x + 3}
        y2={food.y + 6}
        stroke={pinColors.food}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1={food.x - 3}
        y1={food.y - 2}
        x2={food.x + 3}
        y2={food.y - 2}
        stroke={pinColors.food}
        strokeWidth="1"
      />
      <text
        x={food.x}
        y={food.y - 22}
        textAnchor="middle"
        fontSize="7.5"
        fill={labelColor}
        fontFamily="'Poppins', sans-serif"
        fontWeight="700"
      >
        Food Hub
      </text>
      <text
        x={food.x}
        y={food.y - 13}
        textAnchor="middle"
        fontSize="6.5"
        fill={isDark ? '#a07830' : '#d97706'}
        fontFamily="'Poppins', sans-serif"
      >
        0.6 mi
      </text>

      <circle
        cx={clinic.x}
        cy={clinic.y}
        r="15"
        fill={isDark ? '#1a0808' : '#fee2e2'}
        stroke={pinColors.clinic}
        strokeWidth="1.5"
      />
      <line
        x1={clinic.x}
        y1={clinic.y - 6}
        x2={clinic.x}
        y2={clinic.y + 6}
        stroke={pinColors.clinic}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={clinic.x - 6}
        y1={clinic.y}
        x2={clinic.x + 6}
        y2={clinic.y}
        stroke={pinColors.clinic}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text
        x={clinic.x + 22}
        y={clinic.y - 6}
        textAnchor="middle"
        fontSize="7.5"
        fill={labelColor}
        fontFamily="'Poppins', sans-serif"
        fontWeight="700"
      >
        Care First Clinic
      </text>
      <text
        x={clinic.x + 22}
        y={clinic.y + 4}
        textAnchor="middle"
        fontSize="6.5"
        fill={isDark ? '#a04040' : '#dc2626'}
        fontFamily="'Poppins', sans-serif"
      >
        0.8 mi
      </text>

      <circle cx={you.x} cy={you.y} r="38" fill="url(#youGlow)" />
      <circle
        cx={you.x}
        cy={you.y}
        r="8"
        fill="none"
        stroke={gold}
        strokeWidth="1.2"
        opacity="0.5"
      >
        <animate
          attributeName="r"
          values="8;24;8"
          dur="2.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2.6s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx={you.x}
        cy={you.y}
        r="8"
        fill="none"
        stroke={gold}
        strokeWidth="0.8"
        opacity="0.28"
      >
        <animate
          attributeName="r"
          values="8;38;8"
          dur="2.6s"
          begin="0.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.28;0;0.28"
          dur="2.6s"
          begin="0.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={you.x} cy={you.y} r="8" fill={gold} />
      <circle
        cx={you.x}
        cy={you.y}
        r="3.5"
        fill={isDark ? '#060d17' : '#eff6ff'}
      />
      <text
        x={you.x}
        y={you.y + 22}
        textAnchor="middle"
        fontSize="7"
        fill={gold}
        fontFamily="'Poppins', sans-serif"
        fontWeight="800"
        opacity="0.9"
        letterSpacing="0.08em"
      >
        YOUR LOCATION
      </text>

      <rect x="0" y="0" width="380" height="215" fill="url(#mapFadeBottom)" />
    </svg>
  );
};

export const TransitPanel: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { zip } = useLocationContext();
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.55rem',
          minHeight: minH,
        }}
      >
        {/* Bus icon removed for neutral style */}
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
          Enter your location to see transit options.
        </p>
      </div>
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
            borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
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
              WHERE? NEARBY!
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
                    <li
                      style={{
                        fontSize: '0.68rem',
                        color: mutedText,
                        lineHeight: 1.4,
                      }}
                    >
                      Demo data only
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
              {zip ? (
                <motion.div
                  key="getthere-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <MapVisualization isDark={isDark} />

                  <div
                    style={{
                      display: 'flex',
                      borderTop: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                      borderBottom: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.7rem 1rem',
                        borderRight: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>🚶</span>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            color: isDark ? '#93c5fd' : '#1d4ed8',
                          }}
                        >
                          Walking
                        </div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: isDark ? '#c8d8ee' : '#111',
                          }}
                        >
                          8 min
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.7rem 1rem',
                        borderRight: `1px solid ${isDark ? '#0f1e32' : '#bfdbfe'}`,
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>🚌</span>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            color: isDark ? '#93c5fd' : '#1d4ed8',
                          }}
                        >
                          Bus Routes
                        </div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: isDark ? '#c8d8ee' : '#111',
                          }}
                        >
                          2, 5, 12
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.7rem 1rem',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>📡</span>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            color: isDark ? '#93c5fd' : '#1d4ed8',
                          }}
                        >
                          Next Bus
                        </div>
                        <div
                          style={{
                            fontFamily: "'Poppins', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            color: isDark ? '#60a5fa' : '#2563eb',
                          }}
                        >
                          6 min
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1rem 1.4rem' }}>
                    <button
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        letterSpacing: '0.1em',
                        color: '#fff',
                        backgroundColor: isDark ? '#1d4ed8' : '#2563eb',
                        border: `1.5px solid ${isDark ? '#1d4ed8' : '#2563eb'}`,
                        cursor: 'pointer',
                        boxShadow: '3px 3px 0px rgba(0,0,0,0.3)',
                      }}
                    >
                      VIEW DIRECTIONS →
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="getthere-locked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LockedPanel minH={215} />
                </motion.div>
              )}
            </>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
