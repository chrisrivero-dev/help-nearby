'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  fontWeight: 500,
  display: 'inline-block',
};

const navbarContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '1rem',
};

const Navbar: FC = () => {
  return (
    <motion.div
      style={navbarContainerStyle}
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
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
    </motion.div>
  );
};

export default Navbar;