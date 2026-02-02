'use client';

import { motion } from 'framer-motion';

export default function About() {
  return (
    <motion.main
      className="flex flex-col items-center justify-center min-h-screen w-full bg-black text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <h1 className="text-3xl font-bold">About Help Nearby</h1>
      <p className="mt-4 max-w-xl text-center">{/* Your about content */}</p>
    </motion.main>
  );
}
