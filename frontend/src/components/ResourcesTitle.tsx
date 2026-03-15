'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useState } from 'react';

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

const titleStyle: React.CSSProperties = {
  fontWeight: 900,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',
  fontSize: '4rem',
  whiteSpace: 'nowrap',
};

const titleLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  cursor: 'pointer',
};

const ResourcesTitle: FC<TitleProps> = ({
  title = 'RESOURCES! NEARBY.',
  subtitle,
  showMapPin = true,
}) => {
  const [isClicked, setIsClicked] = useState(false);
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

  return (
    <motion.div
      style={titleContainerStyle}
      initial={{ opacity: 0, y: -100, zIndex: 2 }}
      animate={{ opacity: 1, y: 0, zIndex: 3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div style={{ ...titleWrapperStyle }}>
        <div style={titleStyle}>
          <span style={titleLinkStyle}>
            <motion.span
              style={{ display: 'inline-block', cursor: 'pointer' }}
              whileHover={{
                backgroundColor: '#ff0000',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                transition: { duration: 0.1 },
              }}
            >
              {highlightedWord}
            </motion.span>{' '}
            <span>{remainingTitle}</span>
          </span>
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
              stroke="#000"
              fill={isClicked ? '#FFD700' : 'none'}
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