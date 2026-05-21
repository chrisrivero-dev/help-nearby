'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';

// ── Hero network SVG (CSS/SVG only — no images) ───────────────────────────────

const HeroNetwork: FC<{ isDark: boolean }> = ({ isDark }) => {
  const gold = '#f59e0b';
  const dim = isDark ? '#f59e0b' : '#d97706';
  const buildFill = isDark ? '#111213' : '#dde2e8';
  const bgFadeColor = isDark ? '#0a0c10' : '#f4f5f7';

  const center = { x: 390, y: 195 };

  const primaries = [
    { x: 255, y: 98 },
    { x: 435, y: 68 },
    { x: 535, y: 158 },
    { x: 505, y: 278 },
    { x: 335, y: 312 },
    { x: 195, y: 248 },
    { x: 175, y: 132 },
  ];

  const secondaries: Array<{ x: number; y: number; to: number }> = [
    { x: 155, y: 52, to: 6 },
    { x: 340, y: 28, to: 1 },
    { x: 595, y: 98, to: 2 },
    { x: 622, y: 218, to: 2 },
    { x: 578, y: 342, to: 3 },
    { x: 288, y: 382, to: 4 },
    { x: 82, y: 338, to: 5 },
    { x: 62, y: 158, to: 6 },
    { x: 118, y: 78, to: 0 },
  ];

  const buildings = [
    { x: 15, y: 310, w: 28, h: 110 },
    { x: 46, y: 278, w: 20, h: 142 },
    { x: 70, y: 295, w: 40, h: 125 },
    { x: 114, y: 262, w: 28, h: 158 },
    { x: 146, y: 285, w: 45, h: 135 },
    { x: 196, y: 270, w: 25, h: 150 },
    { x: 225, y: 292, w: 18, h: 128 },
    { x: 247, y: 262, w: 32, h: 158 },
    { x: 282, y: 235, w: 48, h: 185 },
    { x: 334, y: 280, w: 28, h: 140 },
    { x: 366, y: 255, w: 52, h: 165 },
    { x: 422, y: 278, w: 22, h: 142 },
    { x: 448, y: 258, w: 36, h: 162 },
    { x: 488, y: 292, w: 24, h: 128 },
    { x: 516, y: 268, w: 42, h: 152 },
    { x: 562, y: 282, w: 32, h: 138 },
    { x: 598, y: 262, w: 48, h: 158 },
  ];

  return (
    <svg
      viewBox="0 0 650 420"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMaxYMid slice"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroFadeX" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bgFadeColor} stopOpacity="1" />
          <stop offset="38%" stopColor={bgFadeColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroFadeY" x1="0" y1="0" x2="0" y2="1">
          <stop offset="62%" stopColor={bgFadeColor} stopOpacity="0" />
          <stop offset="100%" stopColor={bgFadeColor} stopOpacity="1" />
        </linearGradient>
        <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor={gold}
            stopOpacity={isDark ? '0.28' : '0.16'}
          />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
      </defs>

      {buildings.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill={buildFill}
        />
      ))}

      {secondaries.map((s, i) => {
        const target = primaries[s.to] ?? center;
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={target.x}
            y2={target.y}
            stroke={dim}
            strokeWidth="0.5"
            opacity={isDark ? 0.2 : 0.14}
          />
        );
      })}

      {primaries.map((p, i) => (
        <line
          key={i}
          x1={center.x}
          y1={center.y}
          x2={p.x}
          y2={p.y}
          stroke={dim}
          strokeWidth="0.9"
          opacity={isDark ? 0.45 : 0.3}
        />
      ))}

      <circle cx={center.x} cy={center.y} r="55" fill="url(#heroGlow)" />

      <circle
        cx={center.x}
        cy={center.y}
        r="10"
        fill="none"
        stroke={gold}
        strokeWidth="1.3"
        opacity="0.5"
      >
        <animate
          attributeName="r"
          values="10;36;10"
          dur="2.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx={center.x}
        cy={center.y}
        r="10"
        fill="none"
        stroke={gold}
        strokeWidth="0.8"
        opacity="0.3"
      >
        <animate
          attributeName="r"
          values="10;58;10"
          dur="2.8s"
          begin="0.9s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.3;0;0.3"
          dur="2.8s"
          begin="0.9s"
          repeatCount="indefinite"
        />
      </circle>

      {secondaries.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r="2"
          fill={dim}
          opacity={isDark ? 0.38 : 0.28}
        />
      ))}
      {primaries.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3.5"
          fill={dim}
          opacity={isDark ? 0.65 : 0.5}
        />
      ))}

      <circle cx={center.x} cy={center.y} r="8" fill={gold} />
      <circle
        cx={center.x}
        cy={center.y}
        r="3.5"
        fill={isDark ? '#0a0c10' : '#f4f5f7'}
      />

      <rect x="0" y="0" width="650" height="420" fill="url(#heroFadeX)" />
      <rect x="0" y="0" width="650" height="420" fill="url(#heroFadeY)" />
    </svg>
  );
};

interface HeroSectionProps {
  onLocationSubmit?: (zip: string) => void;
}

export const HeroSection: FC<HeroSectionProps> = ({ onLocationSubmit }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setLocation, zip, locationError, setLocationError } =
    useLocationContext();
  const [inputValue, setInputValue] = useState(zip);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive layout
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync input value when zip changes from context
  useEffect(() => {
    setInputValue(zip);
  }, [zip]);

  const handleSubmit = () => {
    if (!inputValue.trim()) {
      setLocationError?.('Please enter a ZIP code or city name.');
      return;
    }
    setLocationError?.(null);
    setLocation(inputValue.trim());
    onLocationSubmit?.(inputValue.trim());
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError?.('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInputValue(
          `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        );
        setLocation(
          `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
        );
        setLocationError?.(null);
      },
      () => {
        setLocationError?.(
          'Location access denied. Try entering a ZIP or city name.',
        );
      },
      { timeout: 8000 },
    );
  };

  const heroBg = isDark
    ? 'linear-gradient(135deg, #09090b 0%, #0a0c10 55%, #0b0d14 100%)'
    : 'linear-gradient(135deg, #f4f5f7 0%, #f8f9fb 100%)';
  const heroBorder = isDark ? '#1a1e28' : '#dde2ea';
  const heroShadow = isDark
    ? '4px 4px 0px rgba(0,0,0,0.85)'
    : '4px 4px 0px rgba(0,0,0,0.05)';
  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#555' : '#999';
  const inputBg = isDark ? '#07080b' : '#ffffff';
  const inputBorder = isDark ? '#252a36' : '#d0d4dc';
  const errorColor = '#dc2626';

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '1.25rem',
        marginTop: 0,
        background: heroBg,
        border: `1px solid ${heroBorder}`,
        boxShadow: heroShadow,
        minHeight: isMobile ? 'auto' : '270px',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: isMobile ? '2rem 1.5rem' : '2.5rem 2.5rem 2.5rem',
          maxWidth: isMobile ? '100%' : '54%',
          minWidth: 280,
        }}
      >
        <h1
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: isMobile ? '2.4rem' : 'clamp(2.6rem, 5.5vw, 5rem)',
            lineHeight: 0.93,
            letterSpacing: '-0.03em',
            margin: '0 0 1rem',
            color: cardText,
          }}
        >
          DISCOVER HELP
          <br />
          FASTER.
        </h1>

        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(0.88rem, 1.3vw, 1.05rem)',
            color: mutedText,
            margin: '0 0 1.75rem',
            lineHeight: 1.55,
            maxWidth: 400,
          }}
        >
          Explore what your community has to offer,
          <br />
          and ways to grow together.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            maxWidth: 520,
            gap: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              flexShrink: 0,
              width: 140,
              borderLeft: `1.5px solid ${locationError ? errorColor : inputBorder}`,
              borderTop: `1.5px solid ${locationError ? errorColor : inputBorder}`,
              borderBottom: `1.5px solid ${locationError ? errorColor : inputBorder}`,
            }}
          >
            <MapPin
              size={14}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: mutedText,
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Enter ZIP"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              style={{
                width: '100%',
                padding: '0.9rem 1rem 0.9rem 2.2rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                backgroundColor: inputBg,
                color: cardText,
                border: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            style={{
              padding: '0 1.6rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.83rem',
              letterSpacing: '0.06em',
              backgroundColor: '#fbbf24',
              color: isDark ? '#000' : '#000',
              borderLeft: 'none',
              borderRight: `1.5px solid ${locationError ? errorColor : inputBorder}`,
              borderTop: `1.5px solid ${locationError ? errorColor : inputBorder}`,
              borderBottom: `1.5px solid ${locationError ? errorColor : inputBorder}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            EXPLORE NEARBY →
          </button>
        </div>

        <AnimatePresence>
          {locationError && (
            <motion.p
              key="loc-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.76rem',
                color: errorColor,
                margin: '0.45rem 0 0',
                padding: 0,
              }}
            >
              {locationError}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={handleLocate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginTop: locationError ? '0.5rem' : '0.7rem',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.8rem',
            color: '#f59e0b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.85,
            letterSpacing: '0.01em',
          }}
        >
          <Navigation size={12} />
          Use my location
        </button>
      </div>

      {/* HeroNetwork — slides behind and dims on mobile/zoom instead of disappearing */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '62%',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: isMobile ? 0.45 : 1,
          transition:
            'width 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <HeroNetwork isDark={isDark} />
      </div>
    </motion.section>
  );
};

export default HeroSection;
