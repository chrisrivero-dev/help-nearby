'use client';

import type { FC, ReactNode, RefObject } from 'react';
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
  /** Optional content rendered inside the fixed header, below the title. */
  subBar?: ReactNode;
}

const NavBar: FC<NavBarProps> = ({
  variant = 'about',
  title,
  subtitle,
  showRadar = true,
  radarRef,
  hideThemeToggle,
  showLocation,
  subBar,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const dividerColor = isDark ? '#1e2028' : '#e0e2e8';

  // Fixed, full-bleed header with a translucent blurred background. The header
  // stacks two attached bands: the main nav (title) and an optional sub-bar.
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
    color: isDark ? '#e8e8e8' : '#111111',
    zIndex: 1001,
  };

  // Each band carries a bottom border so the nav and the sub-bar read as two
  // distinct, attached strips.
  const bandStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderBottom: `1px solid ${dividerColor}`,
  };

  // Content frame - matches the main page content container
  // (maxWidth 1600, centered, max(2%, 16px) side padding)
  const contentFrameStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 1600,
    margin: '0 auto',
    boxSizing: 'border-box',
  };

  return (
    <header style={headerStyle}>
      {/* Main nav band */}
      <div style={bandStyle}>
        <div style={{ ...contentFrameStyle, padding: '10px max(2%, 16px)' }}>
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
      </div>

      {/* Sub-bar band - separate strip attached below the main nav */}
      {subBar && (
        <div style={bandStyle}>
          <div style={{ ...contentFrameStyle, padding: '8px max(2%, 16px)' }}>
            {subBar}
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
