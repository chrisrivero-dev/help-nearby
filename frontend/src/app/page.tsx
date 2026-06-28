'use client';

import type { FC, CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
      const vbX = 0,
        vbY = isMobile ? 30 : 0;
      const vbW = isMobile ? 720 : 1000,
        vbH = isMobile ? 520 : 600;
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

      {/* First screen — cinematic intro (relative wrapper so the page can scroll) */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          minHeight: isMobile ? 'auto' : '100vh',
        }}
      >
        <motion.div
          style={
            isMobile
              ? {
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
                }
              : {
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: zContent,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: 'clamp(640px, 78vw, 1050px)',
                }
          }
        >
          {/* Aid network map — visual depth layer */}
          <div
            style={
              isMobile
                ? {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  }
                : {
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '70vh',
                    zIndex: 0,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  }
            }
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
                            isDark
                              ? 'rgba(251,191,36,0.30)'
                              : 'rgba(0,0,0,0.10)'
                          }
                          strokeWidth={1}
                          style={{
                            transformOrigin: `${card.cx}px ${card.cy}px`,
                          }}
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
                    stroke={
                      isDark ? 'rgba(251,191,36,0.35)' : 'rgba(0,0,0,0.18)'
                    }
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
              style={{
                margin: isMobile ? '20px 0' : '28px 0',
                overflow: 'visible',
              }}
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
                transition={{
                  duration: 2.8,
                  delay: 0.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
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
              Find source-backed help nearby — food, health, shelter, cooling,
              warming, and emergency resources from official public sources,
              with directions, source attribution, and honest status indicators.
            </motion.p>

            {/* Positioning line */}
            <motion.p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: '0.68rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: mutedColor,
                margin: '14px 0 0',
                maxWidth: isMobile ? '80vw' : '480px',
                lineHeight: 1.7,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.58,
              }}
            >
              Source-backed local aid infrastructure for communities, cities,
              and nonprofits.
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
      </section>

      {/* How it works — motion demo */}
      <HowItWorksSection isDark={isDark} isMobile={isMobile} />

      {/* Below the fold — credibility, audiences, and partner CTA */}
      <BelowFold isDark={isDark} isMobile={isMobile} />
    </div>
  );
};

// ── How It Works section ─────────────────────────────────────────────────────

const DEMO_CHIPS_HOME = [
  { id: 'loc', text: '📍 90012', kind: 'location' },
  { id: 'cat', text: 'Shelter', kind: 'filter' },
  { id: 'res', text: 'Nearby resource · 0.5 mi', kind: 'result' },
  { id: 'src', text: '✓ Source-backed', kind: 'source' },
] as const;

const HOME_STEPS = [
  'Enter your location',
  'Filter by need',
  'Open a source-backed result',
  'Ask Chat Nearby a follow-up',
];

const CHIP_STEP_HOME: Record<string, number> = {
  loc: 0, cat: 1, res: 2, src: 2,
};

// 4 chip stages + user bubble stage + assistant bubble stage
const TOTAL_STAGES = 6;

const HowItWorksSection: FC<{ isDark: boolean; isMobile: boolean }> = ({
  isDark,
  isMobile,
}) => {
  const prefersReduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || prefersReduced) return;
    const t = setTimeout(() => setStage(1), 400);
    return () => clearTimeout(t);
  }, [mounted, prefersReduced]);

  useEffect(() => {
    if (!mounted || prefersReduced || stage === 0) return;
    const isLast = stage >= TOTAL_STAGES;
    const t = setTimeout(
      () => setStage((s) => (s >= TOTAL_STAGES ? 0 : s + 1)),
      isLast ? 1800 : 2200,
    );
    return () => clearTimeout(t);
  }, [stage, mounted, prefersReduced]);

  useEffect(() => {
    if (!mounted || prefersReduced || stage !== 0) return;
    const t = setTimeout(() => setStage(1), 400);
    return () => clearTimeout(t);
  }, [stage, mounted, prefersReduced]);

  const borderColor = isDark ? '#404040' : '#111111';
  const bg = isDark ? '#0f0f0f' : '#ffffff';
  const textColor = isDark ? '#f4f4f4' : '#111111';
  const mutedColor = isDark ? '#b8b8b8' : '#666666';
  const dimBorder = isDark ? '#2a2a2a' : '#d0d0d0';
  const amber = '#f59e0b';

  const chipCount = DEMO_CHIPS_HOME.length; // 4
  const visibleCount = prefersReduced ? chipCount : Math.min(stage, chipCount);
  const activeChipIdx =
    prefersReduced ? -1 : stage >= 1 && stage <= chipCount ? stage - 1 : -1;
  const showUserBubble = prefersReduced || stage >= chipCount + 1;
  const showAssistantBubble = prefersReduced || stage >= chipCount + 2;
  const activeStepIdx =
    prefersReduced
      ? -1
      : stage === 0
        ? -1
        : stage <= chipCount
          ? CHIP_STEP_HOME[DEMO_CHIPS_HOME[Math.min(stage - 1, chipCount - 1)].id]
          : 3;

  function chipStyles(chip: (typeof DEMO_CHIPS_HOME)[number], idx: number) {
    const visible = prefersReduced || idx < visibleCount;
    const isActive = !prefersReduced && idx === activeChipIdx;
    let background = 'transparent';
    let border = `2px solid ${dimBorder}`;
    let color = mutedColor;
    if (visible) { color = textColor; border = `2px solid ${isDark ? '#3a3a3a' : '#ccc'}`; }
    if (isActive && visible) {
      if (chip.kind === 'source') {
        background = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)';
        border = '2px solid #22c55e';
        color = isDark ? '#86efac' : '#15803d';
      } else {
        background = amber; border = `2px solid ${amber}`; color = '#111';
      }
    }
    return { background, border, color };
  }

  return (
    <section
      style={{
        width: '100%',
        background: bg,
        borderTop: `2px solid ${borderColor}`,
        borderBottom: `2px solid ${borderColor}`,
        padding: isMobile ? '2.5rem 6vw' : '3.5rem 2rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1050,
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '2rem' : '4rem',
          alignItems: isMobile ? 'flex-start' : 'center',
        }}
      >
        {/* Left: headline + steps */}
        <div
          style={{
            flex: '0 0 auto',
            minWidth: isMobile ? 'auto' : 280,
            maxWidth: isMobile ? '100%' : 340,
          }}
        >
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.66rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: amber,
              margin: '0 0 1rem',
            }}
          >
            How it works
          </p>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              color: textColor,
              margin: '0 0 0.75rem',
              lineHeight: 1.15,
            }}
          >
            Search local help.
            <br />
            See where it came from.
          </p>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.82rem',
              color: mutedColor,
              margin: '0 0 1.5rem',
              lineHeight: 1.7,
              maxWidth: 340,
            }}
          >
            Help Nearby lets people search nearby resources by location, review
            source-backed details, and ask follow-up questions with the local
            context already attached.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {HOME_STEPS.map((label, i) => {
              const isActive = prefersReduced || i === activeStepIdx;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    opacity: prefersReduced ? 1 : isActive ? 1 : 0.35,
                    transition: prefersReduced ? undefined : 'opacity 0.4s ease',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isActive ? amber : 'transparent',
                      border: `2px solid ${isActive ? amber : dimBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: prefersReduced
                        ? undefined
                        : 'background 0.4s ease, border-color 0.4s ease',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        color: isActive ? '#111' : mutedColor,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? textColor : mutedColor,
                      transition: prefersReduced ? undefined : 'color 0.4s ease',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <a
              href="/help"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '0.72rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isDark ? '#111' : '#fff',
                background: isDark ? '#e8e8e8' : '#111111',
                border: `2px solid ${borderColor}`,
                padding: '0.6rem 1.2rem',
                textDecoration: 'none',
              }}
            >
              Start searching →
            </a>
          </div>
        </div>

        {/* Vertical divider — desktop only */}
        {!isMobile && (
          <div
            style={{
              width: 2,
              alignSelf: 'stretch',
              background: borderColor,
              opacity: 0.15,
              flexShrink: 0,
            }}
          />
        )}

        {/* Right: animated chip demo */}
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Panel frame — styled like the /help command center */}
          <div
            style={{
              border: `2px solid ${borderColor}`,
              background: isDark ? '#0d0d0d' : '#ffffff',
            }}
          >
            {/* Panel header bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 1.2rem',
                borderBottom: `1px solid ${dimBorder}`,
                background: isDark ? '#111111' : '#f4f4f4',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.57rem',
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: amber,
                  }}
                >
                  Help Nearby
                </span>
                <span style={{ color: dimBorder, fontSize: '0.7rem', lineHeight: 1 }}>·</span>
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.57rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: mutedColor,
                  }}
                >
                  Resource Search
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22c55e',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.52rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: mutedColor,
                  }}
                >
                  Live
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.55rem',
                alignItems: 'center',
                minHeight: 52,
                padding: isMobile ? '1.2rem' : '1.5rem 1.8rem',
              }}
            >
              {DEMO_CHIPS_HOME.map((chip, idx) => {
                const visible = prefersReduced || idx < visibleCount;
                const s = chipStyles(chip, idx);
                return (
                  <div
                    key={chip.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}
                  >
                    <motion.div
                      animate={{
                        opacity: visible ? 1 : 0,
                        y: visible ? 0 : 6,
                        scale:
                          (!prefersReduced && idx === activeChipIdx && visible)
                            ? 1.04
                            : 1,
                      }}
                      transition={
                        prefersReduced
                          ? { duration: 0 }
                          : { duration: 0.38, ease: 'easeOut' }
                      }
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.01em',
                        padding: '0.35rem 0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: chip.kind === 'result' ? 220 : 160,
                        ...s,
                        transition: prefersReduced
                          ? undefined
                          : 'background 0.38s ease, border-color 0.38s ease, color 0.38s ease',
                      }}
                    >
                      {chip.text}
                    </motion.div>
                    {idx < DEMO_CHIPS_HOME.length - 1 && (
                      <span
                        style={{
                          color: dimBorder,
                          fontSize: '0.8rem',
                          opacity: visible ? 0.7 : 0.2,
                          transition: 'opacity 0.38s ease',
                          userSelect: 'none',
                          flexShrink: 0,
                        }}
                      >
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chat zone — Chat Nearby preview */}
            <div
              style={{
                borderTop: `1px solid ${dimBorder}`,
                padding: isMobile ? '0.8rem 1.2rem' : '0.8rem 1.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                minHeight: isMobile ? 'auto' : 72,
              }}
            >
              {/* Zone label */}
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.52rem',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: amber,
                  display: 'block',
                  marginBottom: '0.15rem',
                }}
              >
                Chat Nearby
              </span>

              {/* User bubble */}
              <motion.div
                animate={{
                  opacity: showUserBubble ? 1 : 0,
                  y: showUserBubble ? 0 : 5,
                }}
                transition={
                  prefersReduced ? { duration: 0 } : { duration: 0.38, ease: 'easeOut' }
                }
                style={{ display: 'flex', justifyContent: 'flex-end' }}
              >
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    fontStyle: 'italic',
                    color: '#111111',
                    background: amber,
                    border: `2px solid ${isDark ? '#b45309' : '#111111'}`,
                    padding: '0.3rem 0.65rem',
                    maxWidth: '82%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  "Any food banks nearby?"
                </div>
              </motion.div>

              {/* Assistant bubble */}
              <motion.div
                animate={{
                  opacity: showAssistantBubble ? 1 : 0,
                  y: showAssistantBubble ? 0 : 5,
                }}
                transition={
                  prefersReduced ? { duration: 0 } : { duration: 0.38, ease: 'easeOut' }
                }
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.5rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: amber,
                    marginTop: '0.35rem',
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  CN
                </span>
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.7rem',
                    lineHeight: 1.55,
                    color: isDark ? '#b8b8b8' : '#444444',
                    background: isDark ? '#1a1a1a' : '#f0f0f0',
                    border: `2px solid ${isDark ? '#404040' : '#111111'}`,
                    padding: '0.3rem 0.65rem',
                    maxWidth: '88%',
                  }}
                >
                  Yes — 3 food resources found near 90012. Closest source-backed listing is 0.7 mi away.
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── Below-the-fold sections ───────────────────────────────────────────────────

const LIVE_NOW = [
  {
    title: 'Live resource search',
    desc: 'Nearby food banks, health centers, cooling and warming centers, and parks from public datasets, searched by ZIP or location.',
  },
  {
    title: 'Source attribution',
    desc: 'Listings link back to the public dataset they came from, where available.',
  },
  {
    title: 'Directions',
    desc: 'One-tap Google Maps directions for every listed resource.',
  },
  {
    title: 'Where Nearby map',
    desc: 'A visual map panel wired to the same live resource results.',
  },
  {
    title: 'Official-source incidents',
    desc: 'A manually reviewed incident registry backed by official links, with NWS active-alert and FEMA/IPAWS checks.',
  },
  {
    title: 'Current coverage',
    desc: 'Strongest current coverage: Southern California and California aid resources, with national health-center and weather/IPAWS coverage.',
  },
];

const BUILT_FOR = [
  {
    title: 'Residents',
    desc: 'Find source-backed help nearby — food, health, shelter, cooling, and warming resources from official public datasets, with directions and source links.',
  },
  {
    title: 'Cities & counties',
    desc: 'A clearer public information layer for local resources, built on datasets agencies already publish.',
  },
  {
    title: 'Nonprofits & community organizations',
    desc: 'A faster way to check and share local resource information, traceable to its original source where available.',
  },
  {
    title: 'Investors & partners',
    desc: 'A working early-stage platform for source-backed local aid discovery, built to scale across cities and datasets.',
  },
];

const CONTACT_MAILTO =
  'mailto:rrslider@gmail.com?subject=Help%20Nearby%20%E2%80%94%20Partner%20Conversation';

const BelowFold: FC<{ isDark: boolean; isMobile: boolean }> = ({
  isDark,
  isMobile,
}) => {
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const mutedColor = isDark ? '#888888' : '#666666';
  const cardBg = isDark ? '#181818' : '#ffffff';
  const cardBorder = isDark ? '#404040' : '#111111';
  const divider = isDark ? '#2a2a2a' : '#d0d0d0';

  const sectionLabelStyle: CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: '0.66rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#f59e0b',
    margin: '0 0 1rem',
    borderLeft: '3px solid #f59e0b',
    paddingLeft: '0.6rem',
  };

  const bodyStyle: CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.85rem',
    color: mutedColor,
    lineHeight: 1.75,
    margin: 0,
  };

  const cardStyle: CSSProperties = {
    background: cardBg,
    border: `2px solid ${cardBorder}`,
    padding: '1.2rem 1.3rem',
  };

  const cardTitleStyle: CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    fontSize: '0.78rem',
    letterSpacing: '0.03em',
    color: textColor,
    margin: '0 0 0.4rem',
  };

  const cardDescStyle: CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.75rem',
    color: mutedColor,
    lineHeight: 1.65,
    margin: 0,
  };

  return (
    <div
      style={{
        position: 'relative',
        zIndex: zContent,
        width: '100%',
        maxWidth: 1050,
        margin: '0 auto',
        padding: isMobile ? '2.5rem 6vw 3.5rem' : '3.5rem 2rem 4.5rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '3rem' : '4rem',
      }}
    >
      {/* What is live now */}
      <section>
        <p style={sectionLabelStyle}>What is live now</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {LIVE_NOW.map((item) => (
            <div key={item.title} style={cardStyle}>
              <p style={cardTitleStyle}>{item.title}</p>
              <p style={cardDescStyle}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data approach */}
      <section>
        <p style={sectionLabelStyle}>Data approach</p>
        <div style={{ maxWidth: 680 }}>
          <p style={{ ...bodyStyle, marginBottom: '0.9rem' }}>
            Help Nearby is being built around source-backed local aid discovery.
            The goal is to make public resource information easier to find,
            easier to understand, and easier to trace back to its original
            source.
          </p>
          <p style={bodyStyle}>
            Current work focuses on connecting public datasets, showing source
            attribution where available, and avoiding confusion between live
            data, preview content, and manually reviewed information.
          </p>
        </div>
        {/* Source strip */}
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.72rem',
            color: mutedColor,
            lineHeight: 1.7,
            margin: '1.4rem 0 0',
            paddingTop: '1rem',
            borderTop: `2px solid ${divider}`,
            maxWidth: 680,
          }}
        >
          Data sources include public datasets and feeds from HRSA, CalOES, NWS,
          FEMA/IPAWS, and local ArcGIS/Open Data portals.
        </p>
      </section>

      {/* Built for */}
      <section>
        <p style={sectionLabelStyle}>Built for</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem',
          }}
        >
          {BUILT_FOR.map((item) => (
            <div key={item.title} style={cardStyle}>
              <p
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: '0 0 0.6rem',
                  paddingBottom: '0.5rem',
                  borderBottom: `1px solid ${divider}`,
                }}
              >
                {item.title}
              </p>
              <p style={cardDescStyle}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Embed widget */}
      <section
        style={{
          ...cardStyle,
          padding: isMobile ? '1.6rem 1.4rem' : '2rem 2.2rem',
        }}
      >
        <p style={sectionLabelStyle}>Embed widget</p>
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: '0.92rem',
            letterSpacing: '0.02em',
            color: textColor,
            margin: '0 0 0.75rem',
          }}
        >
          Embed Help Nearby on your website
        </p>
        <p style={{ ...bodyStyle, maxWidth: 640, marginBottom: '0.8rem' }}>
          Cities, nonprofits, clinics, schools, churches, and community
          organizations can add a source-backed local resource finder to their
          own website with a simple iframe. Visitors search by ZIP, filter by
          category, and get directions and source links for nearby food banks,
          health centers, cooling centers, and warming centers — directly on
          your page. No accounts or API keys required.
        </p>
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.72rem',
            color: mutedColor,
            lineHeight: 1.7,
            margin: '0 0 1.4rem',
            maxWidth: 640,
          }}
        >
          Data comes from public datasets where available. This widget is not an
          official government emergency alert system and does not guarantee
          accuracy of all listings.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '0.8rem',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
          }}
        >
          <a
            href="/demo/city"
            style={{
              ...getPanelDefaultStyle(isDark),
              backgroundColor: isDark ? '#e8e8e8' : '#111111',
              color: isDark ? '#111111' : '#ffffff',
              textDecoration: 'none',
            }}
          >
            VIEW DEMO CITY PAGE →
          </a>
          <a
            href="/embed/builder"
            style={{
              ...getPanelDefaultStyle(isDark),
              textDecoration: 'none',
            }}
          >
            OPEN EMBED BUILDER →
          </a>
          <a
            href="/embed"
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase' as const,
              color: mutedColor,
              textDecoration: 'none',
            }}
          >
            Preview standalone widget ↗
          </a>
        </div>
      </section>

      {/* Partner CTA */}
      <section
        style={{
          ...cardStyle,
          padding: isMobile ? '1.6rem 1.4rem' : '2rem 2.2rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '1.2rem',
        }}
      >
        <p
          style={{
            ...bodyStyle,
            color: textColor,
            fontWeight: 600,
            maxWidth: 560,
          }}
        >
          Interested in reviewing Help Nearby for a city, county, nonprofit, or
          pilot conversation?
        </p>
        <a
          href={CONTACT_MAILTO}
          style={{
            ...getPanelDefaultStyle(isDark),
            backgroundColor: isDark ? '#e8e8e8' : '#111111',
            color: isDark ? '#111111' : '#ffffff',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          CONTACT US →
        </a>
      </section>

      {/* Independent disclaimer */}
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.7rem',
          color: mutedColor,
          lineHeight: 1.7,
          margin: 0,
          paddingTop: '1.2rem',
          borderTop: `2px solid ${divider}`,
          textAlign: 'center',
        }}
      >
        Help Nearby is independently built and uses official public data sources
        with attribution. It is not an official government emergency alert
        system. In an emergency, call 911.
      </p>
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
