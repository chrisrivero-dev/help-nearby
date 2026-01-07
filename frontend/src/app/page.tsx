'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MovingBanner from '@/components/MovingBanner';
import { FiMapPin } from 'react-icons/fi';
import Button from '@/components/Buttons';

/* ------ Layout styles -------------------------------- */

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#fff',
  color: '#000',
  paddingBottom: '4rem',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: '#e6ecf1ff',
  borderBottom: '4px solid #000',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',
  borderRadius: '0.25rem',
  padding: '0.5rem',
  fontSize: 'clamp(2rem, 8vw, 12vh)',
};

const headerIconStyle: React.CSSProperties = {
  fontSize: 'clamp(4rem, 8vw, 10rem)',
  marginLeft: '1rem',
  cursor: 'pointer',
};

const linkContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0',
  fontSize: '1.25rem',
  marginLeft: 'auto',
  alignItems: 'flex-end',
  height: '100%',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  minWidth: '8rem',
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  borderRadius: '0.25rem',
  padding: '0.25rem 0',
  textDecoration: 'none',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#dcc3c3ff',
  width: '100%',
  overflow: 'auto',
  borderBottom: '4px solid #000',
  marginBottom: 'var(--banner-height)',
};

const mapPlaceholderStyle: React.CSSProperties = {
  fontSize: 'clamp(2rem, 10vw, 5rem)',
  fontWeight: 700,
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  borderRadius: '0.5rem',
  padding: '1rem 2rem',
  textAlign: 'center',
};

const fixedBannerStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  marginTop: '1rem',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '4px solid #000',
  padding: '2rem',
  maxWidth: '90%',
  width: '800px',
  boxShadow: '0 4px 12px rgba(0,0,0,.3)',
};

const Home: FC = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [announcements, setAnnouncements] = useState<string[]>([]);

  /* ---------------------------------------------------------
   * Load / persist announcements (optional – keeps list across reloads)
   * ------------------------------------------------------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('announcements');
    if (stored) {
      try {
        setAnnouncements(JSON.parse(stored));
      } catch {
        setAnnouncements([]);
      }
    } else {
      // No stored announcements – start with an empty list
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('announcements', JSON.stringify(announcements));
  }, [announcements]);

  /* ---------------------------------------------------------
   * Handlers for the modal
   * ------------------------------------------------------- */
  const handleAdd = () => {
    if (!newMessage.trim()) return;
    setAnnouncements((prev) => [...prev, newMessage.trim()]);
    setNewMessage('');
    setModalOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* ----- Header ----- */}
      <header style={headerStyle}>
        {/* Title – HELP! toggles the modal */}
        <motion.div
          style={titleStyle}
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <motion.span
            style={{ display: 'inline-block', cursor: 'pointer' }}
            whileHover={{
              backgroundColor: '#ff0000ff',
              color: '#fff',
              transition: { duration: 0.2 },
            }}
            onClick={() => setModalOpen(true)}
          >
            HELP!
          </motion.span>{' '}
          <span>NEARBY.</span>
        </motion.div>

        {/* Map‑pin icon – toggles sliding panel */}
        <motion.div
          onClick={() => setPanelOpen((o) => !o)}
          style={headerIconStyle}
          initial={{ y: -800, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { duration: 1.2, ease: 'easeInOut' },
          }}
          whileHover={{
            y: -10,
            transition: { duration: 0.15, ease: 'linear' },
          }}
        >
          <FiMapPin />
        </motion.div>

        {/* Navigation links */}
        <div style={linkContainerStyle}>
          <Button
            style={linkStyle}
            onClick={() => (window.location.href = '/about')}
          >
            ABOUT
          </Button>
          <Button
            style={linkStyle}
            onClick={() => (window.location.href = '/help')}
          >
            GET SOME
          </Button>
        </div>
      </header>

      {/* ----- Modal for creating an announcement ----- */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            style={modalOverlayStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={modalContentStyle}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
                New Announcement
              </h2>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #ccc',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  style={{ marginRight: '0.5rem' }}
                  onClick={() => setModalOpen(false)}
                >
                  CANCEL
                </Button>
                <Button onClick={handleAdd}>ADD</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----- Sliding Panel (preserved) ----- */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            style={panelStyle}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div
              style={{
                padding: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div style={mapPlaceholderStyle}>I COULD BE A MAP</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ----- Fixed Bottom Moving Banner ----- */}
      <div style={fixedBannerStyle}>
        <MovingBanner
          announcements={announcements}
          speed={80}
          backgroundColor="#ffeb3b"
        />
      </div>
    </motion.main>
  );
};

export default Home;
