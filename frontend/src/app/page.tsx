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

// Root wrapper
const rootStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
  width: '100%',
  maxWidth: '1600px',
  margin: '0 auto',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
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
const TITLES = ['RESOURCES!', 'HELP!'];
const TITLE_DISPLAY_TIME = 2000; // 2 seconds

const CARD_W = 72;
const CARD_H = 52;

const AID_CARDS = [
  {
    id: 'food',
    label: 'FOOD SUPPORT',
    x: 518, y: 52,
    cx: 554, cy: 78,
    pathD: 'M 440 315 L 554 78',
    gradId: 'hn-grad-food',
    marks: ['M 18 38 Q 36 48 54 38', 'M 16 34 L 56 34', 'M 36 18 L 36 34'],
  },
  {
    id: 'shelter',
    label: 'SHELTER',
    x: 566, y: 102,
    cx: 602, cy: 128,
    pathD: 'M 440 315 L 602 128',
    gradId: 'hn-grad-shelter',
    marks: ['M 10 32 L 36 14 L 62 32', 'M 27 32 L 27 46 L 45 46 L 45 32'],
  },
  {
    id: 'financial',
    label: 'FINANCIAL AID',
    x: 572, y: 252,
    cx: 608, cy: 278,
    pathD: 'M 440 315 L 608 278',
    gradId: 'hn-grad-financial',
    marks: ['M 22 14 L 50 14 L 50 40 L 22 40 Z', 'M 27 22 L 45 22', 'M 27 28 L 39 28'],
  },
  {
    id: 'transit',
    label: 'TRANSIT',
    x: 552, y: 432,
    cx: 588, cy: 458,
    pathD: 'M 440 315 L 588 458',
    gradId: 'hn-grad-transit',
    marks: ['M 12 26 L 52 26', 'M 40 18 L 52 26 L 40 34', 'M 24 33 L 24 38 L 50 38'],
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    const id = setInterval(
      () => setActiveNode((n) => (n + 1) % AID_CARDS.length),
      2800,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div style={rootStyle}>
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Center canvas — cinematic intro */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: zContent,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        {/* Aid network map — visual depth layer */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: isMobile ? '100vw' : '700px',
            height: isMobile ? '100vh' : '520px',
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
                ? 'radial-gradient(ellipse 560px 360px at 62% 50%, rgba(251, 191, 36, 0.055) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 560px 360px at 62% 50%, rgba(0, 0, 0, 0.018) 0%, transparent 70%)',
            }}
          />

          {/* City-grid + cycling aid preview cards */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            viewBox="0 0 700 520"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hn-grad-food" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDark ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.07)'} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <linearGradient id="hn-grad-shelter" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDark ? 'rgba(99,179,237,0.22)' : 'rgba(0,0,0,0.07)'} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <linearGradient id="hn-grad-financial" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDark ? 'rgba(251,191,36,0.22)' : 'rgba(0,0,0,0.07)'} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
              <linearGradient id="hn-grad-transit" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDark ? 'rgba(167,139,250,0.22)' : 'rgba(0,0,0,0.07)'} />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>

            {/* Grid — horizontal streets */}
            {[86, 172, 258, 344, 430].map((y) => (
              <line
                key={`h-${y}`}
                x1={0} y1={y} x2={700} y2={y}
                stroke={isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.032)'}
                strokeWidth={1}
              />
            ))}

            {/* Grid — vertical avenues */}
            {[116, 232, 348, 464, 580].map((x) => (
              <line
                key={`v-${x}`}
                x1={x} y1={0} x2={x} y2={520}
                stroke={isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.032)'}
                strokeWidth={1}
              />
            ))}

            {/* Passive nodes */}
            {([
              [116, 86], [348, 86], [580, 86],
              [116, 172], [232, 172], [464, 172],
              [116, 258], [348, 258],
              [116, 344], [232, 344], [464, 344], [580, 344],
              [116, 430], [348, 430], [580, 430],
            ] as [number, number][]).map(([cx, cy]) => (
              <circle
                key={`node-${cx}-${cy}`}
                cx={cx} cy={cy}
                r={cx > 280 ? 3.5 : 2.5}
                stroke={
                  cx > 280
                    ? isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.11)'
                    : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
                }
                strokeWidth={1}
                fill="none"
              />
            ))}

            {/* Background network lines — desktop only */}
            {!isMobile && AID_CARDS.map((card, i) => (
              <motion.path
                key={`bgpath-${card.id}`}
                d={card.pathD}
                stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}
                strokeWidth={1}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.9 + i * 0.18, ease: 'easeOut' }}
              />
            ))}

            {/* Aid preview cards — desktop only */}
            {!isMobile && AID_CARDS.map((card, i) => {
              const isActive = i === activeNode;
              return (
                <motion.g
                  key={card.id}
                  animate={{ opacity: isActive ? 1 : 0.16 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onClick={() => router.push('/help')}
                >
                  {/* Card background */}
                  <rect
                    x={card.x} y={card.y}
                    width={CARD_W} height={CARD_H}
                    rx={4}
                    fill={isActive ? `url(#${card.gradId})` : 'none'}
                    stroke={
                      isActive
                        ? isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.28)'
                        : isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)'
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
                          stroke={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'}
                          strokeWidth={1.5}
                          fill="none"
                          strokeLinecap="round"
                          initial={{ opacity: 0, pathLength: 0 }}
                          animate={{ opacity: 1, pathLength: 1 }}
                          transition={{ duration: 0.4, delay: mi * 0.1, ease: 'easeOut' }}
                        />
                      ))}
                    </g>
                  )}

                  {/* Pulse ring — only when active */}
                  {isActive && (
                    <motion.rect
                      x={card.x - 5} y={card.y - 5}
                      width={CARD_W + 10} height={CARD_H + 10}
                      rx={7}
                      fill="none"
                      stroke={isDark ? 'rgba(251,191,36,0.30)' : 'rgba(0,0,0,0.10)'}
                      strokeWidth={1}
                      style={{ transformOrigin: `${card.cx}px ${card.cy}px` }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: [0, 0.75, 0], scale: [0.9, 1.12, 1.28] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </motion.g>
              );
            })}

            {/* Active connection path — desktop only */}
            {!isMobile && (
              <AnimatePresence mode="sync">
                <motion.path
                  key={`conn-${activeNode}`}
                  d={AID_CARDS[activeNode].pathD}
                  stroke={isDark ? 'rgba(251,191,36,0.35)' : 'rgba(0,0,0,0.18)'}
                  strokeWidth={1.5}
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                />
              </AnimatePresence>
            )}

            {/* Active card label — desktop only */}
            {!isMobile && (
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
            )}

            {/* Home node — user location */}
            <circle
              cx={440} cy={315}
              r={5.5}
              fill={isDark ? 'rgba(251,191,36,0.55)' : 'rgba(0,0,0,0.45)'}
              stroke={isDark ? 'rgba(251,191,36,0.9)' : 'rgba(0,0,0,0.65)'}
              strokeWidth={1.5}
            />
            <motion.circle
              cx={440} cy={315}
              r={5.5}
              stroke={isDark ? 'rgba(251,191,36,0.5)' : 'rgba(0,0,0,0.2)'}
              strokeWidth={1}
              fill="none"
              style={{ transformOrigin: '440px 315px' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2.6, 3.8] }}
              transition={{ duration: 2.8, delay: 0.2, repeat: Infinity, ease: 'easeOut' }}
            />
          </svg>
        </div>

        {/* Content layer — sits above visual depth layer */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            maxWidth: '100vw',
            padding: isMobile ? '0 20px' : '0',
            boxSizing: 'border-box',
          }}
        >
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          >
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(2rem, 7vw, 5rem)',
                textTransform: 'uppercase',
                color: textColor,
                lineHeight: 1.1,
                whiteSpace: isMobile ? 'normal' : 'nowrap',
              }}
            >
              HELP NEARBY.
            </div>
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(2rem, 7vw, 5rem)',
                textTransform: 'uppercase',
                color: textColor,
                lineHeight: 1.1,
                whiteSpace: isMobile ? 'normal' : 'nowrap',
              }}
            >
              WHEN IT MATTERS.
            </div>
          </motion.div>

          {/* Accent divider */}
          <motion.div
            style={{
              width: '48px',
              height: '1px',
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.12)',
              margin: '28px 0',
              transformOrigin: 'left center',
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.45 }}
          />

          {/* Subtitle */}
          <motion.p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
              color: mutedColor,
              margin: 0,
              maxWidth: '480px',
              lineHeight: 1.65,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
          >
            Enter your location.
            <br />
            See nearby help.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '40px',
              flexWrap: 'wrap' as const,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.65 }}
          >
            {/* Primary: Find Help */}
            <motion.button
              onClick={() => router.push('/help')}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                padding: '14px 28px',
                border: `4px solid ${textColor}`,
                backgroundColor: textColor,
                color: bgColor,
                cursor: 'pointer',
                boxShadow: `4px 4px 0 ${shadowColor}`,
              }}
              whileHover={{
                boxShadow: isDark
                  ? `2px 2px 0 ${shadowColor}, 0 0 18px rgba(251, 191, 36, 0.28)`
                  : `2px 2px 0 ${shadowColor}`,
                x: 2,
                y: 2,
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              FIND HELP →
            </motion.button>

            {/* Secondary: Explore Resources */}
            <motion.button
              onClick={() => router.push('/resources')}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                padding: '14px 28px',
                border: `4px solid ${textColor}`,
                backgroundColor: 'transparent',
                color: textColor,
                cursor: 'pointer',
                boxShadow: `4px 4px 0 ${shadowColor}`,
              }}
              whileHover={{
                backgroundColor: textColor,
                color: bgColor,
                boxShadow: `2px 2px 0 ${shadowColor}`,
                x: 2,
                y: 2,
              }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              EXPLORE RESOURCES
            </motion.button>
          </motion.div>

          {/* Login — utility footnote, not a primary CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
          >
            <motion.button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsLoginModalOpen(true);
              }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                marginTop: '20px',
                background: 'none',
                border: 'none',
                color: mutedColor,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                padding: 0,
                opacity: 0.5,
              }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              Login
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
