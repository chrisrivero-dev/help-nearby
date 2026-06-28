'use client';

import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from './useTheme';
import { useOptionalLocationContext } from './help/LocationContext';
import { Clock as ClockIcon } from 'lucide-react';

const FONT_FAMILY = "'Poppins', sans-serif";
const ACCENT = '#FFB000';

// ─── Theme tokens, mirrored from the help panels ────────────────────────────
const tokens = (isDark: boolean) => ({
  containerBg: isDark ? '#141414' : '#ffffff',
  containerBorder: isDark ? '#3A3A3A' : '#d0d0d0',
  tileBg: isDark ? '#1C1C1C' : '#E3E3DC',
  tileText: isDark ? '#F5F5F0' : '#111111',
  mutedText: isDark ? '#555' : '#aaa',
});

// ─── Location → IANA timezone ────────────────────────────────────────────────
// Majority timezone per US state. Good enough for a wall clock; the few
// counties that straddle a zone boundary are an acceptable approximation.
const STATE_TIMEZONES: Record<string, string> = {
  AL: 'America/Chicago',
  AK: 'America/Anchorage',
  AZ: 'America/Phoenix',
  AR: 'America/Chicago',
  CA: 'America/Los_Angeles',
  CO: 'America/Denver',
  CT: 'America/New_York',
  DE: 'America/New_York',
  DC: 'America/New_York',
  FL: 'America/New_York',
  GA: 'America/New_York',
  HI: 'Pacific/Honolulu',
  ID: 'America/Boise',
  IL: 'America/Chicago',
  IN: 'America/Indiana/Indianapolis',
  IA: 'America/Chicago',
  KS: 'America/Chicago',
  KY: 'America/New_York',
  LA: 'America/Chicago',
  ME: 'America/New_York',
  MD: 'America/New_York',
  MA: 'America/New_York',
  MI: 'America/Detroit',
  MN: 'America/Chicago',
  MS: 'America/Chicago',
  MO: 'America/Chicago',
  MT: 'America/Denver',
  NE: 'America/Chicago',
  NV: 'America/Los_Angeles',
  NH: 'America/New_York',
  NJ: 'America/New_York',
  NM: 'America/Denver',
  NY: 'America/New_York',
  NC: 'America/New_York',
  ND: 'America/Chicago',
  OH: 'America/New_York',
  OK: 'America/Chicago',
  OR: 'America/Los_Angeles',
  PA: 'America/New_York',
  RI: 'America/New_York',
  SC: 'America/New_York',
  SD: 'America/Chicago',
  TN: 'America/Chicago',
  TX: 'America/Chicago',
  UT: 'America/Denver',
  VT: 'America/New_York',
  VA: 'America/New_York',
  WA: 'America/Los_Angeles',
  WV: 'America/New_York',
  WI: 'America/Chicago',
  WY: 'America/Denver',
};

// Resolve the timezone for the active location, falling back to the browser's
// local zone when no valid location has been selected.
const resolveTimeZone = (stateCode: string, isValid: boolean): string => {
  const zone = isValid ? STATE_TIMEZONES[stateCode?.toUpperCase()] : undefined;
  if (zone) return zone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/Los_Angeles';
  }
};

interface FlipDigitProps {
  currentValue: string;
  nextValue: string;
}

const digitSize = {
  width: 'min(64px, 15vw)',
  height: 'min(50px, 10vh)',
  fontSize: 'min(32px, 6vw)',
};

const FlipDigit: FC<FlipDigitProps> = ({ currentValue, nextValue }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const reduceMotion = useReducedMotion();
  const t = tokens(isDark);

  // shouldFlip is toggled via a key prop change on the motion.div in the parent component
  // This avoids calling setState in an effect
  const shouldFlip = false; // Always false, flip is handled via key change

  if (reduceMotion || currentValue === nextValue) {
    return (
      <motion.div
        style={{
          ...digitSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.tileBg,
          color: t.tileText,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          border: `1px solid ${t.containerBorder}`,
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
        border: `1px solid ${t.containerBorder}`,
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
          backgroundColor: t.tileBg,
          color: t.tileText,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          fontSize: digitSize.fontSize,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
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
          backgroundColor: t.tileBg,
          color: t.tileText,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          fontSize: digitSize.fontSize,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
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

// Stacked AM / PM indicator. The cell matching the current period is
// highlighted with the panels' gold accent.
function MeridiemColumn({
  period,
  isDark,
}: {
  period: 'AM' | 'PM';
  isDark: boolean;
}) {
  const t = tokens(isDark);

  const cell = (label: 'AM' | 'PM') => {
    const active = period === label;
    return (
      <div
        style={{
          width: 'min(40px, 9vw)',
          height: 'calc(min(50px, 10vh) / 2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? ACCENT : t.tileBg,
          color: active ? '#111111' : t.mutedText,
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 'min(13px, 3vw)',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${t.containerBorder}`,
      }}
    >
      {cell('AM')}
      {cell('PM')}
    </div>
  );
}

// Digits display component - opens at bottom center of viewport
function ClockDigits({
  isOpen,
  isDark,
  timeZone,
  onClose,
}: {
  isOpen: boolean;
  isDark: boolean;
  timeZone: string;
  onClose: () => void;
}) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [nextTime, setNextTime] = useState<string>('');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isClient, setIsClient] = useState(false);

  const latestTimeRef = useRef('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const updateTime = () => {
      const now = new Date();
      const parts = formatter.formatToParts(now);
      const hour = parts.find((p) => p.type === 'hour')?.value ?? '12';
      const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
      const dayPeriod =
        parts.find((p) => p.type === 'dayPeriod')?.value ?? 'AM';

      const timeString = `${hour}:${minute}`;
      latestTimeRef.current = timeString;
      setPeriod(dayPeriod.toUpperCase().startsWith('P') ? 'PM' : 'AM');

      if (currentTime !== timeString) {
        setNextTime(timeString);
        setCurrentTime(timeString);
      }
    };

    updateTime();

    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [currentTime, isClient, timeZone]);

  if (!isClient) {
    return null;
  }

  // Calculate positions - use top with calculated values to position at bottom
  // Window height - element height - 20px padding from bottom
  const elementHeight = 80; // approximate height of clock element
  // Clear the fixed 42px NewsTicker pinned to the bottom, plus a small gap.
  const bottomOffset = 42 + 16;
  const openTop = window.innerHeight - elementHeight - bottomOffset;
  const closedTop = window.innerHeight + 50; // fully below viewport

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

  const t = tokens(isDark);

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: openTop,
        left: 0,
        right: 0,
        marginLeft: 'auto',
        marginRight: 'auto',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1rem',
        backgroundColor: t.containerBg,
        border: `1px solid ${t.containerBorder}`,
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.5)'
          : '0 8px 24px rgba(0, 0, 0, 0.12)',
        width: 'fit-content',
        whiteSpace: 'nowrap',
      }}
      initial={{ opacity: 0, top: closedTop }}
      animate={{
        opacity: isOpen ? 1 : 0,
        top: isOpen ? openTop : closedTop,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
      onClick={onClose}
    >
      <FlipDigit currentValue={currentHourDigit1} nextValue={nextHourDigit1} />
      <FlipDigit currentValue={currentHourDigit2} nextValue={nextHourDigit2} />
      <motion.div
        style={{
          width: 'min(16px, 2vw)',
          height: 'min(50px, 10vh)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: t.tileText,
          backgroundColor: t.tileBg,
          fontFamily: FONT_FAMILY,
          fontSize: 'min(48px, 5vw)',
          fontWeight: 700,
          border: `1px solid ${t.containerBorder}`,
        }}
      >
        :
      </motion.div>
      <FlipDigit
        currentValue={currentMinuteDigit1}
        nextValue={nextMinuteDigit1}
      />
      <FlipDigit
        currentValue={currentMinuteDigit2}
        nextValue={nextMinuteDigit2}
      />
      <MeridiemColumn period={period} isDark={isDark} />
    </motion.div>
  );
}

const Clock: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  // Location-aware timezone. Safe outside a LocationProvider (falls back to the
  // browser's local timezone).
  const location = useOptionalLocationContext();
  const timeZone = resolveTimeZone(
    location?.state ?? '',
    location?.isValid ?? false,
  );

  return (
    <>
      <ClockIcon
        style={{
          cursor: 'pointer',
          color: isDark ? '#e8e8e8' : '#111111',
          width: '18px',
          height: '18px',
          margin: 0,
          padding: 0,
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      />
      <ClockDigits
        isOpen={isOpen}
        isDark={isDark}
        timeZone={timeZone}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default Clock;
