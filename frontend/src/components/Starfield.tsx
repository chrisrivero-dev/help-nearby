'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './Starfield.module.css';

interface Star {
  id: number; // unique identifier for each star
  x: number; // percentage position horizontally
  y: number; // percentage position vertically
  delay: number; // animation delay in seconds
  size: number; // pixel size of the star
}

const STAR_COUNT = 150;

const Starfield: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const [shootingStars, setShootingStars] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  // Initialize stars and start independent refresh timers
  useEffect(() => {
    const initial: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      initial.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        size: Math.random() * 2 + 1,
      });
    }
    setStars(initial);
    // Schedule refresh for each star
    initial.forEach((star) => scheduleRefresh(star.id));
    return () => {
      // Cleanup timers on unmount
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Shooting star spawn effect
  useEffect(() => {
    const spawn = () => {
      const newStars = Array.from({ length: 5 }, () => ({
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));
      setShootingStars((prev) => [...prev, ...newStars]);
      // Remove after animation (1s)
      newStars.forEach((star) => {
        const removalTimer = setTimeout(() => {
          setShootingStars((prev) => prev.filter((s) => s.id !== star.id));
        }, 1000);
        timersRef.current.push(removalTimer);
      });
    };
    const interval = setInterval(spawn, 6000);
    timersRef.current.push(interval);
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const scheduleRefresh = (id: number) => {
    const interval = 3000 + Math.random() * 2000; // 3‑5 seconds
    const timer = setTimeout(() => {
      setStars((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, x: Math.random() * 100, y: Math.random() * 100 }
            : s,
        ),
      );
      scheduleRefresh(id);
    }, interval);
    timersRef.current.push(timer);
  };

  return (
    <div className={styles.starfield} aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className={styles.star}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}

      {shootingStars.map((s) => (
        <div
          key={s.id}
          className={styles.shootingStar}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
          }}
        />
      ))}
    </div>
  );
};

export default Starfield;
