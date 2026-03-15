'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import AboutTitle from '@/components/AboutTitle';
import Navbar from '@/components/Navbar';
import StarWarsIntro from '@/components/StarWarsIntro';
import { MapProvider } from '@/components/MapPanel';

// Styles
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f5f5f5',
  color: '#000',
  paddingTop: '8rem',
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
};

const Home: FC = () => {
  return (
    <MapProvider>
      <motion.main
        style={pageStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Floating StarWarsIntro Panel */}
        <StarWarsIntro />

        {/* Title in header center */}
        <AboutTitle />

        <Navbar />

      </motion.main>
    </MapProvider>
  );
};

export default Home;
