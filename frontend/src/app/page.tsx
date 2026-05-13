'use client';

import type { FC, CSSProperties } from 'react';
import { useTheme } from '@/components/useTheme';
import Title from '@/components/HelpTitle';
import Navbar from '@/components/Navbar';
import Clock from '@/components/Clock';
import MapPanel from '@/components/MapPanel';

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

const Home: FC = () => {
  const { theme } = useTheme();

  return (
    <div style={rootStyle}>
      {/* Header row */}
      <div style={headerRowStyle}>
        <Title title="HELP! NEARBY." showMapPin={true} />
        <Navbar />
      </div>

      {/* Map Panel — centered floating card, takes 60% height */}
      <div
        style={{
          width: '85vw',
          maxWidth: '900px',
          height: '60vh',
          borderRadius: '12px',
          boxShadow:
            theme === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.8)'
              : '0 20px 60px rgba(0, 0, 0, 0.3)',
          margin: '20vh auto',
          position: 'relative',
        }}
        className="map-panel-container"
      >
        <MapPanel />
      </div>

      {/* Clock */}
      <div style={clockStyle}>
        <Clock />
      </div>
    </div>
  );
};

export default Home;
