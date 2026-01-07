// src/components/MovingBanner.tsx
/* ----------------------------------------------------------- */
/*  IMPORTS – add React (or cloneElement) to the top of file  */
/* ----------------------------------------------------------- */
import React, {
  useRef,
  useLayoutEffect,
  useMemo,
  useState,
  CSSProperties,
} from 'react';
import { motion, useAnimation } from 'framer-motion';
import Button from '@/components/Buttons';
/* ----------------------------------------------------------- */

function Marker() {
  const bar: CSSProperties = {
    width: '4px',
    height: '100%',
    backgroundColor: '#fff',
    border: '1px solid #000',
    boxSizing: 'border-box',
  };
  const wrapper: CSSProperties = {
    display: 'flex',
    gap: '2px',
    marginRight: '2rem',
  };
  return (
    <div style={wrapper} aria-hidden="true">
      <div style={bar} />
      <div style={bar} />
    </div>
  );
}

/* ---------------------- MAIN COMPONENT ---------------------- */
export interface MovingBannerProps {
  announcements: string[];
  speed?: number;
  backgroundColor?: string;
}

export default function MovingBanner({
  announcements,
  speed = 100,
  backgroundColor = '#ffeb3b',
}: MovingBannerProps) {
  /* ---------------------- refs & state ---------------------- */
  const containerRef = useRef<HTMLDivElement>(null);
  const [singleSetWidth, setSingleSetWidth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const controls = useAnimation();

  /* ---------------------- helpers ---------------------- */
  /** Build the content of ONE loop (marker + messages) */
  const loopContent = useMemo(() => {
    const marker = <Marker />; // no key here
    const msgs = announcements.map((msg, i) => (
      <span key={`msg-${i}`} style={{ marginRight: '2rem' }}>
        {msg}
      </span>
    ));

    // Store logical keys separately; the elements themselves have no key yet
    return [
      { element: marker, key: 'marker' },
      ...msgs.map((el) => ({
        element: el,
        key: el.key as string,
      })),
    ];
  }, [announcements]);

  /**
   * Duplicate the loop while guaranteeing **unique** keys for every child.
   * We create two copies (`-0` and `-1`) and give each copy a distinct key.
   */
  const items = useMemo(() => {
    const firstCopy = loopContent.map((item) =>
      React.cloneElement(item.element as React.ReactElement, {
        key: `${item.key}-0`,
      }),
    );

    const secondCopy = loopContent.map((item) =>
      React.cloneElement(item.element as React.ReactElement, {
        key: `${item.key}-1`,
      }),
    );

    return [...firstCopy, ...secondCopy];
  }, [loopContent]);

  /**
   * Measure the width of ONE set (no duplicate). Runs synchronously
   * after DOM updates (`useLayoutEffect`) and updates on resize.
   */
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      // scrollWidth includes both duplicated copies → divide by 2
      setSingleSetWidth(containerRef.current!.scrollWidth / 2);
    };
    measure(); // initial measurement
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [announcements]);

  /* ---------------------- animation core ---------------------- */
  const runLoop = (initialX: number = 0) => {
    if (singleSetWidth === 0) return;
    const distance = singleSetWidth; // 0 → -singleSetWidth
    const duration = distance / speed;
    controls.start({
      x: [initialX, -singleSetWidth],
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

  useLayoutEffect(() => {
    if (singleSetWidth === 0) return;
    isPlaying ? runLoop() : controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleSetWidth, speed, isPlaying]);

  useLayoutEffect(() => {
    if (singleSetWidth === 0) return;
    if (!isPlaying) {
      controls.stop();
      return;
    }
    // NOTE: For a perfect pause/resume you could read the current
    // animated value from a MotionValue (`x.get()`), but the logic
    // below keeps the example simple.
    const currentX = 0;
    const remainingDistance = Math.abs(currentX + singleSetWidth);
    const remainingDuration = remainingDistance / speed;

    controls
      .start({
        x: [currentX, -singleSetWidth],
        transition: {
          x: { duration: remainingDuration, ease: 'linear' },
        },
      })
      .then(() => runLoop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  /* --------------------- styling --------------------- */
  const wrapperStyle: CSSProperties = {
    backgroundColor,
    height: '60px',
    width: '100%',
    borderTop: '4px solid #000',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  };
  const innerContainerStyle: CSSProperties = {
    padding: '0 0.5rem',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
  };
  const motionStyle: CSSProperties = {
    display: 'inline-flex',
    whiteSpace: 'nowrap',
    fontSize: '2rem',
    fontWeight: 600,
    flexGrow: 1,
    alignItems: 'center',
    height: '100%',
  };
  const buttonWrapperStyle: CSSProperties = {
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
  };

  /* --------------------- render --------------------- */
  return (
    <div style={wrapperStyle}>
      {/* Scrolling ticker */}
      <div style={innerContainerStyle}>
        <motion.div ref={containerRef} animate={controls} style={motionStyle}>
          {items}
        </motion.div>
      </div>

      {/* Pause / Play button */}
      <div style={buttonWrapperStyle}>
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
