'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// Styles
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f5f5f5',
  color: '#000',
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
};

const navContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '2rem',
  right: '2rem',
  display: 'flex',
  gap: '0.5rem',
  zIndex: 100,
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#f5f5f5',
  width: 'min(90vw, 900px)',
  aspectRatio: '4/3',
  border: '2px solid Black',
  borderRadius: '12px',
  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
  zIndex: 50,
  padding: '1.5rem',
  position: 'fixed',
  top: '50%',
  left: '50%',
  translate: '-50% -50%',
};

const titleContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: 'min(90vw, 900px)',
  zIndex: 40,
};

const titleWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '600px',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',
  padding: '0.5rem 0',
  fontSize: '4rem',
  position: 'absolute',
  top: '-3.5rem',
  left: '0',
};

const titleLinkStyle: React.CSSProperties = {
  display: 'inline-block',
  cursor: 'pointer',
};

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  fontWeight: 500,
};

const Home: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Top Right Nav Links */}
      <div style={navContainerStyle}>
        <motion.div
          style={{ ...navLinkStyle, cursor: 'pointer', color: '#000' }}
          whileHover={{
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '4px',
          }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>HOME</Link>
        </motion.div>
        <motion.div
          style={{ ...navLinkStyle, cursor: 'pointer', color: '#000' }}
          whileHover={{
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '4px',
          }}
        >
          <Link href="/resources" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>RESOURCES</Link>
        </motion.div>
        <motion.div
          style={{ ...navLinkStyle, cursor: 'pointer', color: '#000' }}
          whileHover={{
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '4px',
          }}
        >
          <Link href="/about" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>ABOUT</Link>
        </motion.div>
      </div>

      {/* Floating Map Panel */}
      <motion.div
        style={panelStyle}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Title and Map Pin Container - visible and sitting above the panel */}
        <div
          style={{ ...titleContainerStyle, position: 'absolute', top: '-3rem', left: '0', width: '100%' }}
        >
          <div style={{ ...titleWrapperStyle, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={titleStyle}>
              <span
                style={titleLinkStyle}
              >
                <motion.span
                  style={{ display: 'inline-block', cursor: 'pointer' }}
                  whileHover={{
                    backgroundColor: '#ff0000',
                    color: '#fff',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    transition: { duration: 0.1 },
                  }}
                >
                  HELP!
                </motion.span>{' '}
                <span>NEARBY.</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

    </motion.main>
  );
};

export default Home;