import { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, LegacyAnimationControls } from 'framer-motion';
import Button from '@/components/Buttons';

export interface MovingBannerProps {
  announcements: string[];
  speed?: number; // pixels per second
  backgroundColor?: string;
}

/**
 * A horizontal ticker that scrolls the given announcements infinitely.
 * Includes a play/pause button that stays inline with the scrolling text at
 * the far‑right of the banner (its own container, higher z‑index).
 */
export default function MovingBanner({
  announcements,
  speed = 100,
  backgroundColor = '#ffeb3b',
}: MovingBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const controls = useAnimation(); // type: AnimationControls

  // Duplicate the list so the scrolling appears seamless
  const items = [...announcements, ...announcements];

  // -------------------------------------------------
  // 1️⃣ Measure the width of the scrolling content
  // -------------------------------------------------
  useEffect(() => {
    if (containerRef.current) {
      // scrollWidth includes both duplicated copies; divide by 2 for a single set
      setContainerWidth(containerRef.current.scrollWidth / 2);
    }
  }, [announcements]);

  // -------------------------------------------------
  // 2️⃣ Helper – start the infinite looping animation
  // -------------------------------------------------
  const startInfiniteLoop = (initialX: number = -containerWidth) => {
    const distance = containerWidth; // total travel distance
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
    if (containerWidth === 0) return;
    if (isPlaying) {
      startInfiniteLoop(); // start from the beginning on first render
    } else {
      controls.stop(); // ensure nothing runs while paused
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, speed]);

  // -------------------------------------------------
  // 4️⃣ Effect – pause / resume handling (preserve scroll pos)
  // -------------------------------------------------
  useEffect(() => {
    if (containerWidth === 0) return; // nothing to animate yet

    if (!isPlaying) {
      // ---------- PAUSE ----------
      // `stop()` freezes the animation at its current transform value
      controls.stop();
      return;
    }

    // ---------- PLAY ----------
    // Grab the current translateX value from the DOM element
    const el = containerRef.current;
    let currentX = -containerWidth; // fallback (start of a fresh loop)

    if (el) {
      const style = el.style.transform; // e.g. "translateX(-123px)"
      const match = style?.match(/translateX\(([-+]?\d*\.?\d+)px\)/);
      if (match && match[1]) {
        currentX = parseFloat(match[1]); // may be negative or 0
      }
    }

    // Compute remaining distance in the *current* loop
    const remainingDistance = Math.abs(currentX); // how far we still need to travel to reach 0
    const remainingDuration = remainingDistance / speed; // seconds left for this pass

    // 1️⃣ Animate the remainder of the current pass only
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
        // 2️⃣ When that finishes, kick off the normal infinite loop again
        startInfiniteLoop(); // now repeats forever as before
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // -------------------------------------------------
  // 5️⃣ Render
  // -------------------------------------------------
  return (
    /* ------------------------------------------------------- */
    /* OUTER wrapper – background, top‑border, relative pos      */
    /* ------------------------------------------------------- */
    <div
      style={{
        backgroundColor,
        width: '100%',
        borderTop: '4px solid #000',
        boxSizing: 'border-box',
        position: 'relative', // anchor for the absolute button
        overflow: 'visible', // hide scrolling text behind the button
      }}
    >
      {/* ------------------------------------------------------- */}
      {/* Scrolling ticker – the only element that actually moves */}
      {/* ------------------------------------------------------- */}
      <div
        style={{
          padding: '0.5rem 0',
          paddingRight: '5rem', // reserve visual space; the button sits on top
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <motion.div
          ref={containerRef}
          animate={controls}
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            fontSize: '1rem',
            fontWeight: 600,
            flexGrow: 1,
          }}
        >
          {items.map((msg, idx) => (
            <span key={idx} style={{ marginRight: '2rem' }}>
              {msg}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ------------------------------------------------------- */}
      {/* Button container – its own inline block positioned at the */}
      {/* right‑most edge of the banner. It sits on top of the      */}
      {/* scrolling text (z‑index) so the text disappears behind it */}
      {/* ------------------------------------------------------- */}
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
