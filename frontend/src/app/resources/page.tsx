'use client';

import { useState } from 'react';
import FindResources from '@/components/FindResources';
import type { NormalizedLocation } from '@/lib/location/types';
import ShelterResults from '@/components/results/ShelterResults';
import Button from '@/components/Buttons';
import { FiMapPin } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/* ------ Layout styles -------------------------------- */
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#fff',
  color: '#000',
  paddingBottom: '4rem',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: '#e6ecf1ff',
  borderBottom: '4px solid #000',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',
  padding: '0.5rem',
  fontSize: 'clamp(2rem, 8vw, 12vh)',
};

const headerIconStyle: React.CSSProperties = {
  fontSize: 'clamp(4rem, 8vw, 10rem)',
  cursor: 'pointer',
};

const linkContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '1rem',
  fontSize: '1.25rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  alignItems: 'center',
  height: '100%',
  justifyContent: 'center',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  minWidth: '8rem',
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  padding: '0.25rem 0',
  textDecoration: 'none',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: 'rgb(25, 27, 53)',
  width: '100%',
  overflow: 'hidden', // Changed from 'auto' to 'hidden'
  borderBottom: '4px solid #000',
  marginBottom: 'var(--banner-height)',
  position: 'relative', // Added to position the panel properly
  zIndex: 10, // Ensure it appears above content
};

// Panel content styles
const panelContentStyle: React.CSSProperties = {
  padding: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  flexDirection: 'column',
  textAlign: 'center',
};

const mapPlaceholderStyle: React.CSSProperties = {
  fontSize: 'clamp(2rem, 10vw, 5rem)',
  fontWeight: 700,
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  padding: '1rem 2rem',
  textAlign: 'center',
};

const activeShadowStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)', // distance below the icon (tweak if needed)
  left: 0,
  right: 0,
  margin: '0 auto', // forces horizontal centering
  width: '4rem',
  height: '1.2rem',
  backgroundColor: '#000', // solid black
  borderRadius: '50%',
};

/* =====================
   TYPES
===================== */

type HelpCategory = 'housing' | 'food' | 'cash' | 'disaster';

/* =====================
   PAGE
===================== */

export default function HelpPage() {
  // ✅ STATE LIVES HERE (the brain)
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const showResults = Boolean(category && subcategory);

  /* =====================
     ZIP HANDLER
  ===================== */

  // ZIP handling removed – location will no longer be set here

  /* =====================
     RENDER
  ===================== */

  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header - Match main page style */}
      <header style={headerStyle}>
        <div
          style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
        >
          {/* Buttons row above title and map pin */}
          <div style={linkContainerStyle}>
            <Button
              style={linkStyle}
              onClick={() => (window.location.href = '/')}
            >
              HOME
            </Button>
            <Button
              style={linkStyle}
              onClick={() => (window.location.href = '/resources')}
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

          {/* Title and map pin container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <motion.div
              style={titleStyle}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
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
                RESOURCES!
              </motion.span>{' '}
              <span>NEARBY.</span>
            </motion.div>

            {/* Wrapper now carries the same left‑margin as the icon */}
            <div style={{ position: 'relative', marginLeft: '1rem' }}>
              <motion.div
                onClick={() => setPanelOpen((o) => !o)}
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
                <FiMapPin style={{ color: '#000000' }} />
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

      {/* Sliding panel - added to match main page */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            style={panelStyle}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Panel content - empty as requested */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zip lookup panel removed – no longer needed */}

      {/* 🔹 SHOW GRID (DEFAULT STATE) */}
      {!showResults && (
        <FindResources
          onCategorySelect={(category) => {
            // Convert string to HelpCategory type
            if (
              category === 'housing' ||
              category === 'food' ||
              category === 'cash' ||
              category === 'disaster'
            ) {
              setCategory(category);
            }
          }}
          onSubcategorySelect={setSubcategory}
        />
      )}

      {/* 🔹 CENTERED RESULTS VIEW */}
      {/* Shelter results removed – location no longer available */}
    </motion.main>
  );
}
