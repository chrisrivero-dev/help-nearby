'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';

const titleContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: '60px',
  left: '30px',
  width: 'min(90vw, 600px)',
  zIndex: 40,
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

const ResourcesTitle: FC = () => {
  return (
    <motion.div
      style={titleContainerStyle}
      initial={{ opacity: 0, x: -100, y: 0, zIndex: 2 }}
      animate={{ opacity: 1, x: 0, y: 0, zIndex: 3 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <div style={titleWrapperStyle}>
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
              RESOURCES!
            </motion.span>{' '}
            <span>NEARBY.</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourcesTitle;