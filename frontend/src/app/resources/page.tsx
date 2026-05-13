'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import DrawerMenu from '@/components/DrawerMenu';
import ResourceFinder from '@/components/ResourceFinder';
import LanguageToggle from '@/components/LanguageToggle';
import FeatureToggles from '@/components/FeatureToggles';

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  maxWidth: '1600px',
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingTop: '60px',
  paddingBottom: '4rem',
  fontSize: '16px',
  position: 'relative',
  overflowX: 'hidden',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
};

// ResourceFinder container styles matching MapPanel dimensions
const resourceFinderWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  marginTop: '150px',
};

const resourceFinderContainerStyle: React.CSSProperties = {
  width: 'calc(100vw - 200px)',
  maxWidth: '1600px',
  height: 'calc(100vw - 200px) * 9 / 21',
  aspectRatio: '21/9',
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
      <NavBar
        variant="resources"
        title="RESOURCES! NEARBY."
        showMapPin={true}
      />

      {/* Feature Toggles at Bottom Right */}
      <FeatureToggles bottom={20} right={20} />

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
