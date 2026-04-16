'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useTheme } from '@/components/useTheme';

// Animated underline component - animated via whileHover on parent Link
const underlineVariants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1 },
};

const Underline: FC<{ color: string }> = ({ color }) => (
  <motion.div
    variants={underlineVariants}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    style={{
      position: 'absolute',
      bottom: '-10px',
      left: 0,
      width: '100%',
      height: '3px',
      backgroundColor: color,
      transformOrigin: 'left',
    }}
  />
);

const Navbar: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Colors based on theme
  const linkColor = isDark ? '#e8e8e8' : '#111111';

  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '1rem',
        alignItems: 'center',
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
    >
      <Link
        href="/"
        style={{
          textDecoration: 'none',
          padding: '0.75rem 1.25rem',
          fontSize: '1.6rem',
          fontWeight: 600,
          borderRadius: '4px',
          transition: 'all 0.25s ease',
          display: 'inline-block',
          position: 'relative',
          color: linkColor,
        }}
      >
        <motion.div
          style={{ position: 'relative', display: 'inline-block' }}
          initial="hidden"
          whileHover="visible"
        >
          <span style={{ position: 'relative', zIndex: 1 }}>HOME</span>
          <Underline color={linkColor} />
        </motion.div>
      </Link>
      <Link
        href="/resources"
        style={{
          textDecoration: 'none',
          padding: '0.75rem 1.25rem',
          fontSize: '1.6rem',
          fontWeight: 600,
          borderRadius: '4px',
          transition: 'all 0.25s ease',
          display: 'inline-block',
          position: 'relative',
          color: linkColor,
        }}
      >
        <motion.div
          style={{ position: 'relative', display: 'inline-block' }}
          initial="hidden"
          whileHover="visible"
        >
          <span style={{ position: 'relative', zIndex: 1 }}>RESOURCES</span>
          <Underline color={linkColor} />
        </motion.div>
      </Link>
      <Link
        href="/about"
        style={{
          textDecoration: 'none',
          padding: '0.75rem 1.25rem',
          fontSize: '1.6rem',
          fontWeight: 600,
          borderRadius: '4px',
          transition: 'all 0.25s ease',
          display: 'inline-block',
          position: 'relative',
          color: linkColor,
        }}
      >
        <motion.div
          style={{ position: 'relative', display: 'inline-block' }}
          initial="hidden"
          whileHover="visible"
        >
          <span style={{ position: 'relative', zIndex: 1 }}>ABOUT</span>
          <Underline color={linkColor} />
        </motion.div>
      </Link>
      <ThemeToggleButton />
    </motion.div>
  );
};

export default Navbar;
