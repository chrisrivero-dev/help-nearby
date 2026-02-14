'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaExclamationCircle } from 'react-icons/fa';

interface HoverZipPromptProps {
  onZipSubmit: (zip: string) => void;
}

export default function HoverZipPrompt({ onZipSubmit }: HoverZipPromptProps) {
  const [hovered, setHovered] = useState(false);
  const [zip, setZip] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (!zip || zip.length < 5) {
      setError(true);
      return;
    }

    setError(false);
    onZipSubmit(zip);
  };

  return (
    <div
      className="hn-guidance-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="hn-guidance-text">See more info</span>

      <div className="hn-arrow-input-bond">
        <motion.div
          className="hn-guidance-arrow"
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={
            hovered ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.8 }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <FaArrowRight size={64} />
        </motion.div>

        <motion.div
          className="hn-guidance-input-group"
          initial={{ opacity: 0, x: 10 }}
          animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <input
            type="text"
            placeholder="Enter ZIP code"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            maxLength={5}
            className="hn-guidance-input"
          />

          <button
            type="button"
            onClick={handleSubmit}
            className="hn-guidance-btn"
          >
            Go
          </button>

          {error && (
            <div className="hn-guidance-error">
              <FaExclamationCircle size={12} />
              <span>Enter valid ZIP</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
