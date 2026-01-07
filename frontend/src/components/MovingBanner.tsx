import { useRef, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Button from '@/components/Buttons';

export interface MovingBannerProps {
  announcements: string[];
  speed?: number; // pixels per second
  backgroundColor?: string;
}

/**
 * Horizontal ticker that scrolls **left‑to‑right** continuously.
 * Uses Framer Motion with an infinite loop that never shows a gap.
 */
export default function MovingBanner({
  announcements,
  speed = 100,
  backgroundColor = '#ffeb3b',
}: MovingBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const controls = useAnimation();

  // Duplicate the list so the scrolling appears seamless
  const items = [...announcements, ...announcements];

  // -------------------------------------------------
  // 1️⃣ Measure the width of ONE set of announcements
  // -------------------------------------------------
  useEffect(() => {
    if (containerRef.current) {
      // scrollWidth includes both duplicated copies; divide by 2 for a single set
      setSingleSetWidth(containerRef.current.scrollWidth / 2);
    }
  }, [announcements]);

  // -------------------------------------------------
  // 2️⃣ Helper – start the infinite looping animation (left‑to‑right)
  // -------------------------------------------------
  const startInfiniteLoop = (initialX: number = -singleSetWidth) => {
    const distance = singleSetWidth; // travel from -singleSetWidth → 0
    const duration = distance / speed; // seconds for a full pass

    controls.start({
      x: [initialX, 0],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: 'loop',
          duration,
          ease: 'linear',
        },
      },
    });
  };

  // -------------------------------------------------
  // 3️⃣ Effect – (re)start the loop when width / speed changes
  // -------------------------------------------------
  useEffect(() => {
    if (singleSetWidth === 0) return;
    if (isPlaying) {
      startInfiniteLoop(); // begin from off‑screen left
    } else {
      controls.stop(); // pause while not playing
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleSetWidth, speed]);

  // -------------------------------------------------
  // 4️⃣ Effect – pause / resume handling (preserve scroll position)
  // -------------------------------------------------
  useEffect(() => {
    if (singleSetWidth === 0) return; // nothing to animate yet

    if (!isPlaying) {
      // ---------- PAUSE ----------
      controls.stop();
      return;
    }

    // ---------- PLAY ----------
    const el = containerRef.current;
    // Default start position is off‑screen left
    let currentX = -singleSetWidth;

    if (el) {
      const style = el.style.transform; // e.g. "translateX(-123px)"
      const match = style?.match(/translateX\(([-+]?\d*\.?\d+)px\)/);
      if (match && match[1]) {
        currentX = parseFloat(match[1]); // value between -singleSetWidth and 0
      }
    }

    // Distance remaining to reach the right edge (x = 0)
    const remainingDistance = Math.abs(currentX);
    const remainingDuration = remainingDistance / speed;

    // Animate the remainder of the current pass, then restart the infinite loop
    controls
      .start({
        x: [currentX, 0],
        transition: {
          x: {
            duration: remainingDuration,
            ease: 'linear',
          },
        },
      })
      .then(() => {
        // After reaching the right edge, start the normal infinite loop again
        startInfiniteLoop();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // -------------------------------------------------
  // 5️⃣ Render
  // -------------------------------------------------
  return (
    /* OUTER wrapper – background, top‑border, relative positioning */
    <div
      style={{
        backgroundColor,
        height: 100,
        width: '100%',
        borderTop: '4px solid #000',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden', // hide any reset artefacts
      }}
    >
      {/* Scrolling ticker */}
      <div
        style={{
          // Remove vertical padding – we’ll centre via flex
          padding: '0 0.5rem',
          display: 'flex',
          alignItems: 'center',
          height: '100%', // <-- full height of the banner
        }}
      >
        <motion.div
          ref={containerRef}
          animate={controls}
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            fontSize: '2rem',
            fontWeight: 600,
            flexGrow: 1,
            alignItems: 'center', // <-- vertically centre the text inside
            height: '100%', // <-- make it fill the wrapper’s height
          }}
        >
          {items.map((msg, idx) => (
            <span key={idx} style={{ marginRight: '2rem' }}>
              {msg}
            </span>
          ))}
        </motion.div>
      </div>
      {/* Button container – positioned at the right‑most edge of the banner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 0.5rem',
          backgroundColor: 'transparent',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <Button
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? 'Pause banner' : 'Play banner'}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </div>
    </div>
  );
}
