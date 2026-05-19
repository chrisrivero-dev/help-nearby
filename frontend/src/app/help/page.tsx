'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import {
  LocationProvider,
  useLocationContext,
} from '@/components/help/LocationContext';
import { HeroSection } from '@/components/help/HeroSection';
import { DashboardTicker } from '@/components/help/DashboardTicker';
import { PanelLayout } from '@/components/help/PanelLayout';
import { AlertPanel } from '@/components/help/AlertPanel';
import { ResourcesPanel } from '@/components/help/ResourcesPanel';
import { TransitPanel } from '@/components/help/TransitPanel';
import { CommunityPanel } from '@/components/help/CommunityPanel';
import { UpdatesPanel } from '@/components/help/UpdatesPanel';

import { useTheme } from '@/components/useTheme';

const HelpDashboard: FC = () => {
  const { theme } = useTheme();
  const { isDemo } = useLocationContext();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for responsive layout
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // NavBar variant for help page
  const navVariant = 'help' as const;
  const navTitle = 'HELP! NEARBY.' as const;

  // Demo disclaimer
  const DemoDisclaimer: FC = () => (
    <motion.div
      key="demo-disclaimer"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        padding: '0.6rem 1rem',
        marginBottom: '1rem',
        background: isDemo ? '#0f0d00' : '#fffbeb',
        border: `1px solid ${isDemo ? '#2a2200' : '#fde68a'}`,
        borderLeft: '3px solid #f59e0b',
      }}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2.5}
        style={{ flexShrink: 0 }}
      >
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L1.268 15a1.5 1.5 0 000 2.732l11.732 7.332c.77.466 1.732.466 2.502 0L23.732 15a1.5 1.5 0 000-2.732L12 2.268a1.5 1.5 0 00-2.732 0L.268 15A1.5 1.5 0 001.268 17.732L12 25" />
      </svg>
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.72rem',
          color: isDemo ? '#a07820' : '#92400e',
          letterSpacing: '0.01em',
          lineHeight: 1.4,
        }}
      >
        Official weather alerts and 90012 Nearby Help resources are
        source-checked. Transit, updates, and community action are still demo.
      </span>
    </motion.div>
  );

  return (
    <motion.main
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        paddingLeft: 'max(2%, 16px)',
        paddingRight: 'max(2%, 16px)',
        paddingTop: '110px',
        paddingBottom: '4rem',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        boxSizing: 'border-box',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32 }}
    >
      {/* NavBar */}
      <NavBar variant={navVariant} title={navTitle} showRadar={true} />

      {/* Hero Section */}
      <HeroSection />

      {/* HeroNetwork is now part of HeroSection */}

      {/* Ticker Strip */}
      <DashboardTicker />

      {/* Demo Disclaimer */}
      <DemoDisclaimer />

      {/* Dashboard Grid - Masonry layout in PanelLayout */}
      <PanelLayout>
        <AlertPanel />
        <ResourcesPanel />
        <CommunityPanel />
        <UpdatesPanel />
        <TransitPanel />
      </PanelLayout>
    </motion.main>
  );
};

const HelpPage: FC = () => {
  return (
    <LocationProvider>
      <HelpDashboard />
    </LocationProvider>
  );
};

export default HelpPage;
