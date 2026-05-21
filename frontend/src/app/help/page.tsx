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
import { NewsTicker } from '@/components/help/NewsTicker';
import { PanelLayout } from '@/components/help/PanelLayout';
import { AlertPanel } from '@/components/help/AlertPanel';
import { ResourcesPanel } from '@/components/help/ResourcesPanel';
import { TransitPanel } from '@/components/help/TransitPanel';
import { CommunityPanel } from '@/components/help/CommunityPanel';
import { UpdatesPanel } from '@/components/help/UpdatesPanel';

import { useTheme } from '@/components/useTheme';

const HelpDashboard: FC = () => {
  const { theme } = useTheme();
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
      <NewsTicker />

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
    <LocationProvider defaultZip="90012">
      <HelpDashboard />
    </LocationProvider>
  );
};

export default HelpPage;
