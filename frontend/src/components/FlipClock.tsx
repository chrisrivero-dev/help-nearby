'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from './useTheme';
import FlipDigit from './FlipDigit';

// Separate component for the colon separator
const ColonSeparator: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      style={{
        width: 'min(40px, 4vw)',
        height: 'min(120px, 12vw)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? '#e8e8e8' : '#111111',
        fontSize: 'min(64px, 10vw)',
        fontWeight: 700,
      }}
    >
      :
    </motion.div>
  );
};

const FlipClock: FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nextTime, setNextTime] = useState<string>('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();

  // Use ref to track the latest time to avoid stale closures
  const latestTimeRef = useRef('');

  useEffect(() => {
    // Function to get current time in EST timezone
    const updateTime = () => {
      const now = new Date();
      
      // Format time in EST timezone using 24-hour format
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      const timeString = formatter.format(now);
      latestTimeRef.current = timeString;
      
      // Only update state if time has changed (new minute)
      if (currentTime !== timeString) {
        setNextTime(timeString);
        setCurrentTime(timeString);
      }
    };

    // Initial update
    updateTime();

    // Update every second
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [currentTime]);

  // Parse time strings into individual digits
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

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0',
        padding: '0 0.5rem',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <FlipDigit currentValue={currentHourDigit1} nextValue={nextHourDigit1} />
      <FlipDigit currentValue={currentHourDigit2} nextValue={nextHourDigit2} />
      <ColonSeparator />
      <FlipDigit currentValue={currentMinuteDigit1} nextValue={nextMinuteDigit1} />
      <FlipDigit currentValue={currentMinuteDigit2} nextValue={nextMinuteDigit2} />
    </motion.div>
  );
};

export default FlipClock;