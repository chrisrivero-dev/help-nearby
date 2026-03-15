'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';

const panelStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  width: 'min(95vw, 1000px)',
  aspectRatio: '21/9',
  border: '2px solid Black',
  borderRadius: '12px',
  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
  zIndex: 50,
  padding: '1.5rem',
  position: 'fixed',
  top: '50%',
  left: '50%',
  translate: '-50% -50%',
};

const MapPanel: FC = () => {
  return (
    <motion.div
      style={panelStyle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
};

export default MapPanel;
