'use client';

import type { FC, RefObject } from 'react';
import TitleBase from './TitleBase';
import { useTheme } from '@/components/useTheme';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import FeatureBar from './FeatureBar';
import Menu from './Menu';

interface NavBarProps {
  variant?: 'help' | 'resources' | 'about';
  title?: string;
  subtitle?: string;
  showRadar?: boolean;
  radarRef?: RefObject<HTMLDivElement | null>;
  showMapPin?: boolean;
  hideThemeToggle?: boolean;
}

// Panel border colors
const panelBorderDark = '#252525';
const panelBorderLight = '#e4e4e4';

const NavBar: FC<NavBarProps> = ({
  variant = 'about',
  title,
  subtitle,
  showRadar = true,
  radarRef,
  hideThemeToggle,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  // Header row style - responsive container
  const headerRowStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingLeft: 'max(16px, calc((100vw - 1600px) / 2 + 50px))',
    paddingRight: 'max(16px, calc((100vw - 1600px) / 2 + 50px))',
    boxSizing: 'border-box',
    backgroundColor: isDark
      ? 'rgba(15, 15, 15, 0.7)'
      : 'rgba(250, 250, 250, 0.7)',
    backdropFilter: 'blur(10px) saturate(180%)',
    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
    color: isDark ? '#e8e8e8' : '#111111',
    zIndex: 1001,
    minHeight: '80px',
    paddingTop: '12px',
    paddingBottom: '12px',
  };

  // Desktop: title left, menu and feature toggles right
  // The flex container holds Title (left) and Menu+FeatureBar wrapper (right)
  const desktopContainerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const desktopTitleStyle: React.CSSProperties = {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  return (
    <div style={{ ...headerRowStyle }}>
      {/* Desktop: Title left, menu and feature toggles right */}
      <div style={desktopContainerStyle}>
        <div style={desktopTitleStyle}>
          <TitleBase
            title={title}
            subtitle={subtitle}
            showRadar={showRadar}
            variant={variant}
            radarRef={radarRef}
          />
        </div>

        {/* FeatureBar aligned to right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <FeatureBar hideThemeToggle={hideThemeToggle} />
          <Menu />
        </div>
      </div>
    </div>
  );
};

export default NavBar;
