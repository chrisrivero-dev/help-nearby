'use client';

import type { CSSProperties, FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/useTheme';
import { type HelpPanelId } from './PanelControlContext';

interface PanelControlCellProps {
  /** Panels applicable to the current location (the only ones offered). */
  panels: { id: HelpPanelId; label: string }[];
  /** Currently-selected (visible) panels. */
  selected: Set<HelpPanelId>;
  onTogglePanel: (id: HelpPanelId) => void;
  /** Per-panel live status (green / connected API). */
  liveStatus: Record<HelpPanelId, boolean>;
  /** True when the last expand/collapse-all command was "expand". */
  allExpanded: boolean;
  onToggleExpandAll: () => void;
  /** When false, non-live panels are hidden. */
  showNonLive: boolean;
  onToggleShowNonLive: () => void;
  /** Whether the whole sidebar is collapsed to the status rail. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const LABEL_STYLE: CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 800,
  fontSize: '0.58rem',
  letterSpacing: '0.1em',
};

/**
 * Static (no hover-lift) control toolbar pinned to the top of the sidebar.
 * A single row: multiselect panel picker + expand/collapse-all + hide/show
 * non-live, sized to fill the sidebar width. Tiled flush with the panels below.
 */
export const PanelControlCell: FC<PanelControlCellProps> = ({
  panels,
  selected,
  onTogglePanel,
  liveStatus,
  allExpanded,
  onToggleExpandAll,
  showNonLive,
  onToggleShowNonLive,
  collapsed,
  onToggleCollapsed,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#7a7a7a' : '#888888';
  const divider = isDark ? '#1e1e1e' : '#f0f0f0';
  const bg = isDark ? '#121212' : '#ffffff';
  const border = isDark ? '#404040' : '#111111';
  const rowBg = isDark ? '#0e0e0e' : '#fafafa';
  const liveGreen = '#22c55e';

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  // Close the panel dropdown on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuWrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const selectedCount = panels.filter((p) => selected.has(p.id)).length;

  const iconBtn = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    flexShrink: 0,
    padding: 0,
    background: rowBg,
    border: `2px solid ${active ? liveGreen : border}`,
    color: active ? liveGreen : cardText,
    cursor: 'pointer',
  });

  // Collapsed: only the expand chevron fits in the narrow rail width. The rail
  // of per-panel status indicators renders below this (in page.tsx).
  if (collapsed) {
    return (
      <div
        style={{
          background: bg,
          border: `2px solid ${border}`,
          borderTop: 'none',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Expand sidebar"
          aria-label="Expand sidebar"
          style={iconBtn(false)}
        >
          <ChevronRight size={18} strokeWidth={3} color={cardText} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: bg,
        border: `2px solid ${border}`,
        // Drop the top border so it doesn't double against the OverviewPanel's
        // bottom border above — the overview's edge serves as the single seam.
        borderTop: 'none',
        padding: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        // Only create a raised stacking context while the dropdown is open, so
        // the panel below can hover-lift over the (static) control row.
        position: 'relative',
        zIndex: menuOpen ? 40 : undefined,
      }}
    >
      {/* Collapse the whole sidebar to the status rail */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        title="Collapse sidebar"
        aria-label="Collapse sidebar"
        style={iconBtn(false)}
      >
        <ChevronLeft size={18} strokeWidth={3} color={cardText} />
      </button>

      {/* Multiselect panel picker (grows to fill width) */}
      <div
        ref={menuWrapRef}
        style={{ position: 'relative', flex: 1, minWidth: 0 }}
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.4rem',
            width: '100%',
            height: 30,
            padding: '0 0.55rem',
            background: rowBg,
            border: `2px solid ${menuOpen ? cardText : border}`,
            color: cardText,
            cursor: 'pointer',
            ...LABEL_STYLE,
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            PANELS · {selectedCount}/{panels.length}
          </span>
          <ChevronDown
            size={13}
            style={{
              transform: menuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
              flexShrink: 0,
            }}
          />
        </button>

        {menuOpen && (
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 20,
              background: bg,
              border: `2px solid ${border}`,
              boxShadow: isDark
                ? '4px 4px 0 rgba(0,0,0,0.6)'
                : '4px 4px 0 rgba(0,0,0,0.12)',
            }}
          >
            {panels.map(({ id, label }) => {
              const isSelected = selected.has(id);
              const isLive = !!liveStatus[id];
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onTogglePanel(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    width: '100%',
                    padding: '0.5rem 0.7rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${divider}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {/* Checkbox */}
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      flexShrink: 0,
                      border: `2px solid ${isSelected ? cardText : mutedText}`,
                      background: isSelected ? cardText : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <Check size={9} strokeWidth={3} color={bg} />
                    )}
                  </span>
                  <span style={{ ...LABEL_STYLE, flex: 1, color: cardText }}>
                    {label}
                  </span>
                  {/* Live dot */}
                  <span
                    title={isLive ? 'Live' : 'Not live'}
                    style={{
                      width: 7,
                      height: 7,
                      flexShrink: 0,
                      background: isLive ? liveGreen : 'transparent',
                      border: `1px solid ${isLive ? liveGreen : mutedText}`,
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Expand / collapse all — single up/down chevron, matches panel headers */}
      <button
        type="button"
        onClick={onToggleExpandAll}
        title={allExpanded ? 'Collapse all panels' : 'Expand all panels'}
        aria-label={allExpanded ? 'Collapse all panels' : 'Expand all panels'}
        style={iconBtn(false)}
      >
        <ChevronDown
          size={18}
          strokeWidth={3}
          color={cardText}
          style={{
            transform: allExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Hide / show non-live — original pill toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={showNonLive}
        onClick={onToggleShowNonLive}
        title={showNonLive ? 'Hide non-live panels' : 'Show non-live panels'}
        aria-label={
          showNonLive ? 'Hide non-live panels' : 'Show non-live panels'
        }
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 30,
          flexShrink: 0,
          padding: '0 0.5rem',
          background: rowBg,
          border: `2px solid ${border}`,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'relative',
            width: 30,
            height: 16,
            flexShrink: 0,
            background: showNonLive ? liveGreen : rowBg,
            border: `2px solid ${showNonLive ? liveGreen : mutedText}`,
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 1,
              left: showNonLive ? 15 : 1,
              width: 10,
              height: 10,
              background: showNonLive ? '#ffffff' : mutedText,
              transition: 'left 0.15s ease',
            }}
          />
        </span>
      </button>
    </div>
  );
};
