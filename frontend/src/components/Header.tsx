'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Title from './HelpTitle';
import Navbar from './Navbar';

const headerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 20,
  right: 20,
  height: '100px',
  zIndex: 100,
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 'calc((100vw - 1600px) / 2 + 50px)', // Align with Title.tsx positioning
  paddingRight: 'calc((100vw - 1600px) / 2 + 50px)',
  boxSizing: 'border-box',
};

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showMapPin?: boolean;
}

const Header: FC<HeaderProps> = ({ title, subtitle, showMapPin = true }) => {
  return (
    <motion.header
      style={headerStyle}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Left side - Title component */}
      <div style={{ flex: 1, maxWidth: '600px' }}>
        <Title 
          title={title} 
          subtitle={subtitle} 
          showMapPin={showMapPin} 
        />
      </div>
      
      {/* Right side - Navbar component */}
      <div style={{ flexShrink: 0 }}>
        <Navbar />
      </div>
    </motion.header>
  );
};

export default Header;