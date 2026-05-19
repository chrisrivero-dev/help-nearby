'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './useTheme';
import { useI18n } from '@/lib/i18n';

interface TitleProps {
  title?: string;
  subtitle?: string;
  showRadar?: boolean;
  variant?: 'help' | 'resources' | 'about';
  radarRef?: React.RefObject<HTMLDivElement | null>;
}

const titleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
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
  fontSize: 'clamp(1.5rem, 4.5vw, 3rem)',
  whiteSpace: 'nowrap',
  lineHeight: 1.2,
};

interface VariantColors {
  normalColor: string;
  hoverBg: string;
  hoverColor: string;
}

const variantColors: Record<string, VariantColors> = {
  help: {
    normalColor: '#dc3545',
    hoverBg: '#dc3545',
    hoverColor: '#ffffff',
  },
  resources: {
    normalColor: '#007bff',
    hoverBg: '#007bff',
    hoverColor: '#ffffff',
  },
  about: {
    normalColor: '#28a745',
    hoverBg: '#28a745',
    hoverColor: '#ffffff',
  },
};

const TitleBase: FC<TitleProps> = ({
  title: customTitle,
  subtitle,
  showRadar = true,
  variant = 'about',
  radarRef: externalRadarRef,
}) => {
  const t = useI18n();
  // Use external ref if provided, otherwise create internal ref
  const internalRadarRef = useRef<HTMLDivElement | null>(null);
  const radarRef = externalRadarRef ?? internalRadarRef;
  const { theme } = useTheme();

  // Get default title based on variant when no custom title is provided
  // Type assertion to ensure we only access string properties
  const getDefaultTitle = (): string => {
    if (customTitle) return customTitle;
    const titleKey = `${variant}Nearby` as keyof typeof t;
    const titleValue = t[titleKey];
    // Fallback to helpNearby if the value is a function (type mismatch)
    if (typeof titleValue === 'string') return titleValue;
    return t.helpNearby || 'HELP! NEARBY';
  };
  const title = getDefaultTitle();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [isClicked, setIsClicked] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  // Get colors based on variant
  const colors = variantColors[variant] || variantColors['about'];
  const textColor = isDark ? '#e8e8e8' : '#111111';

  // Default location: Central Park, NYC
  const DEFAULT_LAT = 40.7829;
  const DEFAULT_LNG = -73.9654;

  const handleRadarClick = () => {
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
    fontSize: 'clamp(1.5rem, 4.5vw, 3rem)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition:
      'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
    backgroundColor: isTitleHovered ? colors.hoverBg : 'rgba(0, 0, 0, 0)',
    color: isTitleHovered ? colors.hoverColor : textColor,
    padding: '0 5px',
    borderRadius: '4px',
    transform: isTitleHovered ? 'scale(1.05)' : 'scale(1)',
  };

  const titleNearbyStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    textAlign: 'left',
    fontSize: 'clamp(1.5rem, 4.5vw, 3rem)',
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
        <div style={titleContainerStyle}>
          <div style={{ ...titleStyle, color: colors.normalColor }}>
            <span
              onMouseEnter={() => setIsTitleHovered(true)}
              onMouseLeave={() => setIsTitleHovered(false)}
            >
              <span style={titleHighlightStyle}>{highlightedWord}</span>
            </span>{' '}
            <span style={titleNearbyStyle}>{remainingTitle}</span>
          </div>
        </div>
        {showRadar && (
          <motion.div
            ref={radarRef}
            data-radar="source"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleRadarClick}
            style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }}
          >
            {/* Pulsing radar animation */}
            <svg width={60} height={60} viewBox="0 0 60 60" fill="none">
              {/* Solid center dot — gold fill with dark border */}
              <circle
                cx={30}
                cy={30}
                r={6}
                fill="#fbbf24"
                stroke={isDark ? '#1e1e1e' : '#000000'}
                strokeWidth={2}
              />
              {/* Single radiating radar circle — classic radar sweep that fades as it expands */}
              <motion.circle
                key="radar-ring"
                cx={30}
                cy={30}
                r={6}
                stroke={isDark ? 'rgba(251,191,36,0.5)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={1.5}
                fill="none"
                style={{ transformOrigin: '30px 30px' }}
                animate={{
                  opacity: [0.8, 0],
                  scale: [0.9, 3.8],
                }}
                transition={{
                  duration: 2.8,
                  ease: 'linear',
                  repeat: Infinity,
                }}
              />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TitleBase;
