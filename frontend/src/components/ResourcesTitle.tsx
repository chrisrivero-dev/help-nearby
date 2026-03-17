'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
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
  height: '100px',
  position: 'relative',
  overflow: 'visible',
};

const titleWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const titleLinkStyle: React.CSSProperties = {
  display: 'inline-block',
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase',
  textAlign: 'left',
  fontSize: '4rem',
  whiteSpace: 'nowrap',
};

const ResourcesTitle: FC<TitleProps> = ({
  title = 'RESOURCES! NEARBY.',
  subtitle,
  showMapPin = true,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const textColor = isDark ? '#e8e8e8' : '#111111';
  const pinStroke = isDark ? '#e8e8e8' : '#111111';
  const pinFill = isDark ? '#d4af37' : '#fbbf24';  // Gold colors for pin fill
  
  const [isClicked, setIsClicked] = useState(false);
  const [isResourcesHovered, setIsResourcesHovered] = useState(false);
  const handlePinClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, 300);
  };

  // Split title into word parts for highlighting
  const titleParts = title.split(' ');
  const highlightedWord = titleParts[0] || '';
  const remainingTitle = titleParts.slice(1).join(' ');

  // Hover styles for the RESOURCES! portion
  const titleResourcesStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    textAlign: 'left',
    fontSize: '4rem',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
    backgroundColor: isResourcesHovered 
      ? (isDark ? '#28a745' : '#228B22')  // Green background on hover
      : 'transparent',
    color: isResourcesHovered 
      ? '#ffffff'  // White text on hover
      : textColor,
    padding: '0 5px',
    borderRadius: '4px',
    transform: isResourcesHovered ? 'scale(1.05)' : 'scale(1)',
  };

  const titleNearbyStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    textTransform: 'uppercase',
    textAlign: 'left',
    fontSize: '4rem',
    whiteSpace: 'nowrap',
    color: textColor,
  };

  return (
    <motion.div
      style={titleContainerStyle}
      initial={{ opacity: 0, y: -100, zIndex: 2 }}
      animate={{ opacity: 1, y: 0, zIndex: 3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div style={{ ...titleWrapperStyle }}>
        <div style={{ ...titleContainerStyle, display: 'flex', alignItems: 'center', height: '100px' }}>
          <div style={{ ...titleStyle, color: textColor }}>
            <span onMouseEnter={() => setIsResourcesHovered(true)} onMouseLeave={() => setIsResourcesHovered(false)}>
              <span style={titleResourcesStyle}>{highlightedWord}</span>
            </span>
            {' '}
            <span style={titleNearbyStyle}>{remainingTitle}</span>
          </div>
        </div>
        {showMapPin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1, delay: 0 }}
            onClick={handlePinClick}
            whileHover={{
              scale: 1.1,
              y: -5,
              transition: { duration: 0.1, ease: 'easeOut' },
            }}
            whileTap={{
              scale: 0.95,
              y: 2,
              transition: { duration: 0.2, ease: 'easeOut' },
            }}
          >
            <MapPin
              size={80}
              stroke={pinStroke}
              fill={isClicked ? pinFill : 'none'}
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ResourcesTitle;