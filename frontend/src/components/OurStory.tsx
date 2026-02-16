'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const OurStory = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation with 16 second delay after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 20000); // 16 second delay as specified

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        overflow: 'hidden',
        flex: 1, // Allow flex behavior
        position: 'relative', // Changed from absolute to relative
        boxSizing: 'border-box', // Ensure padding doesn't affect dimensions
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: '1200px',
          width: '90%',
          gap: '40px',
          padding: '20px',
          borderRadius: '10px',
          position: 'relative',
          transform: 'translateZ(0)',
          flex: 1, // Allow flex behavior
          boxSizing: 'border-box', // Ensure padding doesn't affect dimensions
        }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <div
            style={{
              position: 'relative',
              background: '#000',
              padding: '8px',
            }}
          >
            <img
              src="/images/ourstory.jpg"
              alt="Our story"
              style={{
                width: '300px',
                height: '300px',
                objectFit: 'cover',
                display: 'block',
                flex: 'none', // Prevent image from shrinking
              }}
            />
          </div>
        </div>
        <div
          style={{
            flex: 1,
            color: '#ffffff',
            fontSize: '24px',
            lineHeight: '1.6',
            fontWeight: 400,
            letterSpacing: '0.05em',
            textAlign: 'left',
          }}
        >
          <p>
            conquering Ha Long Bary after help by an old cat lady, a internet
            travel forum, and 2 young people along the hike up the mountain
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OurStory;
