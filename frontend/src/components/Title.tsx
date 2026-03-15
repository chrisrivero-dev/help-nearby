'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useRef, useState } from 'react';
import { useMapContext } from '@/components/MapPanel';

const titleContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '60px',
  left: '30px',
  width: 'min(90vw, 600px)',
  zIndex: 40,  /* Behind map panel (z-index 50) */
};

const titleWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '600px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',
  padding: '0.5rem 0',
  fontSize: '4rem',
};

const titleLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  cursor: 'pointer',
};

const Hero: FC = () => {
  const [isClicked, setIsClicked] = useState(false);
  const { setZoomTarget } = useMapContext();

  const handlePinClick = () => {
    setIsClicked(true);
    
    // Change the pin color to gold
    setTimeout(() => {
      setIsClicked(false);
    }, 300);
    
    // Move map to NYC zip code 10001 (Lat: 40.748, Lng: -73.985)
    setZoomTarget(40.748, -73.985, 12);
  };

  return (
    <motion.div
      style={titleContainerStyle}
      initial={{ opacity: 0, x: -100, y: 0, zIndex: 2 }}
      animate={{ opacity: 1, x: 0, y: 0, zIndex: 3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div style={{ ...titleWrapperStyle }}>
        <div style={titleStyle}>
          <span
            style={titleLinkStyle}
          >
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
              HELP!
            </motion.span>{' '}
            <span>NEARBY.</span>
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, delay: 0 }}
          onClick={handlePinClick}
          whileHover={{
            scale: 1.1,
            y: -5, // slight lift on hover
            transition: { duration: 0.1, ease: 'easeOut' },
          }}
          whileTap={{
            scale: 0.95,
            y: 2, // soft landing effect when clicked
            transition: { duration: 0.2, ease: 'easeOut' },
          }}
        >
          <MapPin 
            size={70} 
            stroke="#000" // always black stroke
            fill={isClicked ? "#FFD700" : "none"} // gold fill when clicked, none by default
            strokeWidth={2}
            style={{ cursor: 'pointer' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Hero;