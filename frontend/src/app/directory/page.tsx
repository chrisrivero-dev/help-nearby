'use client';

import type { CSSProperties, FC } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import Directory from '@/components/Directory';

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  maxWidth: '1600px',
  margin: '0 auto',
  paddingTop: '80px',
  paddingBottom: '4rem',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
  boxSizing: 'border-box',
};

const DirectoryPage: FC = () => {
  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <NavBar
        variant="resources"
        title="DIRECTORY! NEARBY."
        showRadar={true}
        showLocation={false}
      />
      <Directory />
    </motion.main>
  );
};

export default DirectoryPage;
