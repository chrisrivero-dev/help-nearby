'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import ResourceFinder from '@/components/ResourceFinder';

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: 'calc(100vw - 4%)',
  maxWidth: '1600px',
  margin: '0 2%',
  paddingTop: '60px',
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

const ResourcesPage: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header with Title */}
      <NavBar variant="resources" title="RESOURCES! NEARBY." showRadar={true} />

      {/* ResourceFinder - main content */}
      <ResourceFinder />
    </motion.main>
  );
};

export default ResourcesPage;
