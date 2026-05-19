'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import OurStory from './OurStory';
import MeetTheFounders from './MeetTheFounders';
import CustomCursor from './CustomCursor';
import Starfield from './Starfield';
import SkipButton from './SkipButton';
import { useTheme } from './useTheme';

interface StarWarsIntroProps {
  onAnimationComplete?: () => void;
}

const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  onAnimationComplete,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // States
  const [textVisible, setTextVisible] = useState(true); // StarWarsIntro text visible
  const [foundersVisible, setFoundersVisible] = useState(false); // MeetTheFounders visible
  const [ourStoryVisible, setOurStoryVisible] = useState(false); // OurStory visible
  const [isReplayMode, setIsReplayMode] = useState(false);

  const paragraphs = [
    'We are Mike and Chris. Two regular people who got tired of watching families scramble for help when things go sideways.',
    'We built Help Nearby with a simple belief: people deserve clear next steps when life gets chaotic.',
    'We met while traveling through Europe, stayed close, and kept talking about the same problem—resources exist, but they are hard to find when you are stressed or trying to help someone you love.',
    'So we are building a hub that makes it easier to locate real help fast—disaster updates, food, housing, and cash assistance—without the noise.',
    'We are not trying to be heroes. We just want to build the thing we would want for our own family and friends.',
  ];

  // Text styles
  const textMotionStyle: React.CSSProperties = {
    position: 'fixed',
    width: '100%',
    maxWidth: '800px',
    padding: '0 15px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2,
    overflow: 'hidden',
  };

  // OurStory container style
  const ourStoryStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: '900px',
    padding: '4rem 20px',
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

  // Auto-start the intro text animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setTextVisible(false);
    }, 25000); // After text finishes scrolling
    return () => clearTimeout(timer);
  }, []);

  const handleSkip = () => {
    // Fade out text, show founders
    setTextVisible(false);
    setOurStoryVisible(false);
    setFoundersVisible(true);
    setIsReplayMode(true);
  };

  const handleReplay = () => {
    // Reset to initial state
    setFoundersVisible(false);
    setOurStoryVisible(false);
    setIsReplayMode(false);
    setTextVisible(true);
  };

  return (
    <>
      <CustomCursor isMouseOverPanel={false} />

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Starfield background spanning the entire page */}
        <Starfield starCount={150} />

        {/* StarWarsIntro text animation - scrolls from bottom to top over 25 seconds */}
        {textVisible && !isReplayMode && (
          <motion.div
            style={textMotionStyle}
            initial={{ transform: 'translateX(-50%) translateY(100vh)' }}
            animate={{
              transform: [
                'translateX(-50%) translateY(100vh)',
                'translateX(-50%) translateY(-200%)',
              ],
            }}
            transition={{
              duration: 25,
              ease: 'linear',
              delay: 0,
            }}
            onAnimationComplete={() => {
              setTextVisible(false);
              setOurStoryVisible(true);
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
        )}

        {/* Skip button - always visible while intro or OurStory is showing */}
        {!isReplayMode && (
          <SkipButton
            onClick={handleSkip}
            isReplayMode={false}
            isVisible={true}
          />
        )}

        {/* Replay button (ROLL THE CREDITS) - visible when founders are shown */}
        {isReplayMode && (
          <SkipButton
            onClick={handleReplay}
            isReplayMode={true}
            isVisible={true}
          />
        )}

        {/* Our Story component - appears after StarWarsIntro finishes */}
        {!isReplayMode && ourStoryVisible && (
          <motion.div
            style={ourStoryStyle}
            initial={{ opacity: 0, transform: 'translate(-50%, -50%)' }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <OurStory isVisible={true} />
          </motion.div>
        )}

        {/* MeetTheFounders component - appears when skip is clicked */}
        {foundersVisible && (
          <motion.div
            style={ourStoryStyle}
            initial={{ opacity: 0, transform: 'translate(-50%, -50%)' }}
            animate={{
              opacity: foundersVisible ? 1 : 0,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <MeetTheFounders isVisible={foundersVisible} />
          </motion.div>
        )}
      </div>
    </>
  );
};

export default StarWarsIntro;
