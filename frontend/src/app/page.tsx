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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        {/* Visual depth layer — contained to canvas, no pointer events */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '520px',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Ambient radial glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'radial-gradient(ellipse 580px 360px at center, rgba(251, 191, 36, 0.06) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 580px 360px at center, rgba(0, 0, 0, 0.025) 0%, transparent 70%)',
            }}
          />
          {/* Location signal — three pulsing concentric rings */}
          <svg
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            width="480"
            height="480"
            viewBox="0 0 480 480"
            fill="none"
            aria-hidden="true"
          >
            {([0, 1, 2] as const).map((i) => (
              <motion.circle
                key={i}
                cx={240}
                cy={240}
                r={72}
                stroke={
                  isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(0, 0, 0, 0.07)'
                }
                strokeWidth={1}
                fill="none"
                style={{ transformOrigin: '240px 240px' }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: [0, 0.75, 0], scale: [0.4, 1.05, 1.65] }}
                transition={{
                  duration: 3.6,
                  delay: i * 1.2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
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
                fontSize: 'clamp(2.5rem, 5.5vw, 5rem)',
                textTransform: 'uppercase',
                color: textColor,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}
            >
              HELP NEARBY.
            </div>
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(2.5rem, 5.5vw, 5rem)',
                textTransform: 'uppercase',
                color: textColor,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
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
            Find shelter, food, financial assistance, and emergency resources
            near you.
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
