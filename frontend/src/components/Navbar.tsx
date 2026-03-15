'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  fontWeight: 500,
};

const navbarWidth = 200; // width of the navbar in pixels
const mapPanelWidth = 1000; // min(95vw, 1000px)
const mapPanelPadding = 3; // 1.5rem padding on each side (total 6rem)
const navbarGap = 2; // gap between panels in rem

// Calculate the distance to slide: from center (behind map) to right of map panel
// Start position: center of screen (translate(-50%, -50%) positions left edge at map center)
// End position: right edge of map panel + gap
// MapPanel right edge from center: width/2 + padding
// Plus gap (converted to pixels: gap rem * 16px per rem)
const slideDistance = (mapPanelWidth / 2 + mapPanelPadding * 16) + navbarGap * 16;

const Navbar: FC = () => {
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: `${navbarWidth}px` }}
      initial={{ x: -slideDistance, opacity: 0 }}  /* Start behind map panel, slide right to right of map */
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div
        style={{ ...navLinkStyle, cursor: 'pointer', color: '#000', width: '100%' }}
        whileHover={{
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '4px',
        }}
      >
        <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>HOME</Link>
      </motion.div>
      <motion.div
        style={{ ...navLinkStyle, cursor: 'pointer', color: '#000', width: '100%' }}
        whileHover={{
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '4px',
        }}
      >
        <Link href="/resources" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>RESOURCES</Link>
      </motion.div>
      <motion.div
        style={{ ...navLinkStyle, cursor: 'pointer', color: '#000', width: '100%' }}
        whileHover={{
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '4px',
        }}
      >
        <Link href="/about" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>ABOUT</Link>
      </motion.div>
    </motion.div>
  );
};

export default Navbar;