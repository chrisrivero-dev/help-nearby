'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkipButtonProps {
  onClick: () => void;
  isReplayMode: boolean;
  isVisible: boolean;
}

const SkipButton: React.FC<SkipButtonProps> = ({
  onClick,
  isReplayMode,
  isVisible,
}) => {
  return (
    <motion.button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0)',
        border: '1px solid #f9c700',
        color: '#f9c700',
        padding: '0.5rem 1.1rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        cursor: 'pointer',
        opacity: isVisible ? 0.75 : 0,
        transition: 'opacity 0.3s, visibility 0.3s',
        visibility: isVisible ? 'visible' : 'hidden',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (isVisible) {
          e.currentTarget.style.opacity = '1';
        }
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (isVisible) {
          e.currentTarget.style.opacity = '0.75';
        }
      }}
    >
      {isReplayMode ? 'ROLL THE CREDITS' : 'Skip intro · Meet the team ↓'}
    </motion.button>
  );
};

export default SkipButton;
