'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './Lightsaber.module.css';

interface LightsaberCursorProps {
  isHovering: boolean;
}

const LightsaberCursor: React.FC<LightsaberCursorProps> = ({ isHovering }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  // Track mouse position only while the cursor should be visible
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    if (isHovering) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isHovering]);

  // Update target position and rotation with spring physics
  useEffect(() => {
    if (isHovering) {
      setTargetPos(pos);

      // Compute rotation so the blade points upward and apply wobble
      const angleRad =
        Math.atan2(
          pos.y - window.innerHeight / 2,
          pos.x - window.innerWidth / 2,
        ) -
        Math.PI / 2;
      const wobble = Math.sin(Date.now() / 200) * 5; // 5 degree wobble
      const rotateDeg = (angleRad * 180) / Math.PI + wobble;
      setRotation(rotateDeg);
    }
  }, [pos, isHovering]);

  return (
    <motion.div
      className={`${styles['rod-cursor']} ${isHovering ? styles.hovered : ''}`}
      style={{
        position: 'fixed',
        left: targetPos.x,
        top: targetPos.y,
        opacity: isHovering ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      animate={{
        left: targetPos.x,
        top: targetPos.y,
        rotate: rotation,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1,
      }}
    />
  );
};

export default LightsaberCursor;
