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
    transition={{ duration: 0.3, ease: 'easeOut' }}
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '2px',
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
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
<Link href="/" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontWeight: 500, borderRadius: '4px', transition: 'all 0.25s ease', display: 'inline-block', position: 'relative', color: linkColor }}>
  <motion.div
    style={{ position: 'relative', display: 'inline-block' }}
    initial="hidden"
    whileHover="visible"
  >
    <span style={{ position: 'relative', zIndex: 1 }}>HOME</span>
    <Underline color={linkColor} />
  </motion.div>
</Link>
<Link href="/resources" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontWeight: 500, borderRadius: '4px', transition: 'all 0.25s ease', display: 'inline-block', position: 'relative', color: linkColor }}>
  <motion.div
    style={{ position: 'relative', display: 'inline-block' }}
    initial="hidden"
    whileHover="visible"
  >
    <span style={{ position: 'relative', zIndex: 1 }}>RESOURCES</span>
    <Underline color={linkColor} />
  </motion.div>
</Link>
<Link href="/about" style={{ textDecoration: 'none', padding: '0.5rem 1rem', fontWeight: 500, borderRadius: '4px', transition: 'all 0.25s ease', display: 'inline-block', position: 'relative', color: linkColor }}>
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
