'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import ResourcesTitle from '@/components/ResourcesTitle';
import ResourceFinder from '@/components/ResourceFinder';
import Navbar from '@/components/Navbar';

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f3f3f3',
  color: '#000',
  paddingBottom: '4rem',
  position: 'relative',
  overflowX: 'hidden',
};

const ResourcesPage: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Navbar at top right */}
      <Navbar />

      {/* Title positioned where it is on main page */}
      <ResourcesTitle />

      {/* ResourceFinder - main content */}
      <ResourceFinder />
    </motion.main>
  );
};

export default ResourcesPage;
