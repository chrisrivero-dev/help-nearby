'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Title from '@/components/Title';
import MapPanel from '@/components/MapPanel';

// Styles
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f5f5f5',
  color: '#000',
  paddingTop: '8rem',  /* Space for header */
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
};

const Home: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Top Left Nav Links */}
      <Header />

      {/* Title in header center */}
      <Title />

      {/* Floating Map Panel */}
      <MapPanel />

    </motion.main>
  );
};

export default Home;