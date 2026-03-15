'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import OurStory from './OurStory';

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
  const posRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef(0);
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0 });
  const [renderRotation, setRenderRotation] = useState(0);

  const textContent = [
    {
      text: 'We are Mike and Chris. Two regular people who got tired of watching',
      textAlign: 'justify',
    },
    {
      text: 'families scramble for help when things go sideways.',
      textAlign: 'justify',
    },
    {
      text: 'We come from humble backgrounds, and we built Help Nearby with a',
      textAlign: 'justify',
    },
    {
      text: 'simple belief: people deserve clear next steps when life gets',
      textAlign: 'justify',
    },
    {
      text: 'chaotic.',
      textAlign: 'justify',
    },
    {
      text: 'We met while traveling through Europe, stayed close, and kept',
      textAlign: 'justify',
    },
    {
      text: 'talking about the same problem—resources exist, but they are hard',
      textAlign: 'justify',
    },
    {
      text: 'to find when you are stressed, displaced, or trying to help someone',
      textAlign: 'justify',
    },
    {
      text: 'you love.',
      textAlign: 'justify',
    },
    {
      text: 'So we are building a hub that makes it easier to locate real help',
      textAlign: 'justify',
    },
    {
      text: 'fast—disaster updates, food, housing, and cash assistance—without',
      textAlign: 'justify',
    },
    {
      text: 'the noise.',
      textAlign: 'justify',
    },
    {
      text: 'We are not trying to be heroes. We just want to build the thing',
      textAlign: 'center',
    },
    {
      text: 'we would want for our own family and friends. The journey',
      textAlign: 'center',
    },
    {
      text: 'continues...',
      textAlign: 'center',
    },
    {
      text: 'PEW PEW PEW!',
      textAlign: 'center',
    },
  ];

  // Track mouse position for lightsaber cursor using ref and animation frame
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const updateCursor = () => {
      targetPosRef.current = posRef.current;

      // Compute rotation so the blade points upward and apply wobble
      const angleRad =
        Math.atan2(
          posRef.current.y - window.innerHeight / 2,
          posRef.current.x - window.innerWidth / 2,
        ) -
        Math.PI / 2;
      const wobble = Math.sin(Date.now() / 200) * 5; // 5 degree wobble
      const rotateDeg = (angleRad * 180) / Math.PI + wobble;
      rotationRef.current = rotateDeg;

      setRenderPos({ ...targetPosRef.current });
      setRenderRotation(rotateDeg);

      requestAnimationFrame(updateCursor);
    };

    const animationId = requestAnimationFrame(updateCursor);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    width: panelWidth,
    aspectRatio: '21/9',
    border: '2px solid black',
    boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    cursor: 'none',
    overflow: 'hidden',
    background: '#07070b',
    position: 'fixed',
    top: '200px',
    left: '75px',
    right: '75px',
  };

  return (
    <div
      style={containerStyle}
    >
      {/* Lightsaber cursor */}
      <motion.div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: renderPos.x,
          top: renderPos.y,
          opacity: 1,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: `translate(-50%, -50%) rotate(${renderRotation}deg)`,
        }}
        animate={{
          left: renderPos.x,
          top: renderPos.y,
          rotate: renderRotation,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 1,
        }}
      />

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
            duration: 25,
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
            {textContent.map((item, index) => (
              <p
                key={index}
                style={{
                  textAlign: item.textAlign as React.CSSProperties['textAlign'],
                  marginTop: index === 14 ? '20px' : '0',
                }}
              >
                {item.text}
              </p>
            ))}
          </div>
        </motion.div>

        {/* Our Story component that appears after animation with 1 second delay */}
        {showOurStory && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 0,
              width: '100%',
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
  );
};

export default StarWarsIntro;