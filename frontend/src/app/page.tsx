'use client';

import type { FC, CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import { useRouter } from 'next/navigation';

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
const TITLE_DISPLAY_TIME = 5000; // 5 seconds

// Landing page with cycling titles above "NEARBY."
const Landing: FC = () => {
  const router = useRouter();
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [isCycling, setIsCycling] = useState(false);
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
      {/* Main container with cycling label row and NEARBY. header */}
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
          cursor: 'pointer',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        onClick={() => router.push('/help')}
      >
        {/* Label row - cycling titles above NEARBY. */}
        <motion.div
          style={{ position: 'relative', overflow: 'hidden' as const }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isCycling ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Invisible sizer — always sized to the longest label so the container never shifts */}
          <div
            aria-hidden="true"
            style={{
              visibility: 'hidden',
              pointerEvents: 'none',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(4rem, 10vw, 8rem)',
              textTransform: 'uppercase' as const,
              lineHeight: 1.2,
              whiteSpace: 'nowrap' as const,
            }}
          >
            RESOURCES!
          </div>
          <AnimatePresence mode="popLayout">
            {isCycling && (
              <motion.div
                key={TITLES[currentTitleIndex]}
                style={{
                  position: 'absolute' as const,
                  top: 0,
                  left: 0,
                  width: '100%',
                }}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <div
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(4rem, 10vw, 8rem)',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {TITLES[currentTitleIndex]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* "NEARBY." - header with natural line spacing */}
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(4rem, 10vw, 8rem)',
            textTransform: 'uppercase',
            color: 'var(--color-text)',
            textAlign: 'left' as const,
            lineHeight: 1.2,
            zIndex: 10, // header behind label animation
          }}
        >
          NEARBY.
        </div>
      </motion.div>
    </div>
  );
};

export default Landing;
