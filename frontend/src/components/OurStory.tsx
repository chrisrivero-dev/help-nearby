'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './useTheme';

const OurStory = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="relative flex items-center gap-10 rounded-lg p-5"
      style={{ position: 'relative' }}
    >
      <div className="flex-none">
        <div className={`relative ${isDark ? 'bg-black' : 'bg-white'} p-2`}>
          <div className="absolute w-[300px] h-[300px] bg-[#2a2a2a] -translate-x-2 translate-y-2"></div>
          <img
            src="/images/ourstory.jpg"
            alt="Our story"
            className="relative z-10 h-[300px] w-[300px] object-cover flex-none border-4 border-[#3e3e3e]"
          />
        </div>
      </div>
      <div className={`flex-1 ${isDark ? 'text-white' : 'text-black'} text-2xl leading-7 font-light tracking-[0.05em] text-left`}>
        <p>
          conquering Ha Long Bary after help by an old cat lady, a internet
          travel forum, and 2 young people along the hike up the mountain
        </p>
      </div>
    </motion.div>
  );
};

export default OurStory;