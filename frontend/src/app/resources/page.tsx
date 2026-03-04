'use client';

import { useState } from 'react';
import Button from '@/components/Buttons';
import { FiMapPin } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/* ------ Layout styles -------------------------------- */
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f3f3f3',
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
   TYPES & DATA
===================== */

type HelpCategory = 'housing' | 'food' | 'safety' | 'finance';

const SUB_OPTIONS: Record<HelpCategory, string[]> = {
  housing:  ['Emergency Shelter', 'Rent Assistance', 'Temporary Housing'],
  food:     ['Food Banks', 'Free Meals', 'SNAP Enrollment'],
  safety:   ['Domestic Violence Help', 'Emergency Services', 'Crisis Lines'],
  finance:  ['Cash Assistance', 'Utility Help', 'Debt Counseling'],
};

/* =====================
   PAGE
===================== */

export default function HelpPage() {
  // ✅ STATE LIVES HERE (the brain)
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

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

      {/* ── Main content (max-width container) ─────────────────── */}
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 2rem' }}>

        {/* ── Category cards ──────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2rem' }}>
          {(Object.keys(SUB_OPTIONS) as HelpCategory[]).map((cat) => {
            const isActive = category === cat;
            return (
              <div key={cat} style={{ position: 'relative', flex: 1, height: '80px' }}>
                {/* Brutalist offset shadow */}
                <div style={{
                  position: 'absolute', backgroundColor: '#000',
                  width: '100%', height: '100%',
                  zIndex: 0, left: '-5px', top: '5px',
                }} />
                <button
                  onClick={() => { setCategory(isActive ? null : cat); setSubcategory(null); }}
                  aria-pressed={isActive}
                  style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', height: '100%',
                    backgroundColor: isActive ? '#000' : '#fff',
                    color: isActive ? '#fff' : '#000',
                    border: `${isActive ? '4px' : '3px'} solid #000`,
                    boxShadow: isActive ? 'none' : undefined,
                    fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Sub-options + preview panel ─────────────────────── */}
        <AnimatePresence initial={false}>
          {category && (
            <motion.div
              key={category}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', marginTop: '1.25rem' }}
            >
              <div style={{ border: '3px solid #000', backgroundColor: '#fff', display: 'flex' }}>

                {/* Left: sub-option buttons */}
                <div style={{
                  width: '220px', flexShrink: 0,
                  borderRight: '3px solid #000',
                  backgroundColor: '#f3f3f3',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <p style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', padding: '0.75rem 1rem',
                    borderBottom: '2px solid #000', margin: 0, color: '#666',
                  }}>
                    {category.toUpperCase()} — SELECT TOPIC
                  </p>
                  {SUB_OPTIONS[category].map((sub) => {
                    const isSubActive = subcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => setSubcategory(sub)}
                        aria-pressed={isSubActive}
                        style={{
                          padding: '0.85rem 1rem', textAlign: 'left',
                          fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.03em',
                          cursor: 'pointer', border: 'none', borderBottom: '1px solid #000',
                          backgroundColor: isSubActive ? '#000' : 'transparent',
                          color: isSubActive ? '#fff' : '#000',
                          fontFamily: 'inherit',
                        }}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>

                {/* Right: results preview */}
                <div style={{
                  flex: 1, padding: '1.5rem', minHeight: '200px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                  <AnimatePresence initial={false} mode="wait">
                    {subcategory ? (
                      <motion.div
                        key={subcategory}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p style={{
                          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                          textTransform: 'uppercase', color: '#666', marginBottom: '0.5rem',
                        }}>
                          PREVIEW
                        </p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 }}>
                          Showing local {category.charAt(0).toUpperCase() + category.slice(1)} resources for{' '}
                          <span style={{ borderBottom: '3px solid #000' }}>{subcategory}</span>.
                        </p>
                        <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#555' }}>
                          API connection coming soon — results will appear here.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', color: '#bbb' }}
                      >
                        <p style={{
                          fontSize: '1rem', fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          ← Select a topic
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end max-width container */}
    </motion.main>
  );
}
