'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface CustomCursorProps {
  isMouseOverPanel: boolean;
}

const CustomCursor: React.FC<CustomCursorProps> = ({ isMouseOverPanel }) => {
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const posRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const rotationRef = useRef(0);
  const [renderPos, setRenderPos] = useState({ x: 0, y: 0 });
  const [renderRotation, setRenderRotation] = useState(0);

  // Track mouse position for lightsaber cursor using ref and animation frame
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      lastMoveTimeRef.current = Date.now();
      setIsMouseMoving(true);
    };

    const updateCursor = () => {
      if (isMouseOverPanel) {
        targetPosRef.current = posRef.current;

        // Compute rotation so the blade points upward
        const angleRad =
          Math.atan2(
            posRef.current.y - window.innerHeight / 2,
            posRef.current.x - window.innerWidth / 2,
          ) -
          Math.PI / 2;
        // Calculate wobble with damping when mouse stops
        const timeSinceLastMove = Date.now() - lastMoveTimeRef.current;
        // Damping factor: 1 when moving, fades to 0 when stopped
        const dampingFactor = Math.max(0, 1 - timeSinceLastMove / 500);
        // Use a faster oscillation for smoother physics feel
        const wobble = Math.sin(Date.now() / 100) * 3 * dampingFactor;
        const rotateDeg = (angleRad * 180) / Math.PI + wobble;
        rotationRef.current = rotateDeg;

        setRenderPos({ ...targetPosRef.current });
        setRenderRotation(rotateDeg);
      }

      requestAnimationFrame(updateCursor);
    };

    const animationId = requestAnimationFrame(updateCursor);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isMouseOverPanel]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: renderPos.x,
        top: renderPos.y,
        opacity: isMouseOverPanel ? 1 : 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      animate={{
        left: renderPos.x,
        top: renderPos.y,
        opacity: isMouseOverPanel ? 1 : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1,
      }}
    >
      {/* Lightsaber blade visual - points upward */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%', // Start from cursor position and extend upward
          width: '12px',
          height: '150px', // 100px blade + 50px handle
          transform: `translateX(-50%) rotate(${renderRotation}deg)`,
          overflow: 'visible',
        }}
      >
        {/* Handle (black with white stroke, 1/2 length of blade = 50px) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0, // Top of overall div (at cursor position)
            width: '12px',
            height: '50px',
            transform: 'translateX(-50%)',
            backgroundColor: '#000000', // Black handle
            border: '2px solid #ffffff', // White stroke
            borderRadius: '4px 4px 0 0',
          }}
        />
        {/* Blade - grows from handle base upward */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50px', // Start after handle
            width: '12px',
            height: '100px',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to top, #00d9ff 0%, #33aaff 40%, #66ccff 70%, #ffffff 100%)', // Gradient from handle base to tip
            borderRadius: '0 0 8px 8px', // Rounded top (tip), flat bottom (attachment)
            boxShadow:
              '0 0 10px #00d9ff, 0 0 20px #00d9ff, 0 0 40px #00d9ff, 0 0 60px #00d9ff',
            overflow: 'visible',
          }}
        >
          {/* Inner white core for lightsaber effect */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: '4px',
              height: '100px',
              transform: 'translateX(-50%)',
              backgroundColor: '#ffffff',
              borderRadius: '2px 2px 0 0', // Matches blade shape
              boxShadow: '0 0 5px #ffffff',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CustomCursor;