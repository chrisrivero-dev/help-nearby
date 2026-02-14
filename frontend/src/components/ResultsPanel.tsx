'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import type { ReactNode } from 'react';

interface ResultsPanelProps {
  children: ReactNode;
  onClose: () => void;
}

export default function ResultsPanel({ children, onClose }: ResultsPanelProps) {
  return (
    <AnimatePresence>
      <motion.div
        key="results-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="fixed top-0 right-0 h-full w-[42vw] min-w-[420px] bg-white border-l border-neutral-200 shadow-xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold tracking-tight">Help Nearby</h2>

          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-neutral-100 transition"
            aria-label="Close results"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}
