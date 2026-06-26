'use client';

import type { CSSProperties, FC, ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';

interface NeoPanelProps {
  children: ReactNode;
  className?: string;
  /** Extra styles merged onto the front (content) panel. */
  style?: CSSProperties;
}

/**
 * Neo-brutalism panel wrapper.
 *
 * A static "back panel" sits directly behind the front panel; on hover the
 * front panel lifts straight up (no horizontal shift), revealing the bold
 * offset shadow below it. When tiled flush with no gaps, the hovered wrapper
 * raises its stacking so the revealed offset is drawn over the panel below.
 */
export const NeoPanel: FC<NeoPanelProps> = ({ children, className, style }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hovered, setHovered] = useState(false);

  const borderColor = isDark ? '#404040' : '#111111';
  const shadowColor = isDark ? '#000000' : '#111111';
  const panelBg = isDark ? '#121212' : '#ffffff';

  return (
    <motion.div
      className={className}
      style={{
        position: 'relative',
        breakInside: 'avoid',
        height: 'fit-content',
        zIndex: hovered ? 3 : 1,
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Back panel - static offset shadow, revealed on hover */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          background: shadowColor,
          border: `2px solid ${shadowColor}`,
        }}
      />
      {/* Front panel - lifts straight up on hover */}
      <motion.div
        style={{
          background: panelBg,
          border: `2px solid ${borderColor}`,
          position: 'relative',
          zIndex: 2,
          ...style,
        }}
        whileHover={{ y: -6 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
