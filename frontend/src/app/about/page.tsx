'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Title from '@/components/HelpTitle';
import Navbar from '@/components/Navbar';
import StarWarsIntro from '@/components/StarWarsIntro';

// Styles
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f5f5f5',
  color: '#000',
  paddingTop: '120px',
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
};

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
  paddingLeft: 'calc((100vw - 1600px) / 2 + 50px)',
  paddingRight: 'calc((100vw - 1600px) / 2 + 50px)',
  boxSizing: 'border-box',
};

const AboutPage: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Floating StarWarsIntro Panel */}
      <StarWarsIntro />

      {/* Header with Title and Navbar */}
      <motion.header style={headerStyle}>
        <div style={{ flex: 1, maxWidth: '600px' }}>
          <Title title="ABOUT! NEARBY." showMapPin={true} />
        </div>
        <Navbar />
      </motion.header>

    </motion.main>
  );
};

export default AboutPage;