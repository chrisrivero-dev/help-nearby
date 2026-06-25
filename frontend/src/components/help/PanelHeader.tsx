'use client';

import type { CSSProperties, FC, ReactNode } from 'react';
import { useState } from 'react';

interface PanelHeaderProps {
  children: ReactNode;
  divider: string;
  isDark: boolean;
  onClick: () => void;
}

export const PanelHeader: FC<PanelHeaderProps> = ({
  children,
  divider,
  isDark,
  onClick,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="help-panel-header"
      style={{
        '--help-panel-header-hover-color': isDark ? '#121212' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.4rem',
        borderBottom: `1px solid ${divider}`,
        backgroundColor: hovered ? '#fbbf24' : 'transparent',
        color: hovered ? (isDark ? '#121212' : '#ffffff') : undefined,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      } as CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
};
