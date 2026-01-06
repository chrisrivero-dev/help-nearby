/* eslint-disable @next/next/no-page-custom-font */
'use client'; // required because we use framer-motion

import type { FC } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMapPin } from 'react-icons/fi';

/* -------------------------------------------------------------------------- */
/* Layout styles                                                               */
/* -------------------------------------------------------------------------- */

/* Container for the whole page – let the body decide the max-width */
const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',

  minHeight: '100vh',

  width: '100%',
  maxWidth: '1200px',
  margin: '0 auto',

  padding: '2rem',

  backgroundColor: '#ffffff',
  color: '#000000',

  position: 'relative', // REQUIRED for z-index layering
  overflowY: 'auto',
};

const headingWrapperStyle: React.CSSProperties = {
  position: 'relative', // anchor for GridOverlay
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  zIndex: 1, // content above grid
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',

  borderRadius: '0.25rem',
  padding: '0.5rem',

  fontSize: 'clamp(2rem, 8vw, 12vh)',
  marginBottom: '2rem',
};

const iconStyle: React.CSSProperties = {
  fontSize: 'clamp(8rem, 15vw, 20rem)',
  marginTop: '2rem',
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Heading / Icon / Grid wrapper                                      */}
      {/* ------------------------------------------------------------------ */}
      <div style={headingWrapperStyle}>
        {/* -------------------------------------------------------------- */}
        {/* Animated heading: HELP! NEARBY.                                */}
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
          <motion.span
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ whiteSpace: 'nowrap' }}
          >
            HELP!
          </motion.span>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 2, ease: 'linear' }}
            style={{ whiteSpace: 'nowrap' }}
          >
            NEARBY.
          </motion.span>
        </motion.div>

        {/* -------------------------------------------------------------- */}
        {/* Map pin CTA                                                    */}
        {/* -------------------------------------------------------------- */}
        <Link href="/help">
          <motion.div
            style={iconStyle}
            initial={{ y: -800, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2, ease: 'easeInOut' }}
          >
            <FiMapPin />
          </motion.div>
        </Link>
      </div>
    </motion.main>
  );
};

export default Home;
