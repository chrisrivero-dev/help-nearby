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
  /**
   * When true the panel stretches to fill its parent's height instead of
   * sizing to its content, and the front panel becomes a flex column so its
   * children can distribute the available height. Used by the chat panel to
   * fill its column / keep the input pinned. Default false preserves the
   * fit-content behavior every other panel relies on.
   */
  fill?: boolean;
  /** When true the panel is expanded and the hover lift effect is disabled. */
  isExpanded?: boolean;
  /** When true, keep the panel static on hover while preserving its shell. */
  disableHoverLift?: boolean;
}

/**
 * Neo-brutalism panel wrapper.
 *
 * A static "back panel" sits directly behind the front panel; on hover the
 * front panel lifts straight up (no horizontal shift), revealing the bold
 * offset shadow below it. When tiled flush with no gaps, the hovered wrapper
 * raises its stacking so the revealed offset is drawn over the panel below.
 */
export const NeoPanel: FC<NeoPanelProps> = ({
  children,
  className,
  style,
  fill = false,
  isExpanded,
  disableHoverLift = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [hovered, setHovered] = useState(false);

  // When isExpanded is provided, disable hover lift when expanded
  // Otherwise, use the disableHoverLift prop
  const shouldDisableHoverLift = isExpanded ? true : disableHoverLift;

  const borderColor = isDark ? '#404040' : '#111111';
  const shadowColor = isDark ? '#000000' : '#111111';
  const panelBg = isDark ? '#181818' : '#ffffff';

  return (
    <motion.div
      className={className}
      style={{
        position: 'relative',
        breakInside: 'avoid',
        height: fill ? '100%' : 'fit-content',
        minHeight: fill ? 0 : undefined,
        zIndex: hovered && !shouldDisableHoverLift ? 3 : 1,
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
          borderTop: `2px solid ${borderColor}`,
          borderLeft: `2px solid ${borderColor}`,
          borderRight: `2px solid ${borderColor}`,
          borderBottom: `2px solid ${borderColor}`,
          position: 'relative',
          zIndex: 2,
          ...(fill
            ? {
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }
            : {}),
          ...style,
        }}
        whileHover={shouldDisableHoverLift ? undefined : { y: -6 }}
        onHoverStart={() => {
          if (!shouldDisableHoverLift) setHovered(true);
        }}
        onHoverEnd={() => {
          if (!shouldDisableHoverLift) setHovered(false);
        }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
