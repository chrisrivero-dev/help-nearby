'use client';

import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import {
  getActiveIncidents,
  type Incident,
  type IncidentSeverity,
} from '@/data/incidents';

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  advisory: '#3b82f6',
  watch: '#f59e0b',
  warning: '#f97316',
  emergency: '#dc2626',
};

const DISCLAIMER =
  'Help Nearby aggregates official sources. Always confirm with the source linked. In an emergency, call 911.';

function formatRelative(iso: string): { label: string; isStale: boolean } {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return { label: 'Updated recently', isStale: false };
  const diffMs = Date.now() - then;
  const diffMin = Math.max(0, Math.round(diffMs / 60000));
  const isStale = diffMin > 60;
  if (diffMin < 1) return { label: 'Updated just now', isStale };
  if (diffMin < 60) return { label: `Updated ${diffMin} min ago`, isStale };
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return { label: `Updated ${diffHr} hr ago`, isStale };
  const diffDay = Math.round(diffHr / 24);
  return { label: `Updated ${diffDay} day${diffDay === 1 ? '' : 's'} ago`, isStale };
}

interface IncidentRowProps {
  incident: Incident;
}

const IncidentRow: FC<IncidentRowProps> = ({ incident }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#888' : '#666';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const subtleBg = isDark ? '#0d0d0d' : '#fafafa';
  const buttonBorder = isDark ? '#2a2a2a' : '#d0d4dc';
  const buttonBgHover = isDark ? '#161616' : '#f3f4f6';

  const accent = SEVERITY_COLOR[incident.severity];
  const updated = useMemo(
    () => formatRelative(incident.lastVerifiedAt),
    [incident.lastVerifiedAt],
  );

  const [sourcesOpen, setSourcesOpen] = useState(false);

  const jurisdictionLabel = `${incident.jurisdiction.city}, ${incident.jurisdiction.county} County, ${incident.jurisdiction.state}`;

  return (
    <div
      style={{
        borderLeft: `3px solid ${accent}`,
        background: subtleBg,
        padding: '0.95rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.7rem',
      }}
    >
      {/* Title + severity pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
        }}
      >
        <AlertTriangle
          size={16}
          color={accent}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              color: cardText,
              lineHeight: 1.3,
            }}
          >
            {incident.title}
          </div>
          <div
            style={{
              marginTop: '0.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.6rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#ffffff',
                background: accent,
                padding: '0.15rem 0.45rem',
                textTransform: 'uppercase',
              }}
            >
              {incident.severity} · {incident.status}
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.66rem',
                color: mutedText,
                letterSpacing: '0.02em',
              }}
            >
              {jurisdictionLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Short description */}
      <div
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.78rem',
          color: mutedText,
          lineHeight: 1.55,
        }}
      >
        {incident.shortDescription}
      </div>

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <a
          href={incident.evacuationMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.7rem',
            border: `1px solid ${accent}`,
            background: 'transparent',
            color: accent,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              buttonBgHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              'transparent';
          }}
        >
          Check Official Evacuation Map
          <ExternalLink size={12} />
        </a>
        <button
          type="button"
          onClick={() => setSourcesOpen((v) => !v)}
          aria-expanded={sourcesOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.7rem',
            border: `1px solid ${buttonBorder}`,
            background: 'transparent',
            color: cardText,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {sourcesOpen ? 'Hide Official Updates' : 'View Official Updates'}
        </button>
      </div>

      {/* Source list */}
      <AnimatePresence initial={false}>
        {sourcesOpen && (
          <motion.ul
            key="sources"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              listStyle: 'none',
              margin: 0,
              padding: '0.55rem 0 0 0',
              borderTop: `1px solid ${divider}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              overflow: 'hidden',
            }}
          >
            {incident.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.72rem',
                    color: cardText,
                    textDecoration: 'none',
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ color: mutedText }}>{s.org} —</span>
                  <span style={{ textDecoration: 'underline' }}>{s.label}</span>
                  <ExternalLink size={10} color={mutedText} />
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Updated stamp + stale notice */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem',
          paddingTop: '0.2rem',
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.62rem',
            color: mutedText,
            letterSpacing: '0.02em',
          }}
        >
          {updated.label}
        </span>
        {updated.isStale && (
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.62rem',
              color: accent,
              letterSpacing: '0.02em',
            }}
          >
            Information may be out of date — confirm with official source.
          </span>
        )}
      </div>
    </div>
  );
};

export const IncidentCard: FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const incidents = useMemo(() => getActiveIncidents(), []);
  if (incidents.length === 0) return null;

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#888' : '#666';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';

  return (
    <motion.div
      style={{
        position: 'relative',
        breakInside: 'avoid',
        height: 'fit-content',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }}
    >
      {/* Back panel */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
          width: '100%',
          height: '100%',
          background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)',
          border: `1px solid ${isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.05)'}`,
        }}
      />
      {/* Front panel */}
      <motion.div
        style={{
          background: isDark ? '#121212' : '#ffffff',
          border: `1px solid ${isDark ? '#252525' : '#e4e4e4'}`,
          position: 'relative',
          zIndex: 2,
        }}
        whileHover={{ x: -4, y: -4 }}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.4rem',
            borderBottom: `1px solid ${divider}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: SEVERITY_COLOR.emergency,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.15em',
                color: cardText,
              }}
            >
              INCIDENT MODE
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.62rem',
              color: mutedText,
              letterSpacing: '0.02em',
            }}
          >
            Official sources only
          </span>
        </div>

        {/* Incident rows */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            padding: '0.6rem',
          }}
        >
          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </div>

        {/* Disclaimer */}
        <div
          style={{
            padding: '0.7rem 1.4rem',
            borderTop: `1px solid ${divider}`,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.62rem',
            color: mutedText,
            letterSpacing: '0.02em',
            lineHeight: 1.5,
          }}
        >
          {DISCLAIMER}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default IncidentCard;
