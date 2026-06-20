'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Panel border colors
const panelBorderDark = '#252525';
const panelBorderLight = '#e4e4e4';

interface MenuProps {}

const Menu: FC<MenuProps> = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (but not on MENU button)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on MENU button or its container
      const menuButton = document.querySelector('[data-menu-button]');
      if (
        menuOpen &&
        menuRef.current &&
        menuButton &&
        !menuRef.current.contains(event.target as Node) &&
        !menuButton.contains(event.target as Node)
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

  const { logout, isAuthenticated } = useAuth();

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
  const handleDirectoryClick = () => {
    setMenuOpen(false);
    router.push('/directory');
  };
  const handleAboutClick = () => {
    setMenuOpen(false);
    router.push('/about');
  };
  const handleLogoutClick = () => {
    setMenuOpen(false);
    logout();
    router.push('/');
  };

  // Reusable button style - same size and spacing for all menu buttons
  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    width: '160px',
    height: '50px',
    fontSize: '0.75rem',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    transition: 'background 0.2s ease',
    position: 'relative',
    zIndex: 2,
  };

  // Panel style
  const panelDefaultStyle: React.CSSProperties = {
    background: isDark ? '#121212' : '#ffffff',
    border: `1px solid ${isDark ? panelBorderDark : panelBorderLight}`,
    color: isDark ? '#dedede' : '#111111',
  };

  // Hamburger button style (toggles the drawer)
  const hamburgerButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    width: '24px',
    height: '24px',
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: isDark ? '#dedede' : '#111111',
    cursor: 'pointer',
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 1004,
  };

  // Single hamburger line
  const lineStyle: React.CSSProperties = {
    display: 'block',
    width: '18px',
    height: '2px',
    background: isDark ? '#dedede' : '#111111',
    transformOrigin: 'center',
  };

  // Button hover effect
  const buttonHoverStyle: React.CSSProperties = {
    x: -4,
    y: -4,
    backgroundColor: '#fbbf24',
    color: isDark ? '#121212' : '#ffffff',
  };

  // Menu button container - inline (positioned by parent flex container)
  const menuButtonContainerStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1002,
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
  };

  // Menu overlay - positioned below the button, right-aligned
  const menuOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: '0',
    zIndex: 1001,
    display: menuOpen ? 'block' : 'none',
    width: '160px',
    flexDirection: 'column',
    gap: '0',
  };

  // MenuItem wrapper component with Framer Motion effects
  const MenuItem: FC<{
    href: string;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ href, onClick, children }) => {
    return (
      <motion.div
        style={{
          position: 'relative',
          breakInside: 'avoid',
          height: 'fit-content',
        }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
      >
        {/* Back panel - same size as front panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '160px',
            height: '50px',
            background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)'}`,
          }}
        />
        {/* Front panel - lifted off back panel */}
        <motion.a
          href={href}
          onClick={onClick}
          style={{
            ...panelDefaultStyle,
            ...menuItemStyle,
            position: 'relative',
          }}
          whileHover={{
            x: -4,
            y: -4,
            backgroundColor: '#fbbf24',
            color: isDark ? '#121212' : '#ffffff',
          }}
          transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.a>
      </motion.div>
    );
  };

  // Logout button - same structure as MenuItem
  const LogoutButton: FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
      <motion.div
        className="w-40 flex justify-end"
        style={{ pointerEvents: 'auto' }}
      >
        <motion.div
          style={{
            position: 'relative',
            breakInside: 'avoid',
            height: 'fit-content',
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] as const }}
        >
          {/* Back panel - same size as front panel */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
              width: '160px',
              height: '50px',
              background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)'}`,
            }}
          />
          {/* Front panel - lifted off back panel */}
          <motion.button
            onClick={onClick}
            style={{
              ...panelDefaultStyle,
              backgroundColor: isDark ? '#121212' : '#ffffff',
              border: `1px solid ${isDark ? panelBorderDark : panelBorderLight}`,
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 1.5rem',
              width: '160px',
              height: '50px',
              fontSize: '0.75rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 2,
            }}
            whileHover={{
              x: -4,
              y: -4,
              backgroundColor: '#fbbf24',
              color: isDark ? '#121212' : '#ffffff',
            }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
          >
            Logout
          </motion.button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Hamburger button - morphs from lines to an X when open */}
      <div
        data-menu-button
        style={menuButtonContainerStyle}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
      >
        <motion.button
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          style={hamburgerButtonStyle}
        >
          <motion.span
            style={lineStyle}
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          />
          <motion.span
            style={lineStyle}
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />
          <motion.span
            style={lineStyle}
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          />
        </motion.button>

        {/* Menu overlay - positioned below button */}
        <div
          ref={menuRef}
          style={menuOverlayStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HOME, HELP, RESOURCES */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0',
            }}
          >
            <MenuItem href="/" onClick={handleHomeClick}>
              Home
            </MenuItem>
            <MenuItem href="/help" onClick={handleHelpClick}>
              Help
            </MenuItem>
            <MenuItem href="/resources" onClick={handleResourcesClick}>
              Resources
            </MenuItem>
            <MenuItem href="/directory" onClick={handleDirectoryClick}>
              Directory
            </MenuItem>
          </div>

          {/* About - same spacing as MENU section */}
          <div>
            <MenuItem href="/about" onClick={handleAboutClick}>
              About
            </MenuItem>
          </div>

          {/* Logout - if authenticated - same spacing */}
          {isAuthenticated && (
            <div>
              <LogoutButton onClick={handleLogoutClick} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Menu;
