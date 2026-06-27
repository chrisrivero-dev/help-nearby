'use client';

import type { FC } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/useTheme';
import { useLocationContext } from './LocationContext';
import { NeoPanel } from './NeoPanel';
import { PanelHeader } from './PanelHeader';

interface OverviewPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  /** Whether the whole sidebar is collapsed to the narrow rail. */
  collapsed?: boolean;
  /** Re-expand the sidebar — fired when the collapsed radar cell is clicked. */
  onExpandSidebar?: () => void;
}

export const OverviewPanel: FC<OverviewPanelProps> = ({
  isExpanded,
  onToggle,
  collapsed = false,
  onExpandSidebar,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { city, state, zip, isValid, isResolvingLocation } =
    useLocationContext();

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#7a7a7a' : '#888888';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';

  const locationLabel = isResolvingLocation
    ? 'Resolving location…'
    : isValid && city
      ? [city, state, zip].filter(Boolean).join(', ')
      : null;

  // Static radar mark from the title bar (TitleBase) — the gold dot with a dark
  // border, minus the pulsing sweep. Doubles as the entire panel body when
  // collapsed.
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

  // When the whole sidebar is collapsed to the rail, the panel shrinks to just
  // the radar icon — mirroring the inert status squares the rail shows for the
  // other panels. Clicking it re-expands the sidebar. Hover-lift is disabled:
  // as the top entry in the sidebar's overflow:auto scroll column, an upward
  // lift here pushes the cell's top edge above the scroll box (flush under the
  // NewsTicker) where it gets clipped.
  if (collapsed) {
    const rowBg = isDark ? '#0e0e0e' : '#fafafa';
    return (
      <NeoPanel disableHoverLift>
        <button
          type="button"
          onClick={onExpandSidebar}
          title="Expand overview"
          aria-label="Expand sidebar to overview"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            padding: '0.75rem 0',
            background: rowBg,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {radarIcon(20)}
        </button>
      </NeoPanel>
    );
  }

  // Expanded sidebar: full panel. The header always shows the OVERVIEW label
  // left-aligned next to the radar icon; the chevron toggles only the body.
  // Keep NeoPanel's full default border on all four sides. As the top entry in
  // the left panel stack, its top border collapses onto the control cell below
  // via the `.panel-stack > * + *` -2px margin rule (see globals.css) so borders
  // never double up, while staying present so it shows when the panel lifts.
  return (
    <NeoPanel isExpanded={isExpanded}>
      <PanelHeader divider={divider} isDark={isDark} onClick={onToggle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
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
        <motion.div
          style={{
            width: 16,
            height: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: mutedText,
          }}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9L12 15L18 9" />
          </svg>
        </motion.div>
      </PanelHeader>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            overflow: 'hidden',
          }}
        >
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
              Source-backed data where available. Strongest current coverage:
              Southern California and California, with national health-center
              and weather/IPAWS coverage.
            </p>
          </div>
        </motion.div>
      )}
    </NeoPanel>
  );
};
