'use client';

import type { FC } from 'react';
import { useTheme } from '@/components/useTheme';
import { PanelStatusSquare } from './PanelStatusControls';
import type { HelpPanelId, PanelStatus } from './PanelControlContext';

interface SidebarRailProps {
  /** Panels applicable to the current location — the same `availablePanels` the
   *  page derives, so adding to HELP_PANELS surfaces a panel here automatically. */
  panels: { id: HelpPanelId; label: string }[];
  /** Latest reported status per panel (drives the shared PanelStatusSquare). */
  statuses: Record<HelpPanelId, PanelStatus>;
  /** Expand the sidebar and scroll the clicked panel into view. */
  onExpandToPanel: (id: HelpPanelId) => void;
}

/**
 * Collapsed-sidebar rail. Renders one shared PanelStatusSquare per available
 * panel — the same indicator each panel shows in its own header — so the
 * collapsed sidebar reads as a column of live status lights. Registry-driven:
 * it maps over the panels the page passes, so future HELP_PANELS entries appear
 * with no change here. Clicking a square re-expands the sidebar to that panel.
 */
export const SidebarRail: FC<SidebarRailProps> = ({
  panels,
  statuses,
  onExpandToPanel,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const bg = isDark ? '#121212' : '#ffffff';
  const border = isDark ? '#404040' : '#111111';
  const rowBg = isDark ? '#0e0e0e' : '#fafafa';

  return (
    <div
      style={{
        background: bg,
        // Use explicit individual borders to avoid conflicts with theme changes
        borderRight: `2px solid ${border}`,
        borderBottom: `2px solid ${border}`,
        borderLeft: `2px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        // Grow to fill the remaining column height (like .panel-stack-filler in
        // the expanded sidebar) so the right border spans the full height and
        // divides the section just like the expanded version.
        flex: '1 1 0',
        minHeight: 0,
      }}
    >
      {panels.map(({ id, label }) => {
        const status = statuses[id];
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={`Expand sidebar to ${label}`}
            onClick={() => onExpandToPanel(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.75rem 0',
              background: rowBg,
              border: 'none',
              borderBottom: `2px solid ${border}`,
              cursor: 'pointer',
            }}
          >
            <PanelStatusSquare
              loading={!!status?.loading}
              ok={!!status?.ok}
              isDark={isDark}
            />
          </button>
        );
      })}
      {/* Filler continues the box's borders to the bottom of the column, with
          the shared darkened "empty space" fill below the status squares. */}
      <div className="empty-region" style={{ flex: '1 1 0', minHeight: 0 }} />
    </div>
  );
};
