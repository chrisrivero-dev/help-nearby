'use client';

import type { FC, RefObject } from 'react';
import TitleBase from './TitleBase';
import { useTheme } from './useTheme';

interface NavBarProps {
  variant?: 'help' | 'resources' | 'about';
  title?: string;
  subtitle?: string;
  showRadar?: boolean;
  radarRef?: RefObject<HTMLDivElement | null>;
  showMapPin?: boolean;
  hideThemeToggle?: boolean;
  showLocation?: boolean;
}

const NavBar: FC<NavBarProps> = ({
  variant = 'about',
  title,
  subtitle,
  showRadar = true,
  radarRef,
  hideThemeToggle,
  showLocation,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // The bar itself is the title base surface: a single full-bleed header with
  // a translucent blurred background and a defining bottom border.
  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    boxSizing: 'border-box',
    backgroundColor: isDark
      ? 'rgba(15, 15, 15, 0.7)'
      : 'rgba(250, 250, 250, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    borderBottom: `1px solid ${isDark ? '#1e2028' : '#e0e2e8'}`,
    color: isDark ? '#e8e8e8' : '#111111',
    zIndex: 1001,
  };

  // Content frame - matches the main page content container
  // (maxWidth 1600, centered, max(2%, 16px) side padding)
  const contentFrameStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 1600,
    margin: '0 auto',
    boxSizing: 'border-box',
    padding: '10px max(2%, 16px)',
  };

  return (
    <header style={headerStyle}>
      <div style={contentFrameStyle}>
        <TitleBase
          title={title}
          subtitle={subtitle}
          showRadar={showRadar}
          variant={variant}
          radarRef={radarRef}
          showLocation={showLocation}
          hideThemeToggle={hideThemeToggle}
        />
      </div>
    </header>
  );
};

export default NavBar;
