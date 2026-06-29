'use client';

import type { FC } from 'react';
import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from './useTheme';
import { useRouter } from 'next/navigation';
// useSearchParams removed - using URLSearchParams directly for Suspense compatibility

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, isLoading, error } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );
  const isDark = theme === 'dark';

  // Initialize search params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  const from = searchParams ? searchParams.get('from') || '/help' : '/help';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mailingListEmail, setMailingListEmail] = useState('');
  const [showMailingListModal, setShowMailingListModal] = useState(false);
  const [isJoiningList, setIsJoiningList] = useState(false);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      onClose();
      router.push(from);
    } catch (err) {
      // Error is already set in context
    }
  };

  const handleJoinMailingList = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoiningList(true);
    setListMessage(null);

    try {
      const response = await fetch('/api/join-mailing-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: mailingListEmail }),
      });

      if (response.ok) {
        setListMessage('Successfully joined the mailing list!');
        setMailingListEmail('');
        setTimeout(() => {
          setShowMailingListModal(false);
          setListMessage(null);
        }, 2000);
      } else {
        const data = await response.json();
        setListMessage(data.detail || 'Failed to join mailing list');
      }
    } catch (err) {
      setListMessage('Failed to join mailing list');
    } finally {
      setIsJoiningList(false);
    }
  };

  if (!isOpen) return null;

  // Modal overlay style
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  // Modal content style
  const modalStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1002,
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    cursor: 'default',
  };

  // Close button style
  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: isDark ? '#e8e8e8' : '#111111',
    padding: '4px 8px',
    lineHeight: 1,
  };

  // Form style
  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  // Input style
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `2px solid ${isDark ? '#3e3e3e' : '#cccccc'}`,
    backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
    color: isDark ? '#e8e8e8' : '#111111',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  // Label style
  const labelStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 600,
    fontSize: '14px',
    color: isDark ? '#e8e8e8' : '#111111',
    marginBottom: '8px',
    display: 'block',
  };

  // Button style
  const buttonStyle: React.CSSProperties = {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    padding: '14px 20px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const primaryBtnStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#E0A800',
    color: '#111111',
    boxShadow: '0 4px 0 #A87900',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: isDark ? '#3e3e3e' : '#f0f0f0',
    color: isDark ? '#e8e8e8' : '#111111',
    boxShadow: '0 4px 0 #1f2937',
  };

  // Mailing list modal content
  const mailingListModalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1003,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const mailingListDialogContentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1004,
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    cursor: 'default',
  };

  const closeModalBtnStyle: React.CSSProperties = {
    ...closeBtnStyle,
    zIndex: 1005,
  };

  const successMessageStyle: React.CSSProperties = {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid #10b981',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#10b981',
    fontSize: '14px',
    textAlign: 'center',
  };

  const errorMessageStyle: React.CSSProperties = {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    color: '#ef4444',
    fontSize: '14px',
    textAlign: 'center',
  };

  return (
    <>
      <motion.div
        style={overlayStyle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          style={modalStyle}
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            style={closeBtnStyle}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>

          {/* Header */}
          <h2
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '28px',
              textAlign: 'center',
              color: isDark ? '#e8e8e8' : '#111111',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Login
          </h2>

          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#ef4444',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form style={formStyle} onSubmit={handleSubmit}>
            {/* Email input */}
            <div>
              <label style={labelStyle} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password input */}
            <div>
              <label style={labelStyle} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit button */}
            <button type="submit" style={primaryBtnStyle} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Login'}
            </button>
          </form>

          {/* Mailing list section */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${isDark ? '#3e3e3e' : '#e5e5e5'}`,
            }}
          >
            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: isDark ? '#a0a0a0' : '#666666',
                marginBottom: '16px',
              }}
            >
              Don't have an account?{' '}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E0A800',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
                onClick={() => setShowMailingListModal(true)}
                disabled={isLoading}
              >
                Learn More
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Mailing List Modal */}
      <AnimatePresence>
        {showMailingListModal && (
          <motion.div
            style={mailingListModalStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMailingListModal(false)}
          >
            <motion.div
              style={mailingListDialogContentStyle}
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                style={closeModalBtnStyle}
                onClick={() => setShowMailingListModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>

              {/* Header */}
              <h2
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: '28px',
                  textAlign: 'center',
                  color: isDark ? '#e8e8e8' : '#111111',
                  marginBottom: '24px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                Join Mailing List
              </h2>

              {/* Success/Error message */}
              {listMessage && (
                <div
                  style={
                    listMessage.startsWith('Successfully')
                      ? successMessageStyle
                      : errorMessageStyle
                  }
                >
                  {listMessage}
                </div>
              )}

              {/* Form */}
              <form style={formStyle} onSubmit={handleJoinMailingList}>
                <div>
                  <label style={labelStyle} htmlFor="mailingListEmail">
                    Email
                  </label>
                  <input
                    id="mailingListEmail"
                    type="email"
                    style={inputStyle}
                    value={mailingListEmail}
                    onChange={(e) => setMailingListEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isJoiningList}
                  />
                </div>

                <button
                  type="submit"
                  style={primaryBtnStyle}
                  disabled={isJoiningList}
                >
                  {isJoiningList ? 'Joining...' : 'Join List'}
                </button>
              </form>

              <p
                style={{
                  textAlign: 'center',
                  marginTop: '16px',
                  fontSize: '14px',
                  color: isDark ? '#a0a0a0' : '#666666',
                }}
              >
                Get updates about new features and resources.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginModal;
