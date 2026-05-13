'use client';

import type { FC } from 'react';
import TitleBase from './TitleBase';
import DrawerMenu from './DrawerMenu';

interface NavBarProps {
  variant?: 'help' | 'resources' | 'about';
  title?: string;
  subtitle?: string;
  showMapPin?: boolean;
}

const NavBar: FC<NavBarProps> = ({
  variant = 'about',
  title,
  subtitle,
  showMapPin = true,
}) => {
  // Header row style - responsive flex container
  const headerRowStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '0',
    right: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 'max(16px, calc((100vw - 1600px) / 2 + 50px))',
    paddingRight: 'max(64px, calc((100vw - 1600px) / 2 + 50px))',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    zIndex: 1001,
    minHeight: '60px',
  };

  // Title container style - left side
  const titleContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    verticalAlign: 'middle',
  };

  // Drawer menu container style - right side
  const drawerMenuStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ ...headerRowStyle }}>
      {/* Left: Title */}
      <div style={titleContainerStyle}>
        <TitleBase
          title={title}
          subtitle={subtitle}
          showMapPin={showMapPin}
          variant={variant}
        />
      </div>

      {/* Right: Drawer Menu */}
      <div style={drawerMenuStyle}>
        <DrawerMenu top={20} right={20} />
      </div>
    </div>
  );
};

export default NavBar;
