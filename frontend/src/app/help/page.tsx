'use client';

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { NewsTicker } from '@/components/help/NewsTicker';
import { PanelLayout } from '@/components/help/PanelLayout';
import { AlertPanel } from '@/components/help/AlertPanel';
import { ResourcesPanel } from '@/components/help/ResourcesPanel';
import { CommunityPanel } from '@/components/help/CommunityPanel';
import { UpdatesPanel } from '@/components/help/UpdatesPanel';

const HelpDashboard: FC = () => {
  // Detect mobile for responsive layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // NavBar variant for help page
  const navVariant = 'help' as const;
  const navTitle = 'HELP! NEARBY.' as const;

  // Clear the taller fixed NavBar (title + location rows) with a margin.
  const paddingTop = isMobile ? '190px' : '160px';

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
        paddingTop: paddingTop,
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

      {/* Ticker Strip */}
      <NewsTicker />

      {/* Dashboard Grid - Masonry layout in PanelLayout */}
      <PanelLayout>
        <AlertPanel />
        <ResourcesPanel />
        <CommunityPanel />
        <UpdatesPanel />
      </PanelLayout>
    </motion.main>
  );
};

const HelpPage: FC = () => {
  return <HelpDashboard />;
};

export default HelpPage;
