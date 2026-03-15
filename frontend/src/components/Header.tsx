'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const headerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '8rem',
  zIndex: 100,
  backgroundColor: '#f5f5f5',
};

// Position Navbar at the center of the screen (behind MapPanel initially)
// It will slide right from behind the map panel
const navContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

const Header: FC = () => {
  return (
    <motion.header
      style={headerStyle}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Nav links slide from behind MapPanel to its right */}
      <nav style={navContainerStyle}>
        <Navbar />
      </nav>
    </motion.header>
  );
};

export default Header;
