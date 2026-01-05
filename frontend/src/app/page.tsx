'use client';

import { motion } from 'framer-motion';
import React from 'react';

export default function Home() {
  return (
    <motion.main
      className="container mx-auto p-8 flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.h1
        className="text-4xl font-bold mb-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Welcome to Help Nearby
      </motion.h1>

      <motion.p
        className="text-lg text-gray-700 max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        A resource hub for communities to seek help nearby and share information
        that matters.
      </motion.p>
    </motion.main>
  );
}
