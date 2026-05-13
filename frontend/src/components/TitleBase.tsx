'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './useTheme';

interface TitleProps {
  title?: string;
  subtitle?: string;
  showMapPin?: boolean;
}

const titleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minHeight: '100px',
  position: 'relative',
  overflow: 'visible',
};

const titleWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase',
  textAlign: 'left',
  fontSize: 'clamp(2.25rem, 6vw, 3rem)',
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
};

const TitleBase: FC<TitleProps> = ({
  title = 'TITLE! NEARBY.',
  subtitle,
  showMapPin = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const textColor = isDark ? '#e8e8e8' : '#111111';
  const pinStroke = isDark ? '#e8e8e8' : '#111111';
  const pinFill = isDark ? '#d4af37' : '#fbbf24'; // Gold colors for pin fill

  const [isClicked, setIsClicked] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  // Default location: Central Park, NYC
  const DEFAULT_LAT = 40.7829;
  const DEFAULT_LNG = -73.9654;

  const handlePinClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, 300);

    // Try to get user's current location, fall back to Central Park NYC
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          router.push(`/discover?lat=${latitude}&lng=${longitude}`);
        },
        () => {
          // Geolocation failed or denied — use default Central Park location
          router.push(`/discover?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      // Geolocation not supported — use default
      router.push(`/discover?lat=${DEFAULT_LAT}&lng=${DEFAULT_LNG}`);
    }
  };

  // Split title into word parts for highlighting
  const titleParts = title.split(' ');
  const highlightedWord = titleParts[0] || '';
  const remainingTitle = titleParts.slice(1).join(' ');

  // Hover styles for the TITLE! portion
  const titleHighlightStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    textAlign: 'left',
    fontSize: 'clamp(2.25rem, 6vw, 3rem)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition:
      'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
    backgroundColor: isTitleHovered
      ? isDark
        ? '#28a745'
        : '#228B22' // Green background on hover (standardized)
      : 'transparent',
    color: isTitleHovered
      ? '#ffffff' // White text on hover
      : textColor,
    padding: '0 5px',
    borderRadius: '4px',
    transform: isTitleHovered ? 'scale(1.05)' : 'scale(1)',
  };

  const titleNearbyStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    textAlign: 'left',
    fontSize: 'clamp(2.25rem, 6vw, 3rem)',
    whiteSpace: 'nowrap',
    color: textColor,
  };

  return (
    <motion.div
      style={titleContainerStyle}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div style={{ ...titleWrapperStyle }}>
        <div
          style={{
            ...titleContainerStyle,
            display: 'flex',
            alignItems: 'center',
            minHeight: '100px',
          }}
        >
          <div style={{ ...titleStyle, color: textColor }}>
            <span
              onMouseEnter={() => setIsTitleHovered(true)}
              onMouseLeave={() => setIsTitleHovered(false)}
            >
              <span style={titleHighlightStyle}>{highlightedWord}</span>
            </span>{' '}
            <span style={titleNearbyStyle}>{remainingTitle}</span>
          </div>
        </div>
        {showMapPin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handlePinClick}
            whileHover={{
              scale: 1.1,
              y: -5,
              transition: { duration: 0.15, ease: 'easeOut' },
            }}
            whileTap={{
              scale: 0.95,
              y: 2,
              transition: { duration: 0.1, ease: 'easeOut' },
            }}
          >
            <MapPin
              size={60}
              stroke={pinStroke}
              fill={isClicked ? pinFill : 'none'}
              strokeWidth={2}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TitleBase;
