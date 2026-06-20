'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './useTheme';
import { useI18n } from '@/lib/i18n';
import { useLocationContext } from './help/LocationContext';
import FeatureBar from './FeatureBar';
import Menu from './Menu';

interface TitleProps {
  title?: string;
  subtitle?: string;
  showRadar?: boolean;
  variant?: 'help' | 'resources' | 'about';
  radarRef?: React.RefObject<HTMLDivElement | null>;
  showLocation?: boolean;
  hideThemeToggle?: boolean;
}

const titleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  position: 'relative',
  overflow: 'visible',
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
  showLocation,
  hideThemeToggle,
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

  // Get showLocation prop (default: only show on help page)
  const showLocationValue =
    showLocation !== undefined ? showLocation : variant === 'help';

  // Try to get location context (may not be available on all pages)
  let locationData: any = null;
  try {
    locationData = useLocationContext();
  } catch (e) {
    // Location context not available
    locationData = null;
  }

  const zip = locationData?.zip || '';
  const isValid = locationData?.isValid || false;
  const latitude = locationData?.latitude || 0;
  const longitude = locationData?.longitude || 0;
  const city = locationData?.city || '';
  const state = locationData?.state || '';
  const setLocation = locationData?.setLocation || (() => {});
  const setLocationError = locationData?.setLocationError || (() => {});

  const [isClicked, setIsClicked] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [isNearbyHovered, setIsNearbyHovered] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isLocationHovered, setIsLocationHovered] = useState(false);

  // Location for display, split across two lines: "City, State" then zip.
  const cityStateLine =
    isValid && (city || state) ? [city, state].filter(Boolean).join(', ') : '';
  const zipLine = zip || '';
  const hasLocation = Boolean(cityStateLine || zipLine);

  const beginEditingLocation = () => {
    setLocationInput(zip || cityStateLine || '');
    setIsEditingLocation(true);
  };

  const commitLocation = () => {
    const value = locationInput.trim();
    if (value) setLocation(value);
    setIsEditingLocation(false);
  };

  // Get colors based on variant
  const colors = variantColors[variant] || variantColors['about'];
  const textColor = isDark ? '#e8e8e8' : '#111111';

  const handleRadarClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, 300);

    if (isValid && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      router.push(`/discover?lat=${latitude}&lng=${longitude}`);
      return;
    }

    router.push('/discover');
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
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    color: isNearbyHovered ? '#fbbf24' : textColor,
    /* no shadow - just black outline via text-stroke */
  };

  const handleNearbyClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        },
        () => {
          setLocationError('Could not access your current location.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    } else {
      setLocationError('Geolocation is not supported in this browser.');
    }
  };

  return (
    <motion.div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '8px',
      }}
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <>
        {/* Top row: title left-aligned, toggles then menu pinned to the right end */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <div style={titleContainerStyle}>
            <div style={{ ...titleStyle, color: colors.normalColor }}>
              <span
                onMouseEnter={() => setIsTitleHovered(true)}
                onMouseLeave={() => setIsTitleHovered(false)}
              >
                <span style={titleHighlightStyle}>{highlightedWord}</span>
              </span>{' '}
              <span
                onMouseEnter={() => setIsNearbyHovered(true)}
                onMouseLeave={() => setIsNearbyHovered(false)}
                onClick={handleNearbyClick}
                style={titleNearbyStyle}
              >
                {remainingTitle}
              </span>
            </div>

            {/* Radar sits right next to NEARBY in the title */}
            {showRadar && (
              <motion.div
                ref={radarRef}
                data-radar="source"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onClick={handleRadarClick}
                style={{
                  cursor: 'pointer',
                  flexShrink: 0,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
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
                  {/* Single radiating radar circle — classic radar sweep that fades as it expands.
                      CSS keyframe (radarPulse) runs on the compositor for smooth, jank-free animation. */}
                  <circle
                    cx={30}
                    cy={30}
                    r={6}
                    stroke={isDark ? 'rgba(251,191,36,0.5)' : 'rgba(0,0,0,0.2)'}
                    strokeWidth={1.5}
                    fill="none"
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                      animation: 'radarPulse 2.8s linear infinite',
                      willChange: 'transform, opacity',
                    }}
                  />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Toggles then menu, anchored to the right end */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <FeatureBar hideThemeToggle={hideThemeToggle} />
            <Menu />
          </div>
        </div>

        {/* Second row: location left-aligned, inline "City, State  Zip",
            smaller than the title; click to edit. */}
        {showLocationValue && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isEditingLocation ? (
              <input
                autoFocus
                type="text"
                value={locationInput}
                placeholder="ZIP or City, ST"
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitLocation();
                  if (e.key === 'Escape') setIsEditingLocation(false);
                }}
                onBlur={commitLocation}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  height: '40px',
                  width: '16ch',
                  textAlign: 'center',
                  color: textColor,
                  background: isDark ? '#07080b' : '#ffffff',
                  border: '3px solid #fbbf24',
                  borderRadius: 0,
                  padding: '2px 6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
            ) : (
              <button
                type="button"
                onClick={beginEditingLocation}
                onMouseEnter={() => setIsLocationHovered(true)}
                onMouseLeave={() => setIsLocationHovered(false)}
                title="Edit location"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: '40px',
                  gap: '10px',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '1.4rem',
                  color: hasLocation ? textColor : '#fbbf24',
                  background: 'none',
                  border: `3px solid ${
                    isLocationHovered
                      ? '#fbbf24'
                      : isDark
                        ? '#252a36'
                        : '#d0d4dc'
                  }`,
                  borderRadius: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  padding: '2px 6px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <span>{cityStateLine || 'Set location'}</span>
                {zipLine && (
                  <span style={{ fontSize: '1.15rem', opacity: 0.7 }}>
                    {zipLine}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </>
    </motion.div>
  );
};

export default TitleBase;
