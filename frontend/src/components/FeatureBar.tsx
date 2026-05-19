'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Clock from './Clock';
import { ThemeToggleButton } from './ThemeToggleButton';
import LanguageToggle from './LanguageToggle';

interface FeatureBarProps {
  hideThemeToggle?: boolean;
}

const FeatureBar: FC<FeatureBarProps> = ({ hideThemeToggle = false }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  return (
    <div
      style={{
        ...containerStyle,
        justifyContent: 'center',
      }}
    >
      {/* Theme Toggle Button */}
      {!hideThemeToggle && <ThemeToggleButton />}

      {/* Clock */}
      <Clock />

      {/* Language Toggle */}
      <LanguageToggle />
    </div>
  );
};

export default FeatureBar;
