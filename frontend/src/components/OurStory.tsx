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
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10 rounded-lg p-4 md:p-5"
      style={{ position: 'relative', maxWidth: '100%' }}
    >
      <div className="flex-none w-full md:w-auto flex justify-center">
        <div
          className="relative p-2"
          style={{ background: 'transparent', maxWidth: '100%' }}
        >
          <img
            src="/images/ourstory.jpg"
            alt="Our story"
            className="relative z-10 h-[200px] w-[200px] md:h-[300px] md:w-[300px] object-cover flex-none border-4 border-[#3e3e3e]"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
      <div
        className={`flex-1 text-white text-xl md:text-2xl leading-6 md:leading-7 font-light tracking-[0.05em] text-center md:text-left`}
      >
        <p>
          We were helped on our journey through Vietnam, by a gracious old
          woman, an obscure internet forum, and two fellow explorers hiking up a
          mountain in Ha Long Bay.
        </p>
      </div>
    </motion.div>
  );
};

export default OurStory;
