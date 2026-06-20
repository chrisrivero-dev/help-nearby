'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Clock from './Clock';
import { ThemeToggleButton } from './ThemeToggleButton';
import LanguageToggle from './LanguageToggle';

interface FeatureBarProps {
  hideThemeToggle?: boolean;
  bgColor?: string;
  vertical?: boolean;
  itemStyle?: React.CSSProperties;
  gap?: React.CSSProperties['gap'];
}

const FeatureBar: FC<FeatureBarProps> = ({
  hideThemeToggle = false,
  bgColor = '',
  vertical = false,
  itemStyle,
  gap,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    alignItems: 'center',
    gap: gap ?? (vertical ? '12px' : '16px'),
    padding: vertical ? '0' : '4px 8px',
    borderRadius: '4px',
    backgroundColor: bgColor,
  };

  return (
    <div
      style={{
        ...containerStyle,
        justifyContent: 'center',
      }}
    >
      {/* Theme Toggle Button */}
      {!hideThemeToggle && (
        <div style={itemStyle}>
          <ThemeToggleButton />
        </div>
      )}

      {/* Clock */}
      <div style={itemStyle}>
        <Clock />
      </div>

      {/* Language Toggle */}
      <div style={itemStyle}>
        <LanguageToggle />
      </div>
    </div>
  );
};

export default FeatureBar;
