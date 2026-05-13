'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useTheme } from './useTheme';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (zip: string) => void;
}

const SearchModal: FC<SearchModalProps> = ({ isOpen, onClose, onSearch }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [zip, setZip] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    borderRadius: '8px',
    border: `2px solid ${isDark ? '#2e2e2e' : '#e0e0e0'}`,
    backgroundColor: isDark ? '#0f0f0f' : '#fafafa',
    color: isDark ? '#e8e8e8' : '#111111',
    marginBottom: '20px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '8px',
    border: `2px solid ${isDark ? '#2e2e2e' : '#e0e0e0'}`,
    backgroundColor: isDark ? '#0f0f0f' : '#fafafa',
    color: isDark ? '#e8e8e8' : '#111111',
    cursor: 'pointer',
    marginBottom: '12px',
  };

  const handleSearch = () => {
    if (zip.trim().length === 5) {
      onSearch(zip.trim());
      onClose();
      setZip('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? '#0f0f0f' : '#fafafa',
        zIndex: 10000,
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}
      >
        <h2
          style={{
            color: isDark ? '#e8e8e8' : '#111111',
            fontSize: '24px',
            fontWeight: '700',
            flex: 1,
          }}
        >
          Search Location
        </h2>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: isDark ? '#e8e8e8' : '#111111',
          }}
        >
          <X size={24} />
        </button>
      </div>

      <input
        type="text"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter 5-digit ZIP code"
        style={inputStyle}
        autoFocus
      />

      <button
        onClick={handleSearch}
        style={{
          ...buttonStyle,
          backgroundColor: isDark ? '#60a5fa' : '#2563eb',
          color: '#ffffff',
          border: 'none',
        }}
      >
        <Search size={20} fill="none" style={{ marginRight: '8px' }} />
        Search
      </button>

      <button
        onClick={onClose}
        style={{
          ...buttonStyle,
          backgroundColor: isDark ? '#1e1e1e' : '#e0e0e0',
          color: isDark ? '#e8e8e8' : '#111111',
        }}
      >
        Cancel
      </button>
    </motion.div>
  );
};

export default SearchModal;
