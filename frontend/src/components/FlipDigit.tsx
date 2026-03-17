'use client';

import type { FC } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from './useTheme';
import { useState, useEffect } from 'react';

interface FlipDigitProps {
  currentValue: string;
  nextValue: string;
}

const digitSize = {
  width: '96px',
  height: 'min(60px, 6vw)',
  fontSize: 'min(48px, 5vw)',
};

const FlipDigit: FC<FlipDigitProps> = ({ currentValue, nextValue }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();

  const textColor = isDark ? '#e8e8e8' : '#111111';
  const panelColor = isDark ? '#333' : '#f0f0f0';

  // fontFamily removed - Poppins is now set as default in globals.css

  const [shouldFlip, setShouldFlip] = useState(false);

  // Trigger flip when currentValue changes
  useEffect(() => {
    setShouldFlip(true);
  }, [currentValue]);

  // Reset flip after animation completes
  useEffect(() => {
    if (shouldFlip) {
      const timer = setTimeout(() => {
        setShouldFlip(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [shouldFlip]);

  // Determine what to display
  const displayValue = shouldFlip ? nextValue : currentValue;

  if (reduceMotion || currentValue === nextValue) {
    return (
      <motion.div
        style={{
          ...digitSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: panelColor,
          color: textColor,
          fontWeight: 700,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        {displayValue}
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        ...digitSize,
        position: 'relative',
        perspective: '1000px',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateX: shouldFlip ? 180 : 0 }}
        transition={{
          type: 'tween',
          duration: 0.8,
          ease: 'easeInOut',
        }}
      >
        {/* Top panel - shows current digit */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '50%',
            backgroundColor: panelColor,
            borderRadius: '0 0 0 0',
            color: textColor,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            fontSize: digitSize.fontSize,
            fontWeight: 700,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            backfaceVisibility: 'hidden',
          }}
        >
          {displayValue}
        </motion.div>

        {/* Bottom panel - shows next digit after flip */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            height: '50%',
            backgroundColor: panelColor,
            borderRadius: '0 0 0 0',
            color: textColor,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            fontSize: digitSize.fontSize,
            fontWeight: 700,
            boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
          }}
        >
          {nextValue}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FlipDigit;