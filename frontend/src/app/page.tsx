/* eslint-disable @next/next/no-page-custom-font */
'use client'; // required because we use framer-motion

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { GridOverlay } from '../components/GridOverlay'; // corrected import

/* -------------------------------------------------------------------------- */
/* Layout styles                                                               */
/* -------------------------------------------------------------------------- */
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  minHeight: '100vh',
  width: '100vw',
  overflowY: 'auto',
  backgroundColor: '#ffffff',
  color: '#000',
  padding: '2rem',
};

const headingWrapperStyle: React.CSSProperties = {
  position: 'relative', // positioning context for absolute children & overlay
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000000ff',
  borderRadius: '0.25rem',
  padding: '0.5rem',
  fontSize: 'clamp(2rem, 8vw, 12vh)',
  marginBottom: '2rem',
};

const iconStyle: React.CSSProperties = {
  fontSize: 'clamp(8rem, 15vw, 20rem)',
  marginTop: '2rem',
  // centered via flex container
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
const Home: FC = () => {
  // Toggle this flag to hide the debug grid in production
  const showDebugGrid = true;

  return (
    <motion.main
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* ---------------------------------------------------------------------- */}
      {/* Position‑relative wrapper – holds heading, icon, and optional grid */}
      {/* ---------------------------------------------------------------------- */}
      <div style={headingWrapperStyle}>
        {/* Debug grid – rendered only when `showDebugGrid` is true */}
        {showDebugGrid && (
          <GridOverlay step={100} opacity={0.12} color="#000" />
        )}

        {/* -------------------------------------------------------------- */}
        {/* Animated heading (HELP! / NEARBY.)                               */}
        {/* -------------------------------------------------------------- */}
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            ...titleStyle,
          }}
          initial={false}
          animate={false}
        >
          {/* HELP! – slide‑in */}
          <motion.span
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ whiteSpace: 'nowrap' }}
          >
            HELP!
          </motion.span>

          {/* NEARBY. – delayed linear slide */}
          <motion.span
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 2, ease: 'linear' }}
            style={{ whiteSpace: 'nowrap' }}
          >
            
          NEARBY.
        </motion.span>

        </motion.div>

        {/* -------------------------------------------------------------- */}
        {/* FiMapPin icon – absolutely positioned to avoid layout shift   */}
        {/* -------------------------------------------------------------- */}
        <motion.div
          style={iconStyle}
          initial={{ x: 0, y: -800, opacity: 0 }}
          animate={{ x: 0, y: -300, opacity: 1 }}
          transition={{ duration: 0.8, delay: 2, ease: 'easeInOut' }}
        >
          <FiMapPin style={{ fontSize: '15rem', color: '#000' }} />
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add any additional page content below the wrapper if needed         */}
      {/* ------------------------------------------------------------------ */}
    </motion.main>
  );
};

export default Home;
