'use client';

import type { FC, RefObject } from 'react';
import { useState, useEffect } from 'react';
import TitleBase from './TitleBase';
import { useTheme } from './useTheme';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import FeatureBar from './FeatureBar';
import Menu from './Menu';
import { useLocationContext } from './help/LocationContext';

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
  showLocation,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  // Detect mobile screen (< 768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Header row style - responsive container
  const headerRowStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
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
    minHeight: isMobile ? 'auto' : '80px',
    paddingTop: isMobile ? '12px' : '12px',
    paddingBottom: isMobile ? '12px' : '12px',
  };

  // Desktop styles - title left, feature bar + menu right
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
      {isMobile ? (
        /* Mobile layout - stacked, centered, slide-in */
        <motion.div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* FeatureBar and Menu on same row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <FeatureBar hideThemeToggle={hideThemeToggle} />
            <Menu />
          </div>
          <TitleBase
            title={title}
            subtitle={subtitle}
            showRadar={showRadar}
            variant={variant}
            radarRef={radarRef}
            showLocation={showLocation}
          />
        </motion.div>
      ) : (
        /* Desktop layout - title left, feature bar + menu right */
        <div style={desktopContainerStyle}>
          <div style={desktopTitleStyle}>
            <TitleBase
              title={title}
              subtitle={subtitle}
              showRadar={showRadar}
              variant={variant}
              radarRef={radarRef}
              showLocation={showLocation}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <FeatureBar hideThemeToggle={hideThemeToggle} />
            <Menu />
          </div>
        </div>
      )}
    </div>
  );
};

export default NavBar;
