'use client';

import type { FC, CSSProperties } from 'react';
import type { Transition } from 'framer-motion';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Title from '@/components/HelpTitle';
import Navbar from '@/components/Navbar';
import MapPanel from '@/components/MapPanel';
import Clock from '@/components/Clock';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

// Apple-quality spring configuration for smooth, physics-based animations
// Higher damping = more resistance, smoother feel
// Lower stiffness = softer, more elastic feel
const createSpringConfig = (
  stiffness: number,
  damping: number,
  mass: number,
) => ({
  type: 'spring' as const,
  stiffness,
  damping,
  mass,
  restDelta: 0.5,
  restSpeed: 0.5,
});

// Styles using CSS variables
const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '1600px',
  margin: '0 auto 150vh auto', // Bottom margin for scroll space
  fontSize: '16px',
  position: 'relative',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2rem',
  width: '80vw',
  maxWidth: '1000px',
  margin: '0 auto',
  position: 'sticky' as const,
  top: 0,
  zIndex: 100,
};

const headerContentStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const mapContainerStyle: CSSProperties = {
  position: 'sticky' as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 200,
  width: '100vw',
  height: '100vh',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
};

const clockStyle: CSSProperties = {
  position: 'fixed' as const,
  bottom: '50px',
  right: '50px',
  zIndex: 9999,
};

const contentSpacingStyle: CSSProperties = {
  height: '200px',
  width: '80vw',
  maxWidth: '1000px',
  margin: '0 auto',
};

const Home: FC = () => {
  const { scrollYProgress } = useScroll();

  // Physics-based scroll progress for smooth animations with inertia
  const smoothScrollProgress = useSpring(
    scrollYProgress,
    createSpringConfig(80, 25, 1),
  );

  // Header slide-up animation with inertia
  const headerTranslateY = useTransform(
    smoothScrollProgress,
    [0, 0.08, 0.15],
    [0, 0, -120],
  );
  const headerOpacity = useTransform(
    smoothScrollProgress,
    [0, 0.06, 0.12],
    [1, 1, 0],
  );

  // Map panel - expands to fill top 50% of viewport with width expansion
  // Width animates from 80vw to 100vw
  const mapWidth = useTransform(
    smoothScrollProgress,
    [0, 0.08, 0.15, 0.25],
    ['80vw', '90vw', '95vw', '100vw'],
  );

  // Map height - transitions from 100vh to 50vh (top half)
  const mapHeight = useTransform(
    smoothScrollProgress,
    [0, 0.05, 0.12, 0.2],
    ['100vh', '70vh', '55vh', '50vh'],
  );

  // Clock - scroll with content
  const clockY = useTransform(
    smoothScrollProgress,
    [0, 0.5, 1],
    [0, -100, -200],
  );
  const clockOpacity = useTransform(
    smoothScrollProgress,
    [0, 0.3, 0.7],
    [1, 1, 0],
  );

  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Header - slides up and fades out on scroll down */}
      <motion.header
        style={{
          ...headerStyle,
          translateY: headerTranslateY,
          opacity: headerOpacity,
        }}
        transition={{ type: 'spring' as const, stiffness: 200, damping: 30 }}
      >
        <motion.div
          style={{
            ...headerContentStyle,
            opacity: headerOpacity,
          }}
          transition={{ type: 'spring' as const, stiffness: 200, damping: 30 }}
        >
          <Title title="HELP! NEARBY." showMapPin={true} />
        </motion.div>
        <Navbar />
      </motion.header>

      {/* 200px space above MapPanel */}
      <motion.div
        style={{
          ...contentSpacingStyle,
          height: '200px',
        }}
        transition={{ type: 'spring' as const, stiffness: 120, damping: 25 }}
      />

      {/* Map Panel - expands to fill top 50% of viewport */}
      <motion.div
        style={{
          ...mapContainerStyle,
        }}
        className="map-panel-container"
      >
        <motion.div
          style={{
            width: mapWidth,
            height: mapHeight,
            transformOrigin: 'center top',
            transform: 'none', // Disable Framer Motion transforms for smoother Leaflet rendering
          }}
          transition={{ type: 'spring' as const, stiffness: 120, damping: 25 }}
        >
          <MapPanel />
        </motion.div>
      </motion.div>

      {/* Clock - fixed at bottom right */}
      <div style={clockStyle}>
        <Clock />
      </div>

      {/* Content spacing after map */}
      <motion.div
        style={{
          ...contentSpacingStyle,
          translateY: clockY,
          opacity: clockOpacity,
        }}
        transition={{ type: 'spring' as const, stiffness: 120, damping: 25 }}
      />

      {/* Placeholder content for the "next page" */}
      <motion.div
        style={{
          width: '80vw',
          maxWidth: '1000px',
          margin: '0 auto 50vh auto',
          padding: '4rem 0',
        }}
      >
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
          Next Page Content
        </h2>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
          This is the content that appears after the map section. The map will
          have expanded to fill the top 50% of the viewport while you continue
          scrolling through this page content.
        </p>
      </motion.div>
    </motion.main>
  );
};

export default Home;
