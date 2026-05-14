'use client';

import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/components/useTheme';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import LanguageToggle from './LanguageToggle';

interface DrawerMenuProps {
  top?: number;
  right?: number;
}

const DrawerMenu: FC<DrawerMenuProps> = ({ top = 26, right = 12 }) => {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

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
    backgroundColor: isDark ? '#e8e8e8' : '#111111',
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
  // Calculate top position to align with bottom of menu button
  // button height = 3 bars * 4px + 2 gaps * 5px = 22px
  // additional padding for top gap between menu toggle and first link
  const menuButtonHeight = 22;
  const topPadding = 8; // padding between menu toggle and first link
  const menuOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${top + menuButtonHeight + topPadding}px`,
    right: `${right}px`,
    zIndex: menuOpen ? 1002 : 1000,
    display: menuOpen ? 'flex' : 'none',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px', // Add gaps between menu options
  };

  // Menu handlers
  const handleHomeClick = () => {
    setMenuOpen(false);
    router.push('/');
  };
  const handleHelpClick = () => {
    setMenuOpen(false);
    router.push('/help');
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
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    cursor: 'pointer',
    padding: '0',
    pointerEvents: menuOpen ? 'none' : 'auto',
  };

  // Overlay backdrop style - transparent overlay to capture clicks outside menu
  const overlayBackdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: menuOpen ? 1000 : -1,
    display: menuOpen ? 'block' : 'none',
  };

  // All menu items use the same style for consistent sizing and appearance
  // Uses theme-aware colors: white/dark gray for default, gold for hover
  const menuItemClass = [
    'flex items-center justify-center px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-4',
    'w-40', // Fixed width for all cells - largest based on content
    isDark
      ? 'bg-[#1e1e1e] text-[#e8e8e8] border-[#3e3e3e] shadow-[4px_4px_0px_#374151] hover:bg-[#d97706] hover:shadow-[2px_2px_0px_#374151] hover:translate-x-[2px] hover:translate-y-[2px]'
      : 'bg-[#ffffff] text-[#111111] border-[#000000] shadow-[4px_4px_0px_#1f2937] hover:bg-[#fbbf24] hover:shadow-[2px_2px_0px_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]',
  ].join(' ');

  // Language toggle in menu - uses same styling as drawer menu
  const menuLanguageToggleClass = [
    'flex items-center justify-center px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-4',
    'w-40', // Same width as other menu items
    isDark
      ? 'bg-[#1e1e1e] text-[#e8e8e8] border-[#3e3e3e] shadow-[4px_4px_0px_#374151] hover:bg-[#d97706] hover:shadow-[2px_2px_0px_#374151] hover:translate-x-[2px] hover:translate-y-[2px]'
      : 'bg-[#ffffff] text-[#111111] border-[#000000] shadow-[4px_4px_0px_#1f2937] hover:bg-[#fbbf24] hover:shadow-[2px_2px_0px_#1f2937] hover:translate-x-[2px] hover:translate-y-[2px]',
  ].join(' ');

  return (
    <>
      {/* Drawer Menu Button */}
      <div style={containerStyle} onClick={() => setMenuOpen(!menuOpen)}>
        <div style={drawerBarTopStyle} />
        <div style={drawerBarMiddleStyle} />
        <div style={drawerBarBottomStyle} />
      </div>

      {/* Backdrop to close menu when clicking outside */}
      <motion.div
        style={overlayBackdropStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: menuOpen ? 0.3 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Collapsible Menu Overlay */}
      <motion.div
        ref={menuRef}
        style={menuOverlayStyle}
        initial={{ opacity: 0, y: -10 }}
        animate={{
          opacity: menuOpen ? 1 : 0,
          y: menuOpen ? 0 : -10,
          height: menuOpen ? 'auto' : 0,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Link href="/" onClick={handleHomeClick} className={menuItemClass}>
          Home
        </Link>
        <Link href="/help" onClick={handleHelpClick} className={menuItemClass}>
          Help
        </Link>
        <Link
          href="/resources"
          onClick={handleResourcesClick}
          className={menuItemClass}
        >
          Resources
        </Link>
        <Link
          href="/about"
          onClick={handleAboutClick}
          className={menuItemClass}
        >
          About
        </Link>
        {/* Language toggle at bottom of menu - right aligned */}
        <div className="w-40 flex justify-end">
          <LanguageToggle />
        </div>
      </motion.div>
    </>
  );
};

export default DrawerMenu;
