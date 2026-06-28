'use client';

import type { FC, ReactNode } from 'react';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import { NeoPanel } from './NeoPanel';

interface OverviewPanelProps {
  /**
   * When true, render as a full-bleed background that fills the DetailView
   * container (desktop default state — shown when no detail is open). When
   * falsy, render as a stacked card for the mobile panel list.
   */
  fill?: boolean;
}

export const OverviewPanel: FC<OverviewPanelProps> = ({ fill = false }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { city, state, zip, isValid, isResolvingLocation } =
    useLocationContext();

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#7a7a7a' : '#888888';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  // Match ResourceDetailView's surface so the overview reads as the same kind
  // of detail-pane background.
  const bg = isDark ? '#121212' : '#ffffff';

  const locationLabel = isResolvingLocation
    ? 'Resolving location…'
    : isValid && city
      ? [city, state, zip].filter(Boolean).join(', ')
      : null;

  // Static radar mark from the title bar (TitleBase) — the gold dot with a dark
  // border, minus the pulsing sweep.
  const radarIcon = (size: number) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="#fbbf24"
        stroke={isDark ? '#1e1e1e' : '#000000'}
        strokeWidth={2}
      />
    </svg>
  );

  // Static, non-collapsible header — radar icon + OVERVIEW label, mirroring
  // ResourceDetailView's header. No chevron / click affordance.
  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '1rem 1.4rem',
        borderBottom: `1px solid ${divider}`,
      }}
    >
      {radarIcon(18)}
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800,
          fontSize: '0.72rem',
          letterSpacing: '0.15em',
          color: cardText,
        }}
      >
        OVERVIEW
      </span>
    </div>
  );

  const body = (
    <div
      style={{
        padding: '1.4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
      }}
    >
      {/* Location row */}
      {locationLabel && (
        <div>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: mutedText,
              margin: '0 0 0.3rem',
            }}
          >
            Location
          </p>
          <p
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 600,
              color: cardText,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {locationLabel}
          </p>
        </div>
      )}

      {!isValid && !isResolvingLocation && (
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.78rem',
            color: mutedText,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Enter a ZIP code or city above to load nearby help.
        </p>
      )}

      {/* Select instruction */}
      <div
        style={{
          padding: '0.85rem 1rem',
          borderTop: `1px solid ${divider}`,
          borderBottom: `1px solid ${divider}`,
        }}
      >
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.76rem',
            color: mutedText,
            margin: 0,
            lineHeight: 1.65,
          }}
        >
          Select a resource from the list on the left to see details here.
        </p>
      </div>

      {/* Coverage note */}
      <p
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.64rem',
          color: mutedText,
          margin: 0,
          lineHeight: 1.7,
        }}
      >
        Source-backed data where available. Strongest current coverage: Southern
        California and California, with national health-center and weather/IPAWS
        coverage.
      </p>
    </div>
  );

  const content: ReactNode = (
    <>
      {header}
      {body}
    </>
  );

  // Fill mode: full-bleed background that fills the detail-view container.
  if (fill) {
    return <div style={{ background: bg, minHeight: '100%' }}>{content}</div>;
  }

  // Card mode: stacked panel card for the mobile panel list.
  return <NeoPanel>{content}</NeoPanel>;
};
