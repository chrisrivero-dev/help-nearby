'use client';

import type { FC, CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';

// Z-index layer scale for consistent stacking
const zBase = 0;
const zContent = 10;
const zSticky = 100;
const zOverlay = 200;
const zToast = 300;

// Panel border colors matching NavBar.tsx
const panelBorderDark = '#252525';
const panelBorderLight = '#e4e4e4';

// Panel style helper function - needs isDark to be passed
const getPanelDefaultStyle = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? '#121212' : '#ffffff',
  border: `1px solid ${isDark ? panelBorderDark : panelBorderLight}`,
  color: isDark ? '#dedede' : '#111111',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem 1rem',
  fontSize: '0.65rem',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  transition: 'background 0.2s ease',
});

// Root wrapper
const rootStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
  width: '100%',
  margin: '0',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  overflow: 'hidden',
};

// Clock
const clockStyle: CSSProperties = {
  position: 'fixed' as const,
  bottom: '50px',
  right: '50px',
  zIndex: zToast,
};

// Title cycling configuration
const TITLES = ['HELP!'];
const TITLE_DISPLAY_TIME = 5000; // 5 seconds (static - no cycling)

const CARD_W = 72;
const CARD_H = 52;

const AID_CARDS = [
  {
    id: 'food',
    label: 'FOOD SUPPORT',
    x: 518,
    y: 52,
    cx: 554,
    cy: 78,
    pathD: 'M 220 260 L 554 78',
    gradId: 'hn-grad-food',
    marks: ['M 18 38 Q 36 48 54 38', 'M 16 34 L 56 34', 'M 36 18 L 36 34'],
  },
  {
    id: 'shelter',
    label: 'SHELTER',
    x: 566,
    y: 102,
    cx: 602,
    cy: 128,
    pathD: 'M 220 260 L 602 128',
    gradId: 'hn-grad-shelter',
    marks: ['M 10 32 L 36 14 L 62 32', 'M 27 32 L 27 46 L 45 46 L 45 32'],
  },
  {
    id: 'financial',
    label: 'FINANCIAL AID',
    x: 572,
    y: 252,
    cx: 608,
    cy: 278,
    pathD: 'M 220 260 L 608 278',
    gradId: 'hn-grad-financial',
    marks: [
      'M 22 14 L 50 14 L 50 40 L 22 40 Z',
      'M 27 22 L 45 22',
      'M 27 28 L 39 28',
    ],
  },
  {
    id: 'transit',
    label: 'TRANSIT',
    x: 552,
    y: 432,
    cx: 588,
    cy: 458,
    pathD: 'M 220 260 L 588 458',
    gradId: 'hn-grad-transit',
    marks: [
      'M 12 26 L 52 26',
      'M 40 18 L 52 26 L 40 34',
      'M 24 33 L 24 38 L 50 38',
    ],
  },
];

// Landing page with cycling titles above "NEARBY."
const Landing: FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const bgColor = isDark ? '#0f0f0f' : '#fafafa';
  const mutedColor = isDark ? '#888888' : '#666666';
  const shadowColor = isDark ? '#444444' : '#888888';
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isCycling, setIsCycling] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeNode, setActiveNode] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [mobileOrigin, setMobileOrigin] = useState({ x: 220, y: 260 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const radarRef = useRef<SVGSVGElement>(null);
  const bgSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Start label cycling after the header fades in
  useEffect(() => {
    // Delay starting the cycling to match the header's animation duration
    const timeout = setTimeout(() => {
      setIsCycling(true);
      // Start the title cycling interval after the header fade-in completes
      intervalRef.current = setInterval(() => {
        setCurrentTitleIndex((prev) => (prev + 1) % TITLES.length);
      }, TITLE_DISPLAY_TIME);
    }, 2500);
    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Close title modal after timeout
  useEffect(() => {
    if (isTitleModalOpen) {
      const timer = setTimeout(() => {
        setIsTitleModalOpen(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isTitleModalOpen]);

  useEffect(() => {
    const id = setInterval(
      () => setActiveNode((n) => (n + 1) % AID_CARDS.length),
      2800,
    );
    return () => clearInterval(id);
  }, []);

  // Measure inline radar position and convert it into the background SVG's
  // coordinate space so all connector lines originate from the radar dot.
  useEffect(() => {
    const measure = () => {
      if (!radarRef.current || !bgSvgRef.current) return;
      const r = radarRef.current.getBoundingClientRect();
      const svgRect = bgSvgRef.current.getBoundingClientRect();
      const screenX = r.left + r.width / 2;
      const screenY = r.top + r.height / 2;
      const vbX = 0, vbY = isMobile ? 30 : 0;
      const vbW = isMobile ? 720 : 1000, vbH = isMobile ? 520 : 600;
      const scale = Math.min(svgRect.width / vbW, svgRect.height / vbH);
      const offsetX = svgRect.left + (svgRect.width - vbW * scale) / 2;
      const offsetY = svgRect.top + (svgRect.height - vbH * scale) / 2;
      setMobileOrigin({
        x: (screenX - offsetX) / scale + vbX,
        y: (screenY - offsetY) / scale + vbY,
      });
    };
    document.fonts.ready.then(() => requestAnimationFrame(measure));
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobile]);

  const getCardPathD = (card: (typeof AID_CARDS)[0]) =>
    `M ${mobileOrigin.x} ${mobileOrigin.y} L ${card.cx} ${card.cy}`;

  return (
    <div style={rootStyle}>
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Center canvas — cinematic intro */}
      <motion.div
        style={isMobile ? {
          position: 'relative',
          width: '100%',
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: zContent,
          padding: '0 6vw',
          boxSizing: 'border-box',
        } : {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: zContent,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: 'clamp(640px, 78vw, 1050px)',
        }}
      >
        {/* Aid network map — visual depth layer */}
        <div
          style={isMobile ? {
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          } : {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '70vh',
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? isMobile
                  ? 'radial-gradient(ellipse 90vw 60vw at 50% 45%, rgba(251, 191, 36, 0.07) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse 560px 360px at 62% 50%, rgba(251, 191, 36, 0.055) 0%, transparent 70%)'
                : isMobile
                  ? 'radial-gradient(ellipse 90vw 60vw at 50% 45%, rgba(0, 0, 0, 0.022) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse 560px 360px at 62% 50%, rgba(0, 0, 0, 0.018) 0%, transparent 70%)',
            }}
          />

          {/* City-grid + cycling aid preview cards */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <svg
              ref={bgSvgRef}
              style={{ position: 'relative', width: '100%', height: '100%' }}
              viewBox={isMobile ? '0 30 720 520' : '0 0 1000 600'}
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="hn-grad-food" x1="0" y1="0" x2="1" y2="1">
                  <stop
                    offset="0%"
                    stopColor={
                      isDark ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.07)'
                    }
                  />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
                <linearGradient
                  id="hn-grad-shelter"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      isDark ? 'rgba(99,179,237,0.22)' : 'rgba(0,0,0,0.07)'
                    }
                  />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
                <linearGradient
                  id="hn-grad-financial"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      isDark ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.07)'
                    }
                  />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
                <linearGradient
                  id="hn-grad-transit"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      isDark ? 'rgba(167,139,250,0.22)' : 'rgba(0,0,0,0.07)'
                    }
                  />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>

              {/* Grid — horizontal streets */}
              {[86, 172, 258, 344, 430].map((y) => (
                <line
                  key={`h-${y}`}
                  x1={0}
                  y1={y}
                  x2={700}
                  y2={y}
                  stroke={
                    isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.032)'
                  }
                  strokeWidth={1}
                />
              ))}

              {/* Grid — vertical avenues */}
              {[116, 232, 348, 464, 580].map((x) => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={520}
                  stroke={
                    isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.032)'
                  }
                  strokeWidth={1}
                />
              ))}

              {/* Passive nodes */}
              {(
                [
                  [116, 86],
                  [348, 86],
                  [580, 86],
                  [116, 172],
                  [232, 172],
                  [464, 172],
                  [116, 258],
                  [348, 258],
                  [116, 344],
                  [232, 344],
                  [464, 344],
                  [580, 344],
                  [116, 430],
                  [348, 430],
                  [580, 430],
                ] as [number, number][]
              ).map(([cx, cy]) => (
                <circle
                  key={`node-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={cx > 280 ? 3.5 : 2.5}
                  stroke={
                    cx > 280
                      ? isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(0,0,0,0.11)'
                      : isDark
                        ? 'rgba(255,255,255,0.07)'
                        : 'rgba(0,0,0,0.05)'
                  }
                  strokeWidth={1}
                  fill="none"
                />
              ))}

              {/* Background network lines */}
              {AID_CARDS.map((card, i) => (
                <motion.path
                  key={`bgpath-${card.id}`}
                  d={getCardPathD(card)}
                  stroke={
                    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                  }
                  strokeWidth={1}
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: 1.4,
                    delay: 0.9 + i * 0.18,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Aid preview cards */}
              {AID_CARDS.map((card, i) => {
                const isActive = i === activeNode;
                return (
                  <motion.g
                    key={card.id}
                    initial={{ opacity: 0.16 }}
                    animate={{ opacity: isActive ? 1 : 0.16 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={() => router.push('/help')}
                  >
                    {/* Card background */}
                    <rect
                      x={card.x}
                      y={card.y}
                      width={CARD_W}
                      height={CARD_H}
                      rx={4}
                      fill={isActive ? `url(#${card.gradId})` : 'none'}
                      stroke={
                        isActive
                          ? isDark
                            ? 'rgba(255,255,255,0.38)'
                            : 'rgba(0,0,0,0.28)'
                          : isDark
                            ? 'rgba(255,255,255,0.14)'
                            : 'rgba(0,0,0,0.10)'
                      }
                      strokeWidth={isActive ? 1.5 : 1}
                    />

                    {/* Icon marks — only when active */}
                    {isActive && (
                      <g transform={`translate(${card.x}, ${card.y})`}>
                        {card.marks.map((d, mi) => (
                          <motion.path
                            key={`mark-${card.id}-${mi}`}
                            d={d}
                            stroke={
                              isDark
                                ? 'rgba(255,255,255,0.55)'
                                : 'rgba(0,0,0,0.45)'
                            }
                            strokeWidth={1.5}
                            fill="none"
                            strokeLinecap="round"
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 1, pathLength: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: mi * 0.1,
                              ease: 'easeOut',
                            }}
                          />
                        ))}
                      </g>
                    )}

                    {/* Pulse ring — only when active */}
                    {isActive && (
                      <motion.rect
                        x={card.x - 5}
                        y={card.y - 5}
                        width={CARD_W + 10}
                        height={CARD_H + 10}
                        rx={7}
                        fill="none"
                        stroke={
                          isDark ? 'rgba(251,191,36,0.30)' : 'rgba(0,0,0,0.10)'
                        }
                        strokeWidth={1}
                        style={{ transformOrigin: `${card.cx}px ${card.cy}px` }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                          opacity: [0, 0.75, 0],
                          scale: [0.9, 1.12, 1.28],
                        }}
                        transition={{
                          duration: 2.2,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                    )}
                  </motion.g>
                );
              })}

              {/* Active connection path */}
              <AnimatePresence mode="sync">
                <motion.path
                  key={`conn-${activeNode}`}
                  d={getCardPathD(AID_CARDS[activeNode])}
                  stroke={isDark ? 'rgba(251,191,36,0.35)' : 'rgba(0,0,0,0.18)'}
                  strokeWidth={1.5}
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                />
              </AnimatePresence>

              {/* Active card label */}
              <AnimatePresence mode="sync">
                <motion.text
                  key={`label-${activeNode}`}
                  x={AID_CARDS[activeNode].cx}
                  y={AID_CARDS[activeNode].y - 8}
                  textAnchor="middle"
                  fontFamily="'Poppins', sans-serif"
                  fontWeight={700}
                  fontSize={8}
                  fill={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'}
                  letterSpacing={1.5}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {AID_CARDS[activeNode].label}
                </motion.text>
              </AnimatePresence>

            </svg>
          </div>
        </div>

        {/* Content layer — sits above visual depth layer */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.2,
            }}
          >
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: isMobile
                  ? 'clamp(2.5rem, 16vw, 5rem)'
                  : 'clamp(2rem, 7vw, 5rem)',
                textTransform: 'uppercase',
                color: textColor,
                lineHeight: 0.95,
                whiteSpace: 'nowrap',
              }}
            >
              HELP!
            </div>
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: isMobile
                  ? 'clamp(2.5rem, 16vw, 5rem)'
                  : 'clamp(2rem, 7vw, 5rem)',
                textTransform: 'uppercase',
                color: textColor,
                lineHeight: 0.95,
                whiteSpace: 'nowrap',
              }}
            >
              NEARBY.
            </div>
          </motion.div>

          {/* Radar node — between headline and subtitle on all viewports */}
          <motion.svg
            ref={radarRef}
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ margin: isMobile ? '20px 0' : '28px 0', overflow: 'visible' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <motion.circle
              cx={24}
              cy={24}
              r={6}
              stroke={isDark ? 'rgba(251,191,36,0.5)' : 'rgba(0,0,0,0.2)'}
              strokeWidth={1}
              fill="none"
              style={{ transformOrigin: '24px 24px' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2.6, 3.8] }}
              transition={{ duration: 2.8, delay: 0.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <circle
              cx={24}
              cy={24}
              r={5.5}
              fill={isDark ? 'rgba(251,191,36,0.55)' : 'rgba(0,0,0,0.45)'}
              stroke={isDark ? 'rgba(251,191,36,0.9)' : 'rgba(0,0,0,0.65)'}
              strokeWidth={1.5}
            />
          </motion.svg>

          {/* Subtitle */}
          <motion.p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: isMobile
                ? 'clamp(0.8rem, 3.2vw, 1rem)'
                : 'clamp(0.9rem, 1.4vw, 1.05rem)',
              color: mutedColor,
              margin: 0,
              maxWidth: isMobile ? '80vw' : '480px',
              lineHeight: 1.65,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.5,
            }}
          >
            Discover ways to get help and get involved in the community.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            style={{
              display: 'flex',
              gap: isMobile ? '12px' : '16px',
              marginTop: isMobile ? '28px' : '40px',
              flexWrap: 'wrap' as const,
              justifyContent: 'flex-start',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.65,
            }}
          >
            {/* Primary: Find Help */}
            <PanelButton onClick={() => router.push('/help')} isDark={isDark}>
              EXPLORE NEARBY →
            </PanelButton>
          </motion.div>

          {/* Login — utility footnote, not a primary CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
          >
            <PanelButton
              onClick={() => {
                setIsLoginModalOpen(true);
              }}
              isDark={isDark}
              variant="text"
            >
              Login
            </PanelButton>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

// Panel button component matching NavBar.tsx style
const PanelButton: FC<{
  onClick: () => void;
  children: React.ReactNode;
  isDark: boolean;
  variant?: 'primary' | 'secondary' | 'text';
}> = ({ onClick, children, isDark, variant = 'primary' }) => {
  return (
    <motion.div
      style={{
        position: 'relative',
        breakInside: 'avoid',
        height: 'fit-content',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Back panel - static, same size as front panel, zIndex 1 */}
      <div
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
      {/* Front panel - lifted off back panel, zIndex 2 */}
      <motion.button
        onClick={onClick}
        style={{
          ...(variant === 'text'
            ? {
                ...getPanelDefaultStyle(isDark),
                background: 'none',
                border: 'none',
                padding: '0 0.5rem',
                color: isDark ? '#dedede' : '#111111',
              }
            : variant === 'secondary'
              ? {
                  ...getPanelDefaultStyle(isDark),
                  backgroundColor: 'rgba(0,0,0,0)',
                  color: isDark ? '#dedede' : '#111111',
                }
              : {
                  ...getPanelDefaultStyle(isDark),
                  backgroundColor: isDark ? '#e8e8e8' : '#111111',
                  color: isDark ? '#111111' : '#ffffff',
                }),
          position: 'relative',
          zIndex: 2,
          cursor: 'pointer',
        }}
        whileHover={{
          x: -4,
          y: -4,
          backgroundColor: '#fbbf24',
          color: isDark ? '#121212' : '#ffffff',
        }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.button>
    </motion.div>
  );
};

export default Landing;
