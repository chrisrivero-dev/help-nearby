'use client';

import type { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { ThemeGuard } from '@/components/ThemeGuard';
import NavBar from '@/components/NavBar';
import StarWarsIntro from '@/components/StarWarsIntro';
import MeetTheFounders from '@/components/MeetTheFounders';

// Styles using CSS variables
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  overflowX: 'hidden',
  overflowY: 'hidden',
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
        <NavBar
          variant="about"
          title="ABOUT! NEARBY."
          showRadar={true}
          hideThemeToggle
          showLocation={false}
        />
      </motion.main>
    </ThemeGuard>
  );
};

export default AboutPage;
