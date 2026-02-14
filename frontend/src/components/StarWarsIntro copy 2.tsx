'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Lightsaber.module.css';

const StarWarsIntro: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    height: '400px',
    overflow: 'hidden',
    background: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'none', // Hide default cursor
  };

  const fadeTopStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '140px',
    pointerEvents: 'none',
    background:
      'linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
    zIndex: 5,
  };

  const fadeBottomStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '140px',
    pointerEvents: 'none',
    background: 'linear-gradient(to top, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0))',
    zIndex: 5,
  };

  const textContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: 'min(900px, 92vw)',
    textAlign: 'justify',
    color: '#f9c700',
    letterSpacing: '0.08em',
    lineHeight: 1.55,
    fontWeight: 600,
    fontSize: '22px',
    padding: '0 10px',
    zIndex: 2,
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isHovering) {
        setCursorPosition({
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    if (isHovering) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovering]);

  return (
    <div style={{ width: '100%' }}>
      <section className="crawl-wrap" aria-label="Our story (animated crawl)">
        <motion.div
          ref={containerRef}
          style={containerStyle}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          initial={{ height: '400px' }}
          animate={{ height: isAnimating ? '400px' : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div style={fadeTopStyle} aria-hidden="true" />
          <div style={fadeBottomStyle} aria-hidden="true" />

          <motion.div
            style={textContainerStyle}
            initial={{ y: '100%' }}
            animate={{ y: '-100%' }}
            transition={{ duration: 30, ease: 'linear' }}
            onAnimationComplete={() => setIsAnimating(false)}
          >
            <p>
              We’re Mike and Chris. Two regular people who got tired of watching
              families scramble for help when things go sideways.
            </p>
            <p>
              We come from humble backgrounds, and we built Help Nearby with a
              simple belief: people deserve clear next steps when life gets
              chaotic.
            </p>
            <p>
              We met while traveling through Europe, stayed close, and kept
              talking about the same problem—resources exist, but they’re hard
              to find when you’re stressed, displaced, or trying to help someone
              you love.
            </p>
            <p>
              So we’re building a hub that makes it easier to locate real help
              fast—disaster updates, food, housing, and cash assistance—without
              the noise.
            </p>
            <p>
              We’re not trying to be heroes. We just want to build the thing
              we’d want for our own family and friends. The journey
              continues.......... .
            </p>
          </motion.div>

          {/* Rod cursor effect */}
          {isHovering && (
            <div
              className={styles['rod-cursor']}
              style={{
                left: cursorPosition.x,
                top: cursorPosition.y,
              }}
            />
          )}
        </motion.div>
      </section>
    </div>
  );
};

export default StarWarsIntro;
