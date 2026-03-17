'use client';

import React, { useMemo } from 'react';

interface StarfieldProps {
  starCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Simple pseudo-random number generator for consistent star positions
 * Returns a value between 0 and 1
 */
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

/**
 * Starfield component with math-based randomization
 * Creates a galaxy far, far away with 8-bit flicker animations
 */
const Starfield: React.FC<StarfieldProps> = ({
  starCount = 150,
  className = '',
  style = {},
}) => {
  // Generate stars with math-based randomization using a seed
  const { stars, shootingStars } = useMemo(() => {
    const newStars = [];
    const newShootingStars = [];
    const seed = 42; // Fixed seed for consistent starfield across renders
    const shootingStarCount = 5; // Number of shooting stars

    for (let i = 0; i < starCount; i++) {
      // Use seeded random for consistent positions - round to 4 decimals for SSR consistency
      const top = Math.round(seededRandom(seed + i * 13) * 10000) / 100;
      const left = Math.round(seededRandom(seed + i * 37) * 10000) / 100;

      // Random size (1-3px for 8-bit feel) - round to 2 decimals
      const size = Math.round((1 + seededRandom(seed + i * 53) * 2) * 100) / 100;

      // Random flicker animation configuration
      const duration = Math.round((1.5 + seededRandom(seed + i * 71) * 3) * 1000) / 1000;
      const delay = Math.round(seededRandom(seed + i * 89) * 5 * 1000) / 1000;

      // Random opacity variation - round to 2 decimals
      const minOpacity = Math.round((0.3 + seededRandom(seed + i * 101) * 0.5) * 100) / 100;

      // Random color variation (mostly white with slight variations)
      const colorSeed = seededRandom(seed + i * 113);
      const r = Math.round(100 + seededRandom(seed + i * 127) * 155);
      const g = Math.round(200 + seededRandom(seed + i * 131) * 55);
      const b = Math.round(255);
      const r2 = Math.round(255);
      const g2 = Math.round(220 + seededRandom(seed + i * 139) * 35);
      const b2 = Math.round(150 + seededRandom(seed + i * 149) * 105);
      const r3 = Math.round(240 + seededRandom(seed + i * 157) * 15);
      const g3 = Math.round(240 + seededRandom(seed + i * 163) * 15);
      const alpha = Math.round((0.8 + seededRandom(seed + i * 167) * 0.2) * 100) / 100;

      const color = colorSeed > 0.95
        ? `rgba(${r}, ${g}, ${b}, ${alpha})` // blue-ish
        : colorSeed > 0.9
          ? `rgba(${r2}, ${g2}, ${b2}, ${alpha})` // yellow-ish
          : `rgba(${r3}, ${g3}, 255, ${alpha})`; // white

      newStars.push({
        id: i,
        top,
        left,
        size,
        duration,
        delay,
        minOpacity,
        color,
      });
    }

    // Generate shooting stars
    for (let i = 0; i < shootingStarCount; i++) {
      const startX = Math.round(seededRandom(seed + i * 200) * 10000) / 100;
      const startY = Math.round(seededRandom(seed + i * 210) * 10000) / 100;
      const duration = 2 + Math.round(seededRandom(seed + i * 220) * 2000) / 1000;
      const delay = 0; // No delay - start immediately
      const length = 50 + Math.round(seededRandom(seed + i * 240) * 100) / 100; // Trail length in %
      const speed = 500 + Math.round(seededRandom(seed + i * 250) * 500); // Speed in ms

      newShootingStars.push({
        id: i,
        startX,
        startY,
        duration,
        delay,
        length,
        speed,
      });
    }

    return { stars: newStars, shootingStars: newShootingStars };
  }, [starCount]);

  return (
    <div
      className={`starfield ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        ...style,
      }}
    >
      {/* Background gradient for space depth */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, #02020a 0%, #000000 50%, #000000 100%)',
          zIndex: -1,
        }}
      />

      {stars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="star"
          style={{
            position: 'absolute',
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.color,
            borderRadius: '50%',
            opacity: 0.6,
            animation: `starFlicker ${star.duration}s infinite alternate ${star.delay}s ease-in-out`,
            boxShadow: star.size > 2 ? `0 0 ${Math.round(star.size / 2 * 100) / 100}px ${star.color}` : 'none',
          }}
        />
      ))}

      {shootingStars.map((shootingStar) => (
        <div
          key={`shooting-${shootingStar.id}`}
          className="shooting-star"
          style={{
            position: 'absolute',
            top: `${shootingStar.startY}%`,
            left: `${shootingStar.startX}%`,
            width: '5px',
            height: '5px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            animation: `shootingStar ${shootingStar.duration}s cubic-bezier(0.55, 0, 0.68, 0.18) ${shootingStar.delay}s infinite`,
            boxShadow: `0 0 4px #ffffff`,
          }}
        />
      ))}

      {/* Custom CSS keyframes for flicker and shooting star animations */}
      <style>{`
        @keyframes starFlicker {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          25% {
            opacity: 1;
            transform: scale(1.1);
          }
          50% {
            opacity: 0.6;
            transform: scale(0.9);
          }
          75% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shootingStar {
          0% {
            opacity: 0;
            transform: translate(0, 0);
          }
          5% {
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(50vw, 50vh);
          }
        }
        
        .star {
          animation-timing-function: ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Starfield;