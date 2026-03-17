'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Title from '@/components/HelpTitle';
import Navbar from '@/components/Navbar';
import MapPanel from '@/components/MapPanel';
import FlipClock from '@/components/FlipClock';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

// Styles using CSS variables
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  maxWidth: '1600px',
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingTop: '60px',
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

const headerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 20,
  right: 20,
  height: '100px',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 'calc((100vw - 1600px) / 2 + 50px)',
  paddingRight: 'calc((100vw - 1600px) / 2 + 50px)',
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
};

const Home: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Floating Map Panel */}
      <MapPanel />

      {/* Header with Title, FlipClock, and Navbar */}
      <motion.header style={headerStyle}>
        <div style={{ flex: 1, maxWidth: '800px' }}>
          <Title title="HELP! NEARBY." showMapPin={true} />
        </div>
        <FlipClock />
        <Navbar />
      </motion.header>
    </motion.main>
  );
};

export default Home;