'use client';

import type { FC, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import Title from '@/components/HelpTitle';
import DrawerMenu from '@/components/DrawerMenu';

import FeatureToggles from '@/components/FeatureToggles';
import { useState } from 'react';

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
  top: 0,
  left: 20,
  right: 20,
  height: '100px',
  zIndex: zSticky,
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

// Home page - NavMenu manages its own state internally
const Home: FC = () => {
  const { theme } = useTheme();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const handleSearchToggle = () => setSearchModalOpen(!searchModalOpen);
  const handleHomeClick = () => (window.location.href = '/');
  const handleResourcesClick = () => (window.location.href = '/resources');
  const handleAboutClick = () => (window.location.href = '/about');

  return (
    <div style={rootStyle}>
      {/* Desktop Header row */}
      <div style={headerRowStyle}>
        <Title title="HELP! NEARBY." showMapPin={true} />
        {/* NavMenu positioned in top-right corner */}
        <DrawerMenu top={20} right={20} />
      </div>

      {/* Feature Toggles */}
      <FeatureToggles bottom={50} right={50} />
    </div>
  );
};

export default Home;
