'use client';

import type { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';

interface PanelLayoutProps {
  children: ReactNode;
  className?: string;
}

export const PanelLayout: FC<PanelLayoutProps> = ({ children, className }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mutedText = isDark ? '#9a9a9a' : '#999';

  // Responsive masonry grid layout using CSS classes
  // - Desktop (>1024px): 3 columns minimum width 300px per column
  // - Tablet (769-1024px): 2 columns minimum width 400px per column
  // - Mobile (<768px): 1 column (full width) with min 280px panel width
  return (
    <motion.div
      className={`panel-masonry ${className || ''}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.09, delayChildren: 0.18 },
        },
      }}
    >
      {children}
    </motion.div>
  );
};
