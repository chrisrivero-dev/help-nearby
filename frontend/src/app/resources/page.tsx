'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Title from '@/components/ResourcesTitle';
import Navbar from '@/components/Navbar';
import ResourceFinder from '@/components/ResourceFinder';

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f3f3f3',
  color: '#000',
  paddingTop: '120px',
  paddingBottom: '4rem',
  position: 'relative',
  overflowX: 'hidden',
};

const headerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 20,
  right: 20,
  height: '100px',
  zIndex: 100,
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: 'calc((100vw - 1600px) / 2 + 50px)',
  paddingRight: 'calc((100vw - 1600px) / 2 + 50px)',
  boxSizing: 'border-box',
};

const resourceFinderWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  marginTop: '2rem',
};

const resourceFinderContainerStyle: React.CSSProperties = {
  width: 'calc(100vw - 200px)',
  maxWidth: '1600px',
};

const ResourcesPage: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header with Title and Navbar */}
      <motion.header style={headerStyle}>
        <div style={{ flex: 1, maxWidth: '800px' }}>
          <Title showMapPin={true} />
        </div>
        <Navbar />
      </motion.header>

      {/* ResourceFinder - main content, centered with max-width */}
      <div style={resourceFinderWrapperStyle}>
        <div style={resourceFinderContainerStyle}>
          <ResourceFinder />
        </div>
      </div>
    </motion.main>
  );
};

export default ResourcesPage;