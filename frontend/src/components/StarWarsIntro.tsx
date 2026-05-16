'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OurStory from './OurStory';
import CustomCursor from './CustomCursor';
import Starfield from './Starfield';
import { useTheme } from './useTheme';

interface StarWarsIntroProps {
  onAnimationComplete?: () => void;
}

const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  onAnimationComplete,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [fadeTextOut, setFadeTextOut] = useState(false);

  const paragraphs = [
    'We are Mike and Chris. Two regular people who got tired of watching families scramble for help when things go sideways.',
    'We built Help Nearby with a simple belief: people deserve clear next steps when life gets chaotic.',
    'We met while traveling through Europe, stayed close, and kept talking about the same problem—resources exist, but they are hard to find when you are stressed or trying to help someone you love.',
    'So we are building a hub that makes it easier to locate real help fast—disaster updates, food, housing, and cash assistance—without the noise.',
    'We are not trying to be heroes. We just want to build the thing we would want for our own family and friends.',
  ];

  // Text styles
  const textMotionStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    maxWidth: '800px',
    padding: '0 15px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
    overflow: 'hidden',
  };

  // OurStory — flows from top of wrapper so team section below is scrollable
  const ourStoryStyle: React.CSSProperties = {
    position: 'relative',
    margin: '0 auto',
    width: '100%',
    maxWidth: '900px',
    padding: '12vh 20px 80px',
    zIndex: 3,
  };

  // Text content styles
  const textStyle: React.CSSProperties = {
    color: isDark ? '#f9c700' : '#f9c700',
    letterSpacing: '0.08em',
    lineHeight: 1.8,
    fontWeight: 600,
    fontSize: 'clamp(14px, 2.5vw, 22px)',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    padding: '20px 0',
  };

  return (
    <>
      <CustomCursor isMouseOverPanel={false} />

      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
        }}
      >
        {/* Starfield background spanning the entire page */}
        <Starfield starCount={150} />

        {/* Text animation - starts below viewport, scrolls up over 30 seconds, then fades out */}
        <motion.div
          style={textMotionStyle}
          initial={{ top: '100%' }}
          animate={{
            top: fadeTextOut ? '-150%' : ['100%', '-100%'],
            opacity: fadeTextOut ? 0 : 1,
          }}
          transition={{
            duration: 25,
            ease: 'linear',
            delay: 0,
          }}
          onAnimationComplete={() => {
            // Start fading out text after scroll completes
            setTimeout(() => {
              setFadeTextOut(true);
            }, 1000);
          }}
        >
          <div style={textStyle}>
            {paragraphs.map((text, index) => (
              <p
                key={index}
                style={{
                  textAlign: 'justify',
                  marginBottom: index < paragraphs.length - 1 ? '20px' : '0',
                  color: isDark ? '#f9c700' : '#f9c700',
                  fontSize: 'clamp(14px, 2.5vw, 22px)',
                }}
              >
                {text}
              </p>
            ))}
          </div>
        </motion.div>

        {/* Our Story component that appears after text fades out */}
        {fadeTextOut && (
          <motion.div
            style={ourStoryStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            onAnimationComplete={() => {
              if (onAnimationComplete) {
                onAnimationComplete();
              }
            }}
          >
            <OurStory />
          </motion.div>
        )}
      </div>
    </>
  );
};

export default StarWarsIntro;
