'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { ThemeToggleButton } from './ThemeToggleButton';
import Clock from './Clock';
import LanguageToggle from './LanguageToggle';

interface FeatureTogglesProps {
  /**
   * Position offset from the bottom of the viewport
   * @default 20
   */
  bottom?: number;
  /**
   * Position offset from the right of the viewport
   * @default 20
   */
  right?: number;
  /**
   * Whether to animate the component on mount
   * @default true
   */
  animateMount?: boolean;
}

/**
 * Feature Toggles Component
 * A container for theme and clock controls positioned at the bottom right of the viewport
 */
const FeatureToggles: FC<FeatureTogglesProps> = ({
  bottom = 20,
  right = 12,
  animateMount = true,
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: `${bottom}px`,
    right: `${right}px`,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0',
  };

  const mountTransition = animateMount
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: 'easeOut' as const },
      }
    : {};

  return (
    <motion.div style={containerStyle} {...mountTransition}>
      <LanguageToggle />
      <ThemeToggleButton />
      <Clock />
    </motion.div>
  );
};

export default FeatureToggles;
