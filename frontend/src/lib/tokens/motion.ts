/**
 * Design Token: Animation & Motion System
 */

export const motion = {
  // Durations (ms)
  duration: {
    fastest: 75,
    faster: 100,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 400,
    slowest: 500,
    xslow: 700,
  },
  
  // Delays (ms)
  delay: {
    none: 0,
    fast: 50,
    normal: 100,
    slow: 200,
  },
  
  // Easing functions
  ease: {
    // Standard easing
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    
    // Spring-like
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    
    // Smooth
    smooth: 'cubic-bezier(0.25, 1, 0.5, 1)',
  },
  
  // Animation presets (Framer Motion compatible)
  presets: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    fadeUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
    },
    fadeDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 10 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    slideInLeft: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    slideInRight: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
  },
} as const;

export type MotionKey = keyof typeof motion;