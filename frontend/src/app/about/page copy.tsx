'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import styles from './about.module.css';
import Button from '@/components/Buttons';
import { FiMapPin } from 'react-icons/fi';
import { MdPause, MdPlayArrow } from 'react-icons/md';

/* ------ Layout styles -------------------------------- */
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: 'rgb(0, 0, 0)',
  // borderBottom: '4px solid #000',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#ffffff',
  padding: '0.5rem',
  fontSize: 'clamp(2rem, 8vw, 12vh)',
};

const headerIconStyle: React.CSSProperties = {
  fontSize: 'clamp(4rem, 8vw, 10rem)',
  cursor: 'pointer',
};

const linkContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column', // stack buttons vertically
  gap: '1rem', // space between stacked buttons
  fontSize: '1.25rem',
  marginLeft: 'auto',
  alignItems: 'flex-end',
  height: '100%',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  minWidth: '8rem',
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  padding: '0.25rem 0',
  textDecoration: 'none',
};

const activeShadowStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)', // distance below the icon (tweak if needed)
  left: 0,
  right: 0,
  margin: '0 auto', // forces horizontal centering
  width: '4rem',
  height: '1.2rem',
  backgroundColor: '#000', // solid black
  borderRadius: '50%',
};

export default function AboutPage() {
  const prefersReducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const story = [
    'We’re Mike and Chris. Two regular people who got tired of watching families scramble for help when things go sideways.',
    'We come from humble backgrounds, and we built Help Nearby with a simple belief: people deserve clear next steps when life gets chaotic.',
    'We met while traveling through Europe, stayed close, and kept talking about the same problem—resources exist, but they’re hard to find when you’re stressed, displaced, or trying to help someone you love.',
    'So we’re building a hub that makes it easier to locate real help fast—disaster updates, food, housing, and cash assistance—without the noise.',
    'We’re not trying to be heroes. We just want to build the thing we’d want for our own family and friends. The journey continues............',
  ];

  function handleSkip() {
    const el = document.getElementById('about-content');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Header component - static part that's always rendered
  const Header = () => (
    <header style={headerStyle}>
      <motion.div
        style={titleStyle}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <motion.span
          style={{ display: 'inline-block', cursor: 'pointer' }}
          whileHover={{
            backgroundColor: '#ff0000ff',
            color: '#fff',
            transition: { duration: 0.2 },
          }}
          onClick={() => console.log('HELP! clicked')}
        >
          HELP!
        </motion.span>{' '}
        <span>NEARBY.</span>
      </motion.div>

      {/* Wrapper now carries the same left‑margin as the icon */}
      <div style={{ position: 'relative', marginLeft: '1rem' }}>
        <motion.div
          onClick={() => setPanelOpen((o) => !o)}
          style={headerIconStyle}
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
          <FiMapPin />
        </motion.div>

        {/* Oval shadow – animated (kept from previous step) */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              style={activeShadowStyle}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
      </div>

      <div style={linkContainerStyle}>
        <Button style={linkStyle} onClick={() => (window.location.href = '/')}>
          HOME
        </Button>
        <Button
          style={linkStyle}
          onClick={() => (window.location.href = '/about')}
        >
          ABOUT
        </Button>
        <Button
          style={linkStyle}
          onClick={() => (window.location.href = '/help')}
        >
          RESOURCES
        </Button>
      </div>
    </header>
  );

  // Hero component - static for SSR, animated for client
  const Hero = () => (
    <section className={styles.hero}>
      <div className={styles.container}>
        {hasMounted ? (
          <>
            <motion.h1
              className={styles.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              About Help Nearby
            </motion.h1>

            <motion.p
              className={styles.subtitle}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -18 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
            >
              Built by two people who just want it to be easier to find real
              help—fast.
            </motion.p>

            <motion.div
              className={styles.badgesRow}
              initial={prefersReducedMotion ? false : { opacity: 0, x: 18 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <span className={styles.badge}>Practical</span>
              <span className={styles.badge}>Local-first</span>
              <span className={styles.badge}>Zero hassle</span>
            </motion.div>
          </>
        ) : (
          <>
            <h1 className={styles.title}>About Help Nearby</h1>
            <p className={styles.subtitle}>
              Built by two people who just want it to be easier to find real
              help—fast.
            </p>
            <div className={styles.badgesRow}>
              <span className={styles.badge}>Practical</span>
              <span className={styles.badge}>Local-first</span>
              <span className={styles.badge}>Zero hassle</span>
            </div>
          </>
        )}
      </div>
    </section>
  );

  // Crawl component - static for SSR, animated for client
  const Crawl = () => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
      setHasMounted(true);
    }, []);

    const togglePlayPause = () => {
      setIsPlaying(!isPlaying);
    };

    // For consistent hydration, always render the animated version
    // but make sure we don't show the animation during SSR
    const shouldAnimate = hasMounted ? isPlaying : false;

    return (
      <section
        className={styles.crawlWrap}
        aria-label="Our story (animated crawl)"
      >
        <div className={styles.starWarsContainer}>
          <div className={styles.fadeTop} aria-hidden="true" />
          <div className={styles.fadeBottom} aria-hidden="true" />

          {/* Starfield */}
          <div className={styles.stars} aria-hidden="true" />
          <div className={styles.stars2} aria-hidden="true" />
          <div className={styles.stars3} aria-hidden="true" />

          {/* Play/Pause controls */}
          <button
            className={styles.playPauseButton}
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <MdPause size={32} /> : <MdPlayArrow size={32} />}
          </button>

          {/* Crawl - Improved for Star Wars effect */}
          <div
            className={
              prefersReducedMotion
                ? styles.crawlContentReduced
                : styles.crawlContent
            }
            style={shouldAnimate ? {} : { animationPlayState: 'paused' }}
          >
            <div className={styles.crawlTitle}>
              <p className={styles.episode}>Episode I</p>
              <h2 className={styles.crawlHeading}>HELP NEARBY</h2>
            </div>

            {story.map((p, idx) => (
              <p key={idx} className={styles.crawlParagraph}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // Content section - always the same
  const Content = () => (
    <section id="about-content" className={styles.contentSection}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>What we’re building</h3>
          <p className={styles.cardBody}>
            Help Nearby is a simple navigator that points people to the next
            best step: live disaster info when available, and curated local
            resources for food, housing, and cash assistance.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Our rule</h3>
            <p className={styles.cardBody}>
              If we wouldn't trust it for our own family, it doesn't ship.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Our focus</h3>
            <p className={styles.cardBody}>
              Clear, local-first guidance. Minimal clicks. No drama.
            </p>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>How you can help</h3>
            <p className={styles.cardBody}>
              Send resource leads, corrections, or gaps you see—we'll curate and
              improve coverage.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // Only render motion components on client side to prevent hydration mismatch
  if (!hasMounted) {
    return (
      <main className={styles.page}>
        <Header />
        <Hero />
        <Crawl />
        <Content />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Header />
      <Crawl />
      <Hero />
      <Content />
    </main>
  );
}
