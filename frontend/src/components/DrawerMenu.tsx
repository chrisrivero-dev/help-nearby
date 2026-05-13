'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/components/useTheme';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

interface DrawerMenuProps {
  top?: number;
  right?: number;
}

const DrawerMenu: FC<DrawerMenuProps> = ({ top = 20, right = 20 }) => {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);

  // Colors based on theme
  const linkColor = isDark ? '#e8e8e8' : '#111111';

  // Drawer bar style - extended width for proper X shape
  // Using Pythagorean theorem: diagonal = sqrt(width² + height²)
  // For width=30px, height=4px: diagonal = sqrt(900 + 16) = sqrt(916) ≈ 30.27px
  const barWidth = 30;
  const barHeight = 4;

  const drawerBarStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 800,
    width: `${barWidth}px`,
    height: `${barHeight}px`,
    backgroundColor: linkColor,
    transition: 'all 0.3s ease',
    position: 'relative',
    transformOrigin: 'center center',
  };

  // Drawer bar top style - rotates to form diagonal of X in place
  const drawerBarTopStyle: React.CSSProperties = {
    ...drawerBarStyle,
    transform: menuOpen ? 'translateY(9px) rotate(45deg)' : 'none',
  };

  // Drawer bar middle style - hidden when menu is open
  const drawerBarMiddleStyle: React.CSSProperties = {
    ...drawerBarStyle,
    opacity: menuOpen ? 0 : 1,
  };

  // Drawer bar bottom style - rotates to form diagonal of X in place
  const drawerBarBottomStyle: React.CSSProperties = {
    ...drawerBarStyle,
    transform: menuOpen ? 'translateY(-9px) rotate(-45deg)' : 'none',
  };

  // Menu overlay style - floating, right aligned, no container
  const menuOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${top + 30}px`,
    right: `${right}px`,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  };

  // Menu item style - floating, no container background
  const menuItemStyle: React.CSSProperties = {
    display: 'block',
    padding: '10px 12px',
    color: linkColor,
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '1.1rem',
    fontFamily: "'Poppins', sans-serif",
    transition: 'color 0.2s ease',
  };

  // Menu handlers
  const handleHomeClick = () => {
    setMenuOpen(false);
    router.push('/');
  };
  const handleResourcesClick = () => {
    setMenuOpen(false);
    router.push('/resources');
  };
  const handleAboutClick = () => {
    setMenuOpen(false);
    router.push('/about');
  };

  // Container style - fixed positioning
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${top}px`,
    right: `${right}px`,
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    cursor: 'pointer',
    padding: '8px',
  };

  return (
    <>
      {/* Drawer Menu Button */}
      <div style={containerStyle} onClick={() => setMenuOpen(!menuOpen)}>
        <div style={drawerBarTopStyle} />
        <div style={drawerBarMiddleStyle} />
        <div style={drawerBarBottomStyle} />
      </div>

      {/* Collapsible Menu Overlay */}
      <motion.div
        style={menuOverlayStyle}
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: menuOpen ? 1 : 0,
          y: menuOpen ? 0 : -10,
          height: menuOpen ? 'auto' : 0,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Link
          href="/"
          onClick={handleHomeClick}
          style={menuItemStyle}
          className={pathname === '/' ? 'active' : ''}
        >
          Home
        </Link>
        <Link
          href="/resources"
          onClick={handleResourcesClick}
          style={menuItemStyle}
          className={pathname === '/resources' ? 'active' : ''}
        >
          Resources
        </Link>
        <Link
          href="/about"
          onClick={handleAboutClick}
          style={menuItemStyle}
          className={pathname === '/about' ? 'active' : ''}
        >
          About
        </Link>
      </motion.div>
    </>
  );
};

export default DrawerMenu;
