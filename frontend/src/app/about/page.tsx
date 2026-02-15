'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Buttons';
import { FiMapPin } from 'react-icons/fi';
import StarWarsIntro from '@/components/StarWarsIntro';

/* ------ Layout styles -------------------------------- */
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: 'rgb(0, 0, 0)',
  borderBottom: '4px solid white',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#ffffff',
  padding: '0.5rem',
  fontSize: 'clamp(2rem, 8vw, 12vh)',
};

const headerIconStyle: React.CSSProperties = {
  fontSize: 'clamp(4rem, 8vw, 10rem)',
  cursor: 'pointer',
};

const linkContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row', // buttons in line horizontally
  gap: '1rem', // space between buttons
  fontSize: '1.25rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  alignItems: 'center', // center buttons vertically
  height: '100%',
  justifyContent: 'center', // center the buttons horizontally in the container
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  minWidth: '8rem',
  color: '#ffffff',
  backgroundColor: '#000000',
  border: '4px solid #f9c700',
  padding: '0.25rem 0',
  textDecoration: 'none',
};

const activeShadowStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)', // distance below the icon (tweak if needed)
  left: 0,
  right: 0,
  margin: '0 auto', // forces horizontal centering
  width: '4rem',
  height: '1.2rem',
  backgroundColor: '#fff', // solid white
  borderRadius: '50%',
};

// New styles for h3 and p elements
const h3Style: React.CSSProperties = {
  fontSize: '1.5rem', // larger font size
  textTransform: 'uppercase', // all caps
  fontWeight: 700,
  marginBottom: '0.5rem',
  textAlign: 'center', // center text
};

const pStyle: React.CSSProperties = {
  fontSize: '1.1rem', // a little larger
  lineHeight: '1.6',
  textAlign: 'center', // center text
};

// New styles for content sections
const contentSectionStyle: React.CSSProperties = {
  padding: '1rem',
  border: '1px solid #fff', // white border
  cursor: 'default',
  marginBottom: '1rem',
  width: '60%', // 60% of container width
  margin: '0 auto', // center the section
};

const contentContainerStyle: React.CSSProperties = {
  padding: '0 2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

// Panel styles (similar to main page)
const panelStyle: React.CSSProperties = {
  backgroundColor: '#000',
  width: '100%',
  overflow: 'hidden', // Remove scrollbars
  borderBottom: '4px solid white',
  position: 'relative', // Attach to bottom of header
  zIndex: 10, // Ensure it appears above content
};

// Create the title animation outside of the Header to prevent re-renders
const TitleAnimation = () => (
  <motion.div
    style={titleStyle}
    initial={{ x: '-100%' }}
    animate={{ x: 0 }}
    transition={{ duration: 0.8, ease: 'easeInOut' }}
    key="title-animation"
  >
    <motion.span
      style={{ display: 'inline-block', cursor: 'pointer' }}
      whileHover={{
        backgroundColor: '#ff0000ff',
        color: '#fff',
        transition: { duration: 0.2 },
      }}
      onClick={() => console.log('HELP! clicked')}
    >
      ABOUT!
    </motion.span>{' '}
    <span>NEARBY.</span>
  </motion.div>
);

// Header component - static part that's always rendered
const Header = ({ panelOpen, handleMapPinClick }) => (
  <header style={headerStyle}>
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Buttons row above title and icon */}
      <div style={linkContainerStyle}>
        <Button style={linkStyle} onClick={() => (window.location.href = '/')}>
          HOME
        </Button>
        <Button
          style={linkStyle}
          onClick={() => (window.location.href = '/help')}
        >
          RESOURCES
        </Button>
        <Button
          style={linkStyle}
          onClick={() => (window.location.href = '/about')}
        >
          ABOUT
        </Button>
      </div>

      {/* Title and icon container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <TitleAnimation />

        {/* Wrapper now carries the same left‑margin as the icon */}
        <div style={{ position: 'relative', marginLeft: '1rem' }}>
          <motion.div
            onClick={handleMapPinClick}
            style={headerIconStyle}
            initial={{ y: -800, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 1.2, ease: 'easeInOut' },
            }}
            whileHover={{
              y: -10,
              transition: { duration: 0.15, ease: 'linear' },
            }}
          >
            <FiMapPin style={{ color: '#fff' }} />
          </motion.div>

          {/* Oval shadow – animated (kept from previous step) */}
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                style={activeShadowStyle}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </header>
);

// Content section - always the same
const Content = () => (
  <section
    id="about-content"
    style={{ backgroundColor: '#000', color: '#fff', padding: '2rem' }}
  >
    <div style={contentContainerStyle}>
      <motion.div
        style={contentSectionStyle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h3 style={h3Style}>What we're building</h3>
        <p style={pStyle}>
          Help! Nearby. is a simple navigator that points people to the next
          best step: live disaster info when available, and curated local
          resources for food, housing, and cash assistance.
        </p>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div
          style={contentSectionStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <h3 style={h3Style}>Our rule</h3>
          <p style={pStyle}>
            If we wouldn't trust it for our own family, it doesn't ship.
          </p>
        </motion.div>
        <motion.div
          style={contentSectionStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        >
          <h3 style={h3Style}>Our focus</h3>
          <p style={pStyle}>
            Clear, local-first guidance. Minimal clicks. No drama.
          </p>
        </motion.div>
        <motion.div
          style={contentSectionStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        >
          <h3 style={h3Style}>How you can help</h3>
          <p style={pStyle}>
            Send resource leads, corrections, or gaps you see—we'll curate and
            improve coverage.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default function AboutPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleMapPinClick = () => {
    setPanelOpen(!panelOpen);
  };

  // Only render motion components on client side to prevent hydration mismatch
  if (!hasMounted) {
    return (
      <main style={{ backgroundColor: '#000', color: '#fff' }}>
        <Header panelOpen={panelOpen} handleMapPinClick={handleMapPinClick} />
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              style={panelStyle}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '50vh', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <div
                style={{
                  padding: '2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <StarWarsIntro
                  onAnimationComplete={() => setAnimationComplete(true)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Content />
      </main>
    );
  }

  return (
    <main style={{ backgroundColor: '#000', color: '#fff' }}>
      <Header panelOpen={panelOpen} handleMapPinClick={handleMapPinClick} />
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            style={panelStyle}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <StarWarsIntro
                onAnimationComplete={() => setAnimationComplete(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Content />
    </main>
  );
}
