'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './about.module.css';

export default function AboutPage() {
  const prefersReducedMotion = useReducedMotion();

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

  return (
    <main className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
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
        </div>
      </section>

      {/* “Signature moment” crawl */}
      <section
        className={styles.crawlWrap}
        aria-label="Our story (animated crawl)"
      >
        <div className={styles.crawlTopBar}>
          <div className={styles.containerCrawl}>
            <p className={styles.crawlHint}>
              A quick origin story. Keep scrolling anytime.
            </p>
            <button
              className={styles.skipBtn}
              type="button"
              onClick={handleSkip}
            >
              Skip animation
            </button>
          </div>
        </div>

        <div className={styles.starWarsContainer}>
          <div className={styles.fadeTop} aria-hidden="true" />

          {/* Starfield */}
          <div className={styles.stars} aria-hidden="true" />
          <div className={styles.stars2} aria-hidden="true" />
          <div className={styles.stars3} aria-hidden="true" />

          {/* Crawl */}
          <div
            className={
              prefersReducedMotion
                ? styles.crawlContentReduced
                : styles.crawlContent
            }
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

      {/* Normal content continues (readable + not animated) */}
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
                If we wouldn’t trust it for our own family, it doesn’t ship.
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
                Send resource leads, corrections, or gaps you see—we’ll curate
                and improve coverage.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
