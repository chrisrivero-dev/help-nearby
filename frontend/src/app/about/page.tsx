'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { ThemeGuard } from '@/components/ThemeGuard';
import NavBar from '@/components/NavBar';
import DrawerMenu from '@/components/DrawerMenu';
import StarWarsIntro from '@/components/StarWarsIntro';

// Styles using CSS variables
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  overflowX: 'hidden',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

const AboutPage: FC = () => {
  return (
    <ThemeGuard theme="dark">
      <motion.main
        style={pageStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* StarWarsIntro - starts below viewport, scrolls up, fades out */}
        <StarWarsIntro />

        {/* Header with Title - overlaying the page */}
        <NavBar variant="about" title="ABOUT! NEARBY." showMapPin={true} />
      </motion.main>
    </ThemeGuard>
  );
};

export default AboutPage;
