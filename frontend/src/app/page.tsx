'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Title from '@/components/HelpTitle';
import Navbar from '@/components/Navbar';
import MapPanel from '@/components/MapPanel';
import Clock from '@/components/Clock';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

// Styles using CSS variables
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  width: '100%',
  maxWidth: '1600px',
  margin: '20px auto',
  fontSize: '16px',
  position: 'relative',
  overflowY: 'auto',
  overflowX: 'hidden',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2rem',
  width: '80vw',
  maxWidth: '1000px',
  margin: '0 auto 2rem auto',
  position: 'relative',
};

const headerSpacingStyle: React.CSSProperties = {
  height: '200px',
  width: '80vw',
  maxWidth: '1000px',
  margin: '0 auto',
};

const Home: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header - drops from top */}
      <motion.header
        style={headerStyle}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Title title="HELP! NEARBY." showMapPin={true} />
        </div>
        <Navbar />
      </motion.header>

      {/* Map Panel - slides up from bottom */}
      <div style={headerSpacingStyle}></div>
      <MapPanel />

      {/* Floating Clock at Bottom Right */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
        style={{
          position: 'fixed',
          bottom: '50px',
          right: '50px',
          zIndex: 9999,
        }}
      >
        <Clock />
      </motion.div>
    </motion.main>
  );
};

export default Home;
