'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from './useTheme';
import { Clock as ClockIcon } from 'lucide-react';

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
        {currentValue}
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        ...digitSize,
        position: 'relative',
        perspective: '1000px',
        overflow: 'hidden',
      }}
    >
      {/* Top half - shows current digit */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50%',
          backgroundColor: panelColor,
          color: textColor,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          fontSize: digitSize.fontSize,
          fontWeight: 700,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        {currentValue}
      </motion.div>

      {/* Bottom half - shows next digit, flips up */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: '100%',
          height: '50%',
          backgroundColor: panelColor,
          color: textColor,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          fontSize: digitSize.fontSize,
          fontWeight: 700,
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
          transformOrigin: '50% 0%',
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateX: shouldFlip ? -180 : 0 }}
        transition={{
          type: 'tween',
          duration: 0.8,
          ease: 'easeInOut',
        }}
      >
        {nextValue}
      </motion.div>
    </motion.div>
  );
};

const Clock: FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nextTime, setNextTime] = useState<string>('');
const [isOpen, setIsOpen] = useState<boolean>(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();

  const latestTimeRef = useRef('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      const timeString = formatter.format(now);
      latestTimeRef.current = timeString;
      
      if (currentTime !== timeString) {
        setNextTime(timeString);
        setCurrentTime(timeString);
      }
    };

    updateTime();

    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [currentTime]);

  const currentHours = currentTime.slice(0, 2);
  const currentMinutes = currentTime.slice(3, 5);

  const nextHours = nextTime.slice(0, 2);
  const nextMinutes = nextTime.slice(3, 5);

  const currentHourDigit1 = currentHours[0];
  const currentHourDigit2 = currentHours[1];
  const currentMinuteDigit1 = currentMinutes[0];
  const currentMinuteDigit2 = currentMinutes[1];

  const nextHourDigit1 = nextHours[0];
  const nextHourDigit2 = nextHours[1];
  const nextMinuteDigit1 = nextMinutes[0];
  const nextMinuteDigit2 = nextMinutes[1];

  const colonPanelColor = isDark ? '#333' : '#f0f0f0';

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0 0.5rem',
        zIndex: 9999,
        position: 'relative',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Clock display container - tiles in/out to the left of icon */}
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          width: 'auto',
        }}
        animate={{
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
      >
        <FlipDigit currentValue={currentHourDigit1} nextValue={nextHourDigit1} />
        <FlipDigit currentValue={currentHourDigit2} nextValue={nextHourDigit2} />
        <motion.div
          style={{
            width: 'min(20px, 2.5vw)',
            height: 'min(60px, 6vw)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#e8e8e8' : '#111111',
            backgroundColor: colonPanelColor,
            fontSize: 'min(48px, 5vw)',
            fontWeight: 700,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          :
        </motion.div>
        <FlipDigit currentValue={currentMinuteDigit1} nextValue={nextMinuteDigit1} />
        <FlipDigit currentValue={currentMinuteDigit2} nextValue={nextMinuteDigit2} />
      </motion.div>
      {/* Clock icon - stays in fixed position (last in flex row) */}
      <ClockIcon
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
          cursor: 'pointer', 
          color: isDark ? '#e8e8e8' : '#111111' 
        }} 
      />
    </motion.div>
  );
};

export default Clock;