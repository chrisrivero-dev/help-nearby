'use client';

import { useState } from 'react';
import HelpFlow from '@/components/HelpFlow';
import { normalizeLocation } from '@/lib/location/normalizeLocation';
import type { NormalizedLocation } from '@/lib/location/types';
import ShelterResults from '@/components/results/ShelterResults';
import Button from '@/components/Buttons';
import { FiMapPin } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/* ------ Layout styles -------------------------------- */
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
  flexDirection: 'column', // stack buttons vertically
  gap: '1rem', // space between stacked buttons
  fontSize: '1.25rem',
  marginLeft: 'auto',
  alignItems: 'flex-end',
  height: '100%',
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
  backgroundColor: '#dcc3c3ff',
  width: '100%',
  overflow: 'auto',
  borderBottom: '4px solid #000',
  marginBottom: 'var(--banner-height)',
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
  const [zip, setZip] = useState<string | null>(null);
  const [location, setLocation] = useState<NormalizedLocation | null>(null);
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const showResults = Boolean(location && category && subcategory);

  /* =====================
     ZIP HANDLER
  ===================== */

  function handleZipSubmit(inputZip: string) {
    const resolved = normalizeLocation(inputZip);

    if (!resolved.isValid) {
      alert('Please enter a valid ZIP code');
      return;
    }

    setZip(inputZip);
    setLocation(resolved);
    localStorage.setItem('helpNearbyLocation', JSON.stringify(resolved));
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <div>
      {/* Header - Match main page style */}
      <header style={headerStyle}>
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
            HELP!
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
            <FiMapPin />
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

        <div style={linkContainerStyle}>
          <Button
            style={linkStyle}
            onClick={() => (window.location.href = '/')}
          >
            HOME
          </Button>
          <Button
            style={linkStyle}
            onClick={() => (window.location.href = '/about')}
          >
            ABOUT
          </Button>
          <Button
            style={linkStyle}
            onClick={() => (window.location.href = '/help')}
          >
            RESOURCES
          </Button>
        </div>
      </header>

      <main className="min-h-screen bg-neutral-50 flex justify-center">
        <div className="w-full max-w-6xl px-6">
          {/* 🔹 SHOW GRID (DEFAULT STATE) */}
          {!showResults && (
            <HelpFlow
              locationReady={!!location}
              onZipSubmit={handleZipSubmit}
              onCategorySelect={setCategory}
              onSubcategorySelect={setSubcategory}
            />
          )}

          {/* 🔹 CENTERED RESULTS VIEW */}
          {showResults &&
            category === 'housing' &&
            subcategory === 'shelter' && (
              <div className="min-h-[70vh] flex items-start justify-center mt-12">
                <div className="w-full max-w-3xl bg-white border rounded-lg shadow-lg p-6">
                  <h3 className="text-2xl font-semibold mb-2">
                    Shelter options near {location!.city}, {location!.stateCode}
                  </h3>

                  <p className="text-sm text-gray-600 mb-6">
                    Showing emergency shelter options based on your ZIP code.
                  </p>

                  <ShelterResults location={location!} />

                  <button
                    className="mt-6 text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      setCategory(null);
                      setSubcategory(null);
                    }}
                  >
                    ← Back to options
                  </button>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
