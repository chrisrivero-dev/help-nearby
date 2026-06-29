'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '@/components/useTheme';

const STORAGE_KEY = 'hn-clarity-dismissed-v1';

// Each stage reveals one more chip in the mini-demo, then the cycle resets.
const DEMO_CHIPS = [
  { id: 'loc', text: '📍 90012', kind: 'location' },
  { id: 'cat', text: 'Shelter', kind: 'filter' },
  { id: 'res', text: 'People Concern · 0.5 mi', kind: 'result' },
  { id: 'src', text: '✓ Source-backed', kind: 'source' },
  { id: 'ask', text: '"Any food banks nearby?"', kind: 'chat' },
] as const;

const STEPS = [
  'Enter your location',
  'Filter by need',
  'Open a source-backed result',
  'Ask follow-up questions',
];

// Which step index each chip corresponds to (for left-side highlighting)
const CHIP_STEP: Record<string, number> = {
  loc: 0, cat: 1, res: 2, src: 2, ask: 3,
};

// How long each stage is shown (ms)
const STAGE_MS = 2200;
// Extra pause on the final stage before reset
const END_PAUSE_MS = 1400;

export const ClarityStrip: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prefersReduced = useReducedMotion();

  // Start dismissed=true until sessionStorage confirms it hasn't been dismissed
  const [dismissed, setDismissed] = useState(true);
  const [mounted, setMounted] = useState(false);
  // 0 = nothing shown yet, 1-5 = that many chips are visible
  const [stage, setStage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (!sessionStorage.getItem(STORAGE_KEY)) setDismissed(false);
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Advance stage on a timer; skip animation if reduced-motion
  useEffect(() => {
    if (dismissed || prefersReduced) return;

    // Start with first chip visible after a brief entry delay
    const startTimer = setTimeout(() => setStage(1), 300);
    return () => clearTimeout(startTimer);
  }, [dismissed, prefersReduced]);

  useEffect(() => {
    if (dismissed || prefersReduced || stage === 0) return;

    const isLast = stage >= DEMO_CHIPS.length;
    const delay = isLast ? END_PAUSE_MS : STAGE_MS;

    const t = setTimeout(() => {
      setStage((s) => (s >= DEMO_CHIPS.length ? 0 : s + 1));
    }, delay);

    // When stage resets to 0, re-advance to 1 after a tiny gap
    return () => clearTimeout(t);
  }, [stage, dismissed, prefersReduced]);

  // When stage reaches 0 after a reset, kick off to 1 again
  useEffect(() => {
    if (dismissed || prefersReduced || stage !== 0 || !mounted) return;
    const t = setTimeout(() => setStage(1), 300);
    return () => clearTimeout(t);
  }, [stage, dismissed, prefersReduced, mounted]);

  const dismiss = useCallback(() => {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* */ }
    setDismissed(true);
  }, []);

  if (!mounted || dismissed) return null;

  // ── Colors ───────────────────────────────────────────────────────────────
  const borderColor = isDark ? '#404040' : '#111111';
  const bg = isDark ? '#181818' : '#ffffff';
  const textColor = isDark ? '#f4f4f4' : '#111111';
  const mutedColor = isDark ? '#b8b8b8' : '#666666';
  const dimBorder = isDark ? '#2a2a2a' : '#d8d8d8';
  const amber = '#C9A227';

  // In reduced-motion mode, treat all chips as visible and active
  const visibleCount = prefersReduced ? DEMO_CHIPS.length : stage;
  const activeChipIdx = prefersReduced ? -1 : stage - 1; // -1 = highlight none specifically
  const activeStepIdx = prefersReduced ? -1 : (stage > 0 ? CHIP_STEP[DEMO_CHIPS[Math.min(stage - 1, DEMO_CHIPS.length - 1)].id] : -1);

  function chipStyle(chip: (typeof DEMO_CHIPS)[number], idx: number) {
    const visible = prefersReduced || idx < visibleCount;
    const isActive = prefersReduced || idx === activeChipIdx;

    let background = 'transparent';
    let border = `1.5px solid ${dimBorder}`;
    let color = mutedColor;

    if (visible) {
      color = textColor;
      border = `1.5px solid ${isDark ? '#3a3a3a' : '#ccc'}`;
    }

    if (isActive && visible) {
      if (chip.kind === 'source') {
        background = isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)';
        border = '1.5px solid #22c55e';
        color = isDark ? '#86efac' : '#15803d';
      } else if (chip.kind === 'chat') {
        background = isDark ? '#222' : '#f4f4f4';
        border = `1.5px solid ${borderColor}`;
        color = textColor;
      } else {
        background = amber;
        border = `1.5px solid ${amber}`;
        color = '#111';
      }
    }

    return { background, border, color };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        width: '100%',
        background: bg,
        borderBottom: `2px solid ${borderColor}`,
        borderLeft: `2px solid ${borderColor}`,
        borderRight: `2px solid ${borderColor}`,
        flexShrink: 0,
        marginTop: -2,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Dismiss button */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss how it works strip"
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: mutedColor,
          padding: 4,
          lineHeight: 0,
          zIndex: 3,
        }}
      >
        <X size={13} strokeWidth={2} />
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '1.2rem' : '2rem',
          padding: isMobile
            ? '1.4rem 2.5rem 1.4rem 1.4rem'
            : '1.25rem 2.8rem 1.25rem 1.8rem',
          alignItems: isMobile ? 'flex-start' : 'center',
        }}
      >
        {/* ── Left: headline + numbered steps ─────────────────────────── */}
        <div style={{ flex: '0 0 auto', minWidth: 200 }}>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 800,
              fontSize: '0.8rem',
              color: textColor,
              margin: '0 0 0.3rem',
              lineHeight: 1.3,
            }}
          >
            Search local help.
            <br />
            See where it came from.
          </p>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.66rem',
              color: mutedColor,
              margin: '0 0 0.8rem',
              lineHeight: 1.65,
              maxWidth: 280,
            }}
          >
            Enter a location, filter by need, open a source-backed result,
            then ask follow-up questions with context already attached.
          </p>

          {/* Numbered steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {STEPS.map((label, i) => {
              const isActive = prefersReduced || i === activeStepIdx;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: prefersReduced ? 1 : isActive ? 1 : 0.38,
                    transition: prefersReduced ? undefined : 'opacity 0.4s ease',
                  }}
                >
                  {/* Step dot */}
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      background: isActive ? amber : 'transparent',
                      border: `1.5px solid ${isActive ? amber : dimBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: prefersReduced
                        ? undefined
                        : 'background 0.4s ease, border-color 0.4s ease',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.46rem',
                        fontWeight: 800,
                        color: isActive ? '#111' : mutedColor,
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.64rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? textColor : mutedColor,
                      transition: prefersReduced ? undefined : 'color 0.4s ease',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical divider (desktop only) */}
        {!isMobile && (
          <div
            style={{
              width: 1,
              alignSelf: 'stretch',
              background: borderColor,
              opacity: 0.18,
              flexShrink: 0,
            }}
          />
        )}

        {/* ── Right: animated mini-demo flow ──────────────────────────── */}
        {(!isMobile || prefersReduced) && (
          <div
            style={{
              flex: '1 1 auto',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.35rem',
              minWidth: 0,
            }}
          >
            {DEMO_CHIPS.map((chip, idx) => {
              const visible = prefersReduced || idx < visibleCount;
              const styles = chipStyle(chip, idx);

              return (
                <div
                  key={chip.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <motion.div
                    animate={{
                      opacity: visible ? 1 : 0,
                      y: visible ? 0 : 4,
                      scale: (prefersReduced || idx === activeChipIdx) && visible ? 1.02 : 1,
                    }}
                    transition={
                      prefersReduced
                        ? { duration: 0 }
                        : { duration: 0.38, ease: 'easeOut' }
                    }
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: chip.kind === 'chat' ? '0.6rem' : '0.63rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      padding:
                        chip.kind === 'chat'
                          ? '0.28rem 0.6rem'
                          : '0.25rem 0.55rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: chip.kind === 'result' || chip.kind === 'chat' ? 170 : 120,
                      fontStyle: chip.kind === 'chat' ? 'italic' : 'normal',
                      ...styles,
                      transition: prefersReduced
                        ? undefined
                        : 'background 0.38s ease, border-color 0.38s ease, color 0.38s ease',
                    }}
                  >
                    {chip.text}
                  </motion.div>

                  {/* Arrow connector */}
                  {idx < DEMO_CHIPS.length - 1 && (
                    <span
                      style={{
                        color: dimBorder,
                        fontSize: '0.65rem',
                        opacity: visible ? 0.7 : 0.2,
                        transition: 'opacity 0.38s ease',
                        userSelect: 'none',
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile: show static steps summary in place of animation */}
        {isMobile && !prefersReduced && (
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.62rem',
              color: mutedColor,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Location → Filter → Source-backed result → Ask follow-up
          </p>
        )}
      </div>
    </motion.div>
  );
};
