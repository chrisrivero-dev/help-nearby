'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const OurStory = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation with 16 second delay after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 20000); // 20 second delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="relative flex w-[90%] max-w-[1200px] flex-1 items-center gap-10 rounded-lg p-5"
      style={{ left: '200px', position: 'relative' }}
    >
      <div className="flex-none">
        <div className="relative bg-black p-2">
          <img
            src="/images/ourstory.jpg"
            alt="Our story"
            className="h-[300px] w-[300px] object-cover flex-none"
          />
        </div>
      </div>
      <div className="flex-1 text-white text-lg leading-6 font-light tracking-[0.05em] text-left">
        <p>
          conquering Ha Long Bary after help by an old cat lady, a internet
          travel forum, and 2 young people along the hike up the mountain
        </p>
      </div>
    </motion.div>
  );
};

export default OurStory;