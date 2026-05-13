'use client';

import type { FC, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import NavBar from '@/components/NavBar';
import DrawerMenu from '@/components/DrawerMenu';
import FeatureToggles from '@/components/FeatureToggles';

// Z-index layer scale for consistent stacking
const zBase = 0;
const zContent = 10;
const zSticky = 100;
const zOverlay = 200;
const zToast = 300;

// Root wrapper
const rootStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
  width: '100%',
  maxWidth: '1600px',
  margin: '0 auto',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'hidden',
};

// Header row
const headerRowStyle: CSSProperties = {
  position: 'fixed',
  top: 20,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 'calc((100vw - 1600px) / 2 + 50px)',
  paddingRight: 'calc((100vw - 1600px) / 2 + 50px)',
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
};

// Clock
const clockStyle: CSSProperties = {
  position: 'fixed' as const,
  bottom: '50px',
  right: '50px',
  zIndex: zToast,
};

// Help page
const Help: FC = () => {
  return (
    <div style={rootStyle}>
      {/* Desktop Header row */}
      <NavBar variant="help" title="HELP! NEARBY." showMapPin={true} />

      {/* Feature Toggles */}
      <FeatureToggles bottom={20} right={20} />
    </div>
  );
};

export default Help;
