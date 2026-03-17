'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OurStory from './OurStory';
import CustomCursor from './CustomCursor';

interface StarWarsIntroProps {
  onAnimationComplete?: () => void;
  panelHeight?: string;
  panelWidth?: string;
}

const StarWarsIntro: React.FC<StarWarsIntroProps> = ({
  onAnimationComplete,
  panelHeight = 'auto',
  panelWidth = 'min(1600px, max(200px, calc(100vw - 150px)))',
}) => {
  const [showOurStory, setShowOurStory] = useState(false);
  const [isMouseOverPanel, setIsMouseOverPanel] = useState(false);

  const paragraphs = [
    'We are Mike and Chris. Two regular people who got tired of watching families scramble for help when things go sideways.',
    'We built Help Nearby with a simple belief: people deserve clear next steps when life gets chaotic.',
    'We met while traveling through Europe, stayed close, and kept talking about the same problem—resources exist, but they are hard to find when you are stressed or trying to help someone you love.',
    'So we are building a hub that makes it easier to locate real help fast—disaster updates, food, housing, and cash assistance—without the noise.',
    'We are not trying to be heroes. We just want to build the thing we would want for our own family and friends.',
  ];

  const containerStyle: React.CSSProperties = {
    width: panelWidth,
    aspectRatio: '21/9',
    border: '2px solid black',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    cursor: 'none',
    overflow: 'hidden',
    background: '#07070b',
    position: 'fixed',
    top: '150px',
    left: '100px',
    right: '100px',
    margin: '0 auto',
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
          <motion.div
            style={{
              position: 'absolute',
              top: '100%',
              width: '100%',
              maxWidth: '800px',
              padding: '0 10px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
            }}
            initial={{ top: '100%' }}
            animate={{ top: '-150%' }}
            transition={{
              duration: 6,
              ease: 'linear',
              delay: 0,
            }}
            onAnimationComplete={() => {
              // Show the OurStory component 1 second after scroll animation completes
              setTimeout(() => {
                setShowOurStory(true);
                if (onAnimationComplete) {
                  onAnimationComplete();
                }
              }, 1000);
            }}
          >
            <div
              style={{
                color: '#f9c700',
                letterSpacing: '0.08em',
                lineHeight: 2,
                fontWeight: 600,
                fontSize: '22px',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {paragraphs.map((text, index) => (
                <p key={index} style={{ textAlign: 'justify', marginBottom: index < paragraphs.length - 1 ? '20px' : '0' }}>
                  {text}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Our Story component that appears after animation with 1 second delay */}
          {showOurStory && (
            <motion.div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: '100%',
                transform: 'translateY(-50%)',
                zIndex: 1001,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
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