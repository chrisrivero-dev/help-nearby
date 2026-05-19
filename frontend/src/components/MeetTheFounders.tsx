'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './useTheme';

const TEAM = [
  {
    name: 'Mike',
    role: 'Product Design · Healthcare Systems · Information Architecture',
    bio: 'Mike brings experience in healthcare workflows, product design, and structured digital tools. His work spans pharmacy systems, drug reference tools, real estate platforms, and community resource discovery — giving Help Nearby a strong foundation in clarity, usability, and practical system design.',
    work: 'Property Manager · Pharm.OS · Drug Reference · Help Nearby',
    img: '/images/mike-profile.jpg',
    alt: 'Mike',
  },
  {
    name: 'Christopher',
    role: 'Support Operations · Public-Sector Systems · AI Automation',
    bio: 'Chris brings experience in public-sector workflows, GIS/CAD systems, support operations, automation, and AI-assisted knowledge tools. His focus is turning scattered information into structured, usable systems that people and organizations can rely on.',
    work: 'Sidecar Support Assistant · Help Nearby · GIS/CAD Workflow Automation · Knowledge Base Systems',
    img: '/images/christopher-profile.jpg',
    alt: 'Christopher',
  },
];

interface MeetTheFoundersProps {
  isVisible: boolean;
}

const MeetTheFounders: React.FC<MeetTheFoundersProps> = ({ isVisible }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%',
        maxWidth: '900px',
        padding: '4rem 20px',
        zIndex: 10,
      }}
    >
      {/* Divider + heading */}
      <div
        style={{
          borderTop: '1px solid #242424',
          paddingTop: '1rem',
          marginBottom: '2rem',
        }}
      >
        <p
          style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#f9c700',
            textTransform: 'uppercase' as const,
            margin: '0 0 0.6rem',
            textAlign: 'center',
          }}
        >
          The Team Behind Help Nearby
        </p>
        <p
          style={{
            color: '#9a9a9a',
            fontSize: 'clamp(0.8rem, 1.4vw, 0.92rem)',
            lineHeight: 1.7,
            maxWidth: 620,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          Help Nearby is being built by two founders with complementary
          backgrounds in healthcare systems, product design, public-sector
          workflows, support operations, automation, and local resource
          discovery.
        </p>
      </div>

      {/* Two panels coming together from left and right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1.5rem',
          marginTop: '2.5rem',
        }}
      >
        {TEAM.map((person, index) => {
          const direction = index === 0 ? 'left' : 'right';
          return (
            <motion.div
              key={person.name}
              initial={{ x: direction === 'left' ? -300 : 300, opacity: 0 }}
              animate={{
                x: isVisible ? 0 : direction === 'left' ? -300 : 300,
                opacity: isVisible ? 1 : 0,
              }}
              transition={{
                x: {
                  duration: 0.8,
                  ease: isVisible ? [0.22, 1, 0.36, 1] : [0.55, 0, 0.45, 1],
                },
                opacity: {
                  duration: 0.8,
                  ease: isVisible ? [0.22, 1, 0.36, 1] : [0.55, 0, 0.45, 1],
                  delay: 0.1,
                },
              }}
              style={{
                border: '1px solid #2e2e2e',
                backgroundColor: '#0e0e0e',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Name + image row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <img
                  src={person.img}
                  alt={person.alt}
                  style={{
                    width: 68,
                    height: 68,
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    border: '2px solid #3e3e3e',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
                      color: '#e8e8e8',
                      letterSpacing: '0.02em',
                      lineHeight: 1.2,
                    }}
                  >
                    {person.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#f9c700',
                      letterSpacing: '0.07em',
                      lineHeight: 1.55,
                      marginTop: '0.35rem',
                      opacity: 0.85,
                    }}
                  >
                    {person.role}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p
                style={{
                  color: 'rgba(255,255,255,0.74)',
                  fontSize: 'clamp(0.78rem, 1.2vw, 0.85rem)',
                  lineHeight: 1.72,
                  margin: 0,
                }}
              >
                {person.bio}
              </p>

              {/* Selected work */}
              <div
                style={{
                  borderTop: '1px solid #181818',
                  paddingTop: '0.85rem',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    color: '#565656',
                    textTransform: 'uppercase' as const,
                    marginBottom: '0.3rem',
                  }}
                >
                  Selected Builder Work
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#848484',
                    letterSpacing: '0.03em',
                  }}
                >
                  {person.work}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Closing trust statement */}
      <p
        style={{
          color: '#888',
          fontSize: 'clamp(0.78rem, 1.2vw, 0.85rem)',
          lineHeight: 1.75,
          marginTop: '1.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #181818',
          textAlign: 'center',
        }}
      >
        Together, Mike and Chris are building Help Nearby as more than a simple
        directory. The goal is to create a practical resource-discovery platform
        that helps people, organizations, and local partners move from scattered
        information to clear next steps.
      </p>
    </motion.div>
  );
};

export default MeetTheFounders;
