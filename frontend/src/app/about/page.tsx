'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FiMapPin } from 'react-icons/fi';
import StarWarsIntro from '@/components/StarWarsIntro';

// Header component - static part that's always rendered
const Header: React.FC<{
  panelOpen: boolean;
  handleMapPinClick: () => void;
}> = ({ panelOpen, handleMapPinClick }) => (
  <header className="flex items-center w-full p-4 bg-black border-b-[4px] border-white">
    <div className="flex flex-col w-full">
      {/* Navigation row above title and icon */}
      <div className="flex flex-row gap-4 text-xl mx-auto items-center justify-center h-full">
        <Link href="/" className="text-white hover:text-red-500 transition-colors">
          HOME
        </Link>
        <Link
          href="/resources"
          className="text-white hover:text-red-500 transition-colors"
        >
          RESOURCES
        </Link>
        <Link
          href="/about"
          className="text-white hover:text-red-500 transition-colors"
        >
          ABOUT
        </Link>
      </div>

      {/* Title and icon container */}
      <div className="flex items-center justify-center w-full">
        <TitleAnimation />

        {/* Wrapper now carries the same left‑margin as the icon */}
        <div className="relative ml-4">
          <motion.div
            onClick={handleMapPinClick}
            className="cursor-pointer"
            style={{ fontSize: 'clamp(4rem, 8vw, 10rem)' }}
            initial={{ y: -800, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 1.2, ease: 'easeInOut' },
            }}
            whileHover={{
              y: -10,
              transition: { duration: 0.15, ease: 'linear' },
            }}
          >
            <FiMapPin style={{ color: '#fff' }} />
          </motion.div>

          {/* Oval shadow – animated (kept from previous step) */}
          <AnimatePresence>
            {panelOpen && (
              <motion.div
                className="absolute -top-[10px] left-0 right-0 mx-auto w-16 h-4 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </header>
);

// Create the title animation outside of the Header to prevent re-renders
const TitleAnimation = () => (
  <motion.div
    style={{ fontWeight: 700, textTransform: 'uppercase', textAlign: 'left', color: '#ffffff', padding: '0.5rem', fontSize: 'clamp(2rem, 8vw, 12vh)' }}
    initial={{ x: '-100%' }}
    animate={{ x: 0 }}
    transition={{ duration: 0.8, ease: 'easeInOut' }}
    key="title-animation"
  >
    <motion.span
      className="inline-block cursor-pointer"
      whileHover={{
        backgroundColor: '#ff0000ff',
        color: '#fff',
        transition: { duration: 0.2 },
      }}
      onClick={() => console.log('HELP! clicked')}
    >
      ABOUT!
    </motion.span>{' '}
    <span>NEARBY.</span>
  </motion.div>
);

// Content section - always the same
const Content = () => (
  <section className="bg-black text-white p-8">
    <div className="px-8 flex flex-col gap-4">
      <motion.div
        className="p-4 border-[10px] border-white cursor-default mb-4 w-[60%] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h3 className="text-2xl uppercase font-bold mb-2 text-center">
          What we're building
        </h3>
        <p className="text-lg leading-6 text-center">
          Help! Nearby. is a simple navigator that points people to the next
          best step: live disaster info when available, and curated local
          resources for food, housing, and cash assistance.
        </p>
      </motion.div>

      <div className="flex flex-col gap-4">
        <motion.div
          className="p-4 border-[10px] border-white cursor-default mb-4 w-[60%] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <h3 className="text-2xl uppercase font-bold mb-2 text-center">
            Our rule
          </h3>
          <p className="text-lg leading-6 text-center">
            If we wouldn&lsquo;t trust it for our own family, it doesn&lsquo;t ship.
          </p>
        </motion.div>
        <motion.div
          className="p-4 border-[10px] border-white cursor-default mb-4 w-[60%] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        >
          <h3 className="text-2xl uppercase font-bold mb-2 text-center">
            Our focus
          </h3>
          <p className="text-lg leading-6 text-center">
            Clear, local-first guidance. Minimal clicks. No drama.
          </p>
        </motion.div>
        <motion.div
          className="p-4 border-[10px] border-white cursor-default mb-4 w-[60%] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        >
          <h3 className="text-2xl uppercase font-bold mb-2 text-center">
            How you can help
          </h3>
          <p className="text-lg leading-6 text-center">
            Send resource leads, corrections, or gaps you see—we&lsquo;ll curate and
            improve coverage.
          </p>
        </motion.div>
      </div>
    </div>
  </section>
);

export default function AboutPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // UseLayoutEffect instead of useEffect to prevent hydration mismatch
  React.useLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  const handleMapPinClick = () => {
    setPanelOpen(!panelOpen);
  };

  // Only render motion components on client side to prevent hydration mismatch
  if (!hasMounted) {
    return (
      <main className="bg-black text-white">
        <Header panelOpen={panelOpen} handleMapPinClick={handleMapPinClick} />
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              className="bg-black w-full overflow-hidden border-b-[4px] border-white relative z-10"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '100vh', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <div className="p-8 flex justify-center items-center h-full">
                <StarWarsIntro
                  onAnimationComplete={() => setAnimationComplete(true)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Content />
      </main>
    );
  }

  return (
    <main className="bg-black text-white">
      <Header panelOpen={panelOpen} handleMapPinClick={handleMapPinClick} />
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            className="bg-black w-full overflow-hidden border-b-[4px] border-white relative z-10"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <div className="p-8 flex justify-center items-center h-full">
              <StarWarsIntro
                onAnimationComplete={() => setAnimationComplete(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Content />
    </main>
  );
}