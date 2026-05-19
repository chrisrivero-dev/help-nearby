'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './useTheme';

interface OurStoryProps {
  isVisible: boolean;
}

const OurStory: React.FC<OurStoryProps> = ({ isVisible }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative', maxWidth: '100%', margin: '0 auto' }}
    >
      <div
        className="flex-1 text-white text-xl md:text-2xl leading-6 md:leading-7 font-light tracking-[0.05em] text-center md:text-left max-w-[800px] mx-auto"
        style={{ padding: '0 20px' }}
      >
        <p>
          We were helped on our journey through Vietnam, by a gracious old
          woman, an obscure internet forum, and two fellow explorers hiking up a
          mountain in Ha Long Bay.
        </p>
        <div
          className="flex-none w-full md:w-auto flex justify-center mt-8"
          style={{ marginTop: '2rem' }}
        >
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
      </div>
    </motion.div>
  );
};

export default OurStory;
