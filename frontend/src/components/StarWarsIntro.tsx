'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OurStory from './OurStory';
import CustomCursor from './CustomCursor';
import Starfield from './Starfield';
import { useTheme } from './useTheme';

interface StarWarsIntroProps {
  onAnimationComplete?: () => void;
  panelHeight?: string;
  panelWidth?: string;
}

const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  onAnimationComplete,
  panelHeight = 'auto',
  panelWidth = 'min(1800px, max(200px, calc(100vw - 20px)))',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showOurStory, setShowOurStory] = useState(false);
  const [fadeTextOut, setFadeTextOut] = useState(false);
  const [isMouseOverPanel, setIsMouseOverPanel] = useState(false);

  const paragraphs = [
    'We are Mike and Chris. Two regular people who got tired of watching families scramble for help when things go sideways.',
    'We built Help Nearby with a simple belief: people deserve clear next steps when life gets chaotic.',
    'We met while traveling through Europe, stayed close, and kept talking about the same problem—resources exist, but they are hard to find when you are stressed or trying to help someone you love.',
    'So we are building a hub that makes it easier to locate real help fast—disaster updates, food, housing, and cash assistance—without the noise.',
    'We are not trying to be heroes. We just want to build the thing we would want for our own family and friends.',
  ];

  // Responsive container styles
  const containerStyle: React.CSSProperties = {
    width: panelWidth,
    aspectRatio: '21/9',
    border: 'none',
    boxShadow: 'none',
    cursor: 'none',
    overflow: 'hidden',
    background: 'transparent',
    position: 'fixed',
    top: 'calc(15vh + 20px)',
    left: '2%',
    right: '2%',
    margin: '0 auto',
    maxHeight: 'calc(100vh - 30vh)',
    zIndex: 999,
  };

  // Text styles matching OurStory width
  const textMotionStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    width: '100%',
    maxWidth: '800px',
    padding: '0 15px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
    overflow: 'hidden',
  };

  // OurStory responsive positioning - matching text width and spacing
  const ourStoryStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    width: '100%',
    maxWidth: '800px',
    padding: '0 15px',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 3,
  };

  // Text content styles
  const textStyle: React.CSSProperties = {
    color: isDark ? '#f9c700' : '#f9c700',
    letterSpacing: '0.08em',
    lineHeight: 1.8,
    fontWeight: 600,
    fontSize: 'clamp(14px, 2.5vw, 22px)',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    padding: '20px 0',
  };

  return (
    <>
      <CustomCursor isMouseOverPanel={isMouseOverPanel} />

      <div
        style={containerStyle}
        onMouseEnter={() => setIsMouseOverPanel(true)}
        onMouseLeave={() => setIsMouseOverPanel(false)}
      >
        <section
          className="crawl-wrap"
          aria-label="Our story (animated scroll)"
          style={{
            margin: 0,
            padding: 0,
            cursor: 'none',
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Starfield background - 8-bit galaxy far, far away */}
          <Starfield starCount={150} />

          {/* Text animation - scrolls up and fades out */}
          <motion.div
            style={textMotionStyle}
            initial={{ top: '100%' }}
            animate={{
              top: fadeTextOut ? '-150%' : ['100%', '-150%'],
              opacity: fadeTextOut ? 0 : 1,
            }}
            transition={{
              duration: 12,
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
              initial={{ opacity: 0, top: '100%' }}
              animate={{ opacity: 1, top: '50%' }}
              transition={{ duration: 1, ease: 'easeIn' }}
              onAnimationComplete={() => {
                if (onAnimationComplete) {
                  onAnimationComplete();
                }
              }}
            >
              <OurStory />
            </motion.div>
          )}
        </section>
      </div>
    </>
  );
};

export default StarWarsIntro;
