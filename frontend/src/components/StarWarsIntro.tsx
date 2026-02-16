'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './Lightsaber.module.css';
import Starfield from './Starfield';
import LightsaberCursor from './LightsaberCursor';
import OurStory from './OurStory';

interface StarWarsIntroProps {
  onAnimationComplete?: () => void;
}

const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  onAnimationComplete,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isLastParagraphVisible, setIsLastParagraphVisible] = useState(false);
  const [showOurStory, setShowOurStory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lastParagraphRef = useRef<HTMLParagraphElement>(null);
  const [animationDuration, setAnimationDuration] = useState(30); // Default 22 seconds
  const observerRef = useRef<IntersectionObserver | null>(null);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    perspective: '1200px',
    perspectiveOrigin: '50% 50%',
    background: '#07070b',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'none', // Hide default cursor
    flex: 1, // Allow flex behavior
    minHeight: '100%', // Ensure minimum height
  };

  // Removed fade top and bottom panels

  const textContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '800px',
    textAlign: 'justify',
    color: '#f9c700',
    letterSpacing: '0.08em',
    lineHeight: 2,
    fontWeight: 600,
    fontSize: '22px',
    padding: '0 10px',
    margin: '0 auto',
    zIndex: 2,
    flex: 1, // Allow flex behavior
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%', // Ensure it fills the container height
    minHeight: '100%', // Ensure minimum height
  };

  // Set up intersection observer to detect when last paragraph is scrolled through
  useEffect(() => {
    if (lastParagraphRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // When the last paragraph is no longer visible (scrolled past), trigger completion
          if (!entry.isIntersecting) {
            setIsLastParagraphVisible(true);
            setShowOurStory(true);
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }
        },
        {
          root: containerRef.current,
          threshold: 0, // Trigger when element is no longer visible
        },
      );

      observer.observe(lastParagraphRef.current);
      observerRef.current = observer;

      return () => {
        observer.disconnect();
      };
    }
  }, [onAnimationComplete]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        cursor: 'none',
        overflow: 'hidden',
        background: '#07070b',
        position: 'relative',
        flex: 1, // Allow flex behavior
        display: 'flex', // Ensure flex behavior
        flexDirection: 'column', // Ensure column layout
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <section
        className="crawl-wrap"
        aria-label="Our story (animated crawl)"
        style={{
          margin: 0,
          padding: 0,
          cursor: 'none',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <motion.div
          ref={containerRef}
          style={containerStyle}
          initial={{ height: '100%' }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.5, ease: 'linear' }}
          className="star-wars-container"
        >
          <Starfield />

          <motion.div
            ref={textContainerRef}
            style={{ ...textContainerStyle, transformOrigin: '50% 50%' }}
            initial={{ y: '180%', rotateX: 38, scale: 1, opacity: 1 }}
            animate={{
              y: '-150%',
              rotateX: 38,
              scale: [1],
              opacity: [1],
            }}
            transition={{ duration: animationDuration, ease: 'easeOut' }}
            onAnimationComplete={() => {
              setIsAnimating(false);
              // Only call onAnimationComplete if the last paragraph is also visible
              // This ensures we don't trigger early
              if (isLastParagraphVisible && onAnimationComplete) {
                onAnimationComplete();
              }
            }}
          >
            <p>
              We're Mike and Chris. Two regular people who got tired of watching
              families scramble for help when things go sideways.
            </p>
            <p>
              We come from humble backgrounds, and we built Help Nearby with a
              simple belief: people deserve clear next steps when life gets
              chaotic.
            </p>
            <p>
              We met while traveling through Europe, stayed close, and kept
              talking about the same problem—resources exist, but they're hard
              to find when you're stressed, displaced, or trying to help someone
              you love.
            </p>
            <p>
              So we're building a hub that makes it easier to locate real help
              fast—disaster updates, food, housing, and cash assistance—without
              the noise.
            </p>
            <p
              ref={lastParagraphRef}
              style={{
                textAlign: 'center',
                marginTop: '20px',
                color: '#f9c700',
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                flex: 1, // Allow flex behavior for the last paragraph
              }}
            >
              We're not trying to be heroes. We just want to build the thing
              we'd want for our own family and friends. The journey
              continues.......
              <span style={{ display: 'inline-block' }}>PEW PEW PEW!</span>
            </p>
          </motion.div>

          {/* Our Story component that appears after animation - now positioned absolutely on top */}
          {showOurStory && (
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1001, // Higher z-index to ensure it's on top
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <OurStory />
            </motion.div>
          )}
        </motion.div>
        {/* Lightsaber cursor effect */}
        <LightsaberCursor isHovering={isHovering} />
      </section>
    </div>
  );
};

export default StarWarsIntro;
