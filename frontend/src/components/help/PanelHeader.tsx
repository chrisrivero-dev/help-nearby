'use client';

import type { CSSProperties, FC, ReactNode } from 'react';
import { useState } from 'react';

interface PanelHeaderProps {
  children: ReactNode;
  divider: string;
  isDark: boolean;
  onClick: () => void;
  /**
   * Compact, NewsTicker-style header: fixed 42px height with no padding and
   * stretch-aligned children, so a child cell can carry a full-height vertical
   * divider. Children own their own horizontal padding in this mode. Default
   * false keeps the standard padded header used by every other panel.
   */
  dense?: boolean;
}

export const PanelHeader: FC<PanelHeaderProps> = ({
  children,
  divider,
  isDark,
  onClick,
  dense = false,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="help-panel-header"
      style={
        {
          '--help-panel-header-hover-color': isDark ? '#121212' : '#ffffff',
          display: 'flex',
          alignItems: dense ? 'stretch' : 'center',
          justifyContent: 'space-between',
          height: dense ? 42 : undefined,
          padding: dense ? 0 : '1rem 1rem',
          borderBottom: `1px solid ${divider}`,
          backgroundColor: hovered ? '#FFB000' : 'transparent',
          color: hovered ? '#111111' : undefined,
          cursor: 'pointer',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        } as CSSProperties
      }
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
};
