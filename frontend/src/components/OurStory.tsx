'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './useTheme';

const TEAM = [
  {
    name: 'Mike Dodia',
    role: 'Product Design · Healthcare Systems · Information Architecture',
    bio: 'Mike brings experience in healthcare workflows, product design, and structured digital tools. His work spans pharmacy systems, drug reference tools, real estate platforms, and community resource discovery — giving Help Nearby a strong foundation in clarity, usability, and practical system design.',
    work: 'Property Manager · Pharm.OS · Drug Reference · Help Nearby',
    img: '/images/mike-dodia-profile.jpg',
    alt: 'Mike Dodia',
  },
  {
    name: 'Christopher Rivero',
    role: 'Support Operations · Public-Sector Systems · AI Automation',
    bio: 'Chris brings experience in public-sector workflows, GIS/CAD systems, support operations, automation, and AI-assisted knowledge tools. His focus is turning scattered information into structured, usable systems that people and organizations can rely on.',
    work: 'SupportHub · SOP Search Hub · GIS Workflow Tools · Help Nearby',
    img: '/images/christopher-rivero-profile.jpg',
    alt: 'Christopher Rivero',
  },
];

const OurStory = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 0);
    return () => clearTimeout(timer);
  }, []);

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
      transition={{ duration: 0.5 }}
      className="relative flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 rounded-lg p-4 md:p-5 w-full"
      style={{ position: 'relative', maxWidth: '100%', margin: '0 auto' }}
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
        className={`flex-1 text-white text-xl md:text-2xl leading-6 md:leading-7 font-light tracking-[0.05em] text-center md:text-left max-w-[800px] mx-auto`}
      >
        <p>
          We were helped on our journey through Vietnam, by a gracious old
          woman, an obscure internet forum, and two fellow explorers hiking up a
          mountain in Ha Long Bay.
        </p>
        <a
          href="#team"
          style={{
            display: 'inline-block',
            marginTop: '1.25rem',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#f9c700',
            opacity: 0.7,
            textDecoration: 'none',
            borderBottom: '1px solid transparent',
            transition: 'opacity 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = '#f9c700'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7'; (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = 'transparent'; }}
        >
          Meet the team ↓
        </a>
      </div>

      {/* ── Team section ─────────────────────────────────────────────────────── */}
      <motion.div
        id="team"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 14 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', marginTop: '4rem' }}
      >
        {/* Divider + heading */}
        <div style={{ borderTop: '1px solid #242424', paddingTop: '2.5rem', marginBottom: '1rem' }}>
          <p style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#f9c700',
            textTransform: 'uppercase' as const,
            margin: '0 0 0.6rem',
          }}>
            The Team Behind Help Nearby
          </p>
          <p style={{
            color: '#9a9a9a',
            fontSize: 'clamp(0.8rem, 1.4vw, 0.92rem)',
            lineHeight: 1.7,
            maxWidth: 620,
            margin: 0,
          }}>
            Help Nearby is being built by two founders with complementary backgrounds in healthcare systems,
            product design, public-sector workflows, support operations, automation, and local resource discovery.
          </p>
        </div>

        {/* Profile cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1rem',
          marginTop: '1.75rem',
        }}>
          {TEAM.map((person) => (
            <div key={person.name} style={{
              border: '1px solid #2e2e2e',
              backgroundColor: '#0e0e0e',
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}>
              {/* Name + image row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
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
                  <div style={{
                    fontWeight: 700,
                    fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
                    color: '#e8e8e8',
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                  }}>
                    {person.name}
                  </div>
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#f9c700',
                    letterSpacing: '0.07em',
                    lineHeight: 1.55,
                    marginTop: '0.35rem',
                    opacity: 0.85,
                  }}>
                    {person.role}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p style={{
                color: 'rgba(255,255,255,0.74)',
                fontSize: 'clamp(0.78rem, 1.2vw, 0.85rem)',
                lineHeight: 1.72,
                margin: 0,
              }}>
                {person.bio}
              </p>

              {/* Selected work */}
              <div style={{ borderTop: '1px solid #181818', paddingTop: '0.85rem' }}>
                <span style={{
                  display: 'block',
                  fontSize: '0.55rem',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  color: '#565656',
                  textTransform: 'uppercase' as const,
                  marginBottom: '0.3rem',
                }}>
                  Selected Builder Work
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: '#848484',
                  letterSpacing: '0.03em',
                }}>
                  {person.work}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Closing trust statement */}
        <p style={{
          color: '#888',
          fontSize: 'clamp(0.78rem, 1.2vw, 0.85rem)',
          lineHeight: 1.75,
          marginTop: '1.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #181818',
        }}>
          Together, Mike and Chris are building Help Nearby as more than a simple directory. The goal is to create
          a practical resource-discovery platform that helps people, organizations, and local partners move from
          scattered information to clear next steps.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default OurStory;
