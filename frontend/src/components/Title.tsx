'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';

const titleContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',  /* Start from center (behind map panel) */
  left: '50%',  /* Center horizontally */
  transform: 'translate(-50%, -50%)',
  width: 'min(90vw, 600px)',
  zIndex: 40,  /* Behind map panel (z-index 50) */
};

const titleWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '600px',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'center',
  color: '#000',
  padding: '0.5rem 0',
  fontSize: '4rem',
};

const titleLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  cursor: 'pointer',
};

const Hero: FC = () => {
  return (
    <motion.div
      style={titleContainerStyle}
      initial={{ opacity: 0, y: '20%' }}  /* Start behind map panel, slide up to center */
      animate={{ opacity: 1, y: '-50%' }}
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
      </div>
    </motion.div>
  );
};

export default Hero;
