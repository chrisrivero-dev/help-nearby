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
  // Header row style - single row with left title and right menu
  const headerRowStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '0',
    right: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 'max(16px, calc((100vw - 1600px) / 2 + 50px))',
    paddingRight: 'max(16px, calc((100vw - 1600px) / 2 + 50px))',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    color: 'var(--color-text)',
    zIndex: 1001,
    minHeight: '60px',
  };

  // Title container style - left side
  const titleContainerStyle: React.CSSProperties = {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  // Right side container style - holds both drawer menu and language toggle side by side
  const rightSideStyle: React.CSSProperties = {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    marginRight: '80px',
  };

  // Drawer menu absolute position style - right edge of rightSideStyle
  const drawerMenuWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '30px',
    height: '12px',
    marginRight: '80px',
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
      <div style={rightSideStyle}>
        <div style={drawerMenuWrapperStyle}>
          <DrawerMenu top={39} right={40} />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
