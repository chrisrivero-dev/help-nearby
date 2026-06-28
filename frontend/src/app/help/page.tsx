'use client';

import type { FC, PointerEvent as ReactPointerEvent } from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import { NewsTicker } from '@/components/help/NewsTicker';
import { PanelLayout } from '@/components/help/PanelLayout';
import { PanelControlCell } from '@/components/help/PanelControlCell';
import {
  PanelControlProvider,
  HELP_PANELS,
  type HelpPanelId,
  type ExpandSignal,
  type PanelStatus,
} from '@/components/help/PanelControlContext';
import { AlertPanel } from '@/components/help/AlertPanel';
import { ResourcesPanel } from '@/components/help/ResourcesPanel';
import { CommunityPanel } from '@/components/help/CommunityPanel';
import { NYC311Panel } from '@/components/help/nyc311';
import { UpdatesPanel } from '@/components/help/UpdatesPanel';
import { OverviewPanel } from '@/components/help/OverviewPanel';
import { DetailView } from '@/components/help/DetailView';
import { ChatPanel } from '@/components/help/ChatPanel';
import { SidebarRail } from '@/components/help/SidebarRail';
import { DashboardProvider } from '@/components/help/DashboardContext';

const MIN_SPLIT_PANE_HEIGHT = 220;
const SPLIT_DIVIDER_HEIGHT = 0;

// Vertical (left/right column) split.
const MIN_SIDEBAR_WIDTH = 300;
const MIN_MAIN_WIDTH = 360;
const COLUMN_DIVIDER_WIDTH = 0;
const DEFAULT_SIDEBAR_WIDTH = 360;
// Width of the sidebar when collapsed to the status rail.
const COLLAPSED_SIDEBAR_WIDTH = 52;

const clampSidebarWidth = (width: number, containerWidth: number) => {
  const max = Math.max(
    MIN_SIDEBAR_WIDTH,
    containerWidth - MIN_MAIN_WIDTH - COLUMN_DIVIDER_WIDTH,
  );
  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), max);
};

const clampChatPaneHeight = (height: number, columnHeight: number) => {
  const availableHeight = Math.max(
    MIN_SPLIT_PANE_HEIGHT * 2,
    columnHeight - SPLIT_DIVIDER_HEIGHT,
  );
  return Math.min(
    Math.max(height, MIN_SPLIT_PANE_HEIGHT),
    availableHeight - MIN_SPLIT_PANE_HEIGHT,
  );
};

const HelpDashboard: FC = () => {
  // Chat panel expand state — owned here so the right column can size itself
  // (an expanded chat shares the column 50-50 with the detail view, which shows
  // the OverviewPanel as its default background when nothing is selected).
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  // Detect mobile for responsive layout
  const [isMobile, setIsMobile] = useState(false);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [rightColumnHeight, setRightColumnHeight] = useState(0);
  const [chatPaneRatio, setChatPaneRatio] = useState(0.5);
  // Left/right column split — width of the sidebar in px, drag-resizable.
  const gridRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  // Whether the whole sidebar is collapsed to the narrow status rail.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // NavBar variant for help page
  const navVariant = 'help' as const;
  const navTitle = 'HELP! NEARBY.' as const;

  // Measure the fixed NavBar so content sits flush against its bottom edge with
  // no gap (the NavBar height varies with theme / wrapping). Falls back to a
  // sensible default before the first measurement.
  const [navHeight, setNavHeight] = useState(isMobile ? 190 : 160);
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => setNavHeight(header.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, [isMobile]);

  const paddingTop = `${navHeight}px`;

  useEffect(() => {
    if (isMobile) return;

    const column = rightColumnRef.current;
    if (!column) return;

    const updateHeight = () => {
      setRightColumnHeight(column.getBoundingClientRect().height);
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(column);
    return () => ro.disconnect();
  }, [isMobile]);

  // Keep the sidebar width within bounds as the grid container resizes.
  useEffect(() => {
    if (isMobile) return;
    const grid = gridRef.current;
    if (!grid) return;
    const clamp = () => {
      const width = grid.getBoundingClientRect().width;
      setSidebarWidth((prev) => clampSidebarWidth(prev, width));
    };
    clamp();
    const ro = new ResizeObserver(clamp);
    ro.observe(grid);
    return () => ro.disconnect();
  }, [isMobile]);

  // ── Sidebar panel controls (driven by the top control cell) ──
  // Which panels are selected to view.
  const [selectedPanels, setSelectedPanels] = useState<Set<HelpPanelId>>(
    () => new Set(HELP_PANELS.map((p) => p.id)),
  );
  // Whether to show panels whose source isn't live (not green).
  const [showNonLive, setShowNonLive] = useState(true);
  // Applicability + live status reported by each panel. 311 starts
  // unavailable until it confirms an NYC location; the rest are always-on.
  const [statuses, setStatuses] = useState<Record<HelpPanelId, PanelStatus>>(
    () => {
      const init = {} as Record<HelpPanelId, PanelStatus>;
      for (const p of HELP_PANELS) {
        init[p.id] = {
          available: p.id !== 'nyc311',
          live: false,
          loading: true,
          ok: false,
        };
      }
      return init;
    },
  );
  // Expand/collapse-all command broadcast to the panels.
  const [allExpanded, setAllExpanded] = useState(true);
  const [expandSignal, setExpandSignal] = useState<ExpandSignal>({
    value: true,
    nonce: 0,
  });

  const reportStatus = useCallback((id: HelpPanelId, status: PanelStatus) => {
    setStatuses((prev) => {
      const cur = prev[id];
      if (
        cur &&
        cur.available === status.available &&
        cur.live === status.live &&
        cur.loading === status.loading &&
        cur.ok === status.ok
      ) {
        return prev;
      }
      return { ...prev, [id]: status };
    });
  }, []);

  const togglePanel = useCallback((id: HelpPanelId) => {
    setSelectedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleExpandAll = useCallback(() => {
    setAllExpanded((prev) => {
      const next = !prev;
      setExpandSignal((s) => ({ value: next, nonce: s.nonce + 1 }));
      return next;
    });
  }, []);

  const panelControlValue = useMemo(
    () => ({ reportStatus, expandSignal }),
    [reportStatus, expandSignal],
  );

  // Only panels applicable to the current location appear in the picker.
  const availablePanels = HELP_PANELS.filter((p) => statuses[p.id]?.available);
  const liveStatus = useMemo(() => {
    const map = {} as Record<HelpPanelId, boolean>;
    for (const p of HELP_PANELS) map[p.id] = !!statuses[p.id]?.live;
    return map;
  }, [statuses]);

  // A panel renders when applicable AND selected AND (showing non-live OR live).
  const isPanelVisible = (id: HelpPanelId) =>
    !!statuses[id]?.available &&
    selectedPanels.has(id) &&
    (showNonLive || !!statuses[id]?.live);
  // When collapsed, every slot is hidden (but kept mounted so panels keep
  // reporting status) — the rail renders the visible content instead.
  const panelDisplay = (id: HelpPanelId) =>
    !sidebarCollapsed && isPanelVisible(id) ? undefined : 'none';

  // Expand the sidebar and scroll a panel into view. Slots are display:none
  // while collapsed, so wait two frames for the expand to lay them out before
  // scrolling.
  const expandToPanel = useCallback((id: HelpPanelId) => {
    setSidebarCollapsed(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(`panel-slot-${id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, []);

  const showDesktopSplitDivider = !isMobile && isChatExpanded;
  const chatPaneHeight =
    showDesktopSplitDivider && rightColumnHeight > 0
      ? clampChatPaneHeight(
          rightColumnHeight * chatPaneRatio,
          rightColumnHeight,
        )
      : null;

  const handleSplitPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!rightColumnRef.current || rightColumnHeight <= 0) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const columnRect = rightColumnRef.current.getBoundingClientRect();

      const updateFromPointer = (clientY: number) => {
        const nextHeight = clampChatPaneHeight(
          columnRect.bottom - clientY,
          columnRect.height,
        );
        setChatPaneRatio(nextHeight / columnRect.height);
      };

      updateFromPointer(event.clientY);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateFromPointer(moveEvent.clientY);
      };

      const stopDragging = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', stopDragging);
        window.removeEventListener('pointercancel', stopDragging);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
    },
    [rightColumnHeight],
  );

  const handleColumnPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const grid = gridRef.current;
      if (!grid) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);

      const gridRect = grid.getBoundingClientRect();

      const updateFromPointer = (clientX: number) => {
        setSidebarWidth(
          clampSidebarWidth(clientX - gridRect.left, gridRect.width),
        );
      };

      updateFromPointer(event.clientX);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateFromPointer(moveEvent.clientX);
      };

      const stopDragging = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', stopDragging);
        window.removeEventListener('pointercancel', stopDragging);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
    },
    [],
  );

  return (
    <motion.main
      style={{
        display: 'flex',
        flexDirection: 'column',
        // Full-page (desktop): fill the viewport below the fixed NavBar, with no
        // outer page scroll. The NewsTicker now sits in-flow at the top (just
        // under the NavBar). Mobile falls back to a normal scrolling column.
        height: isMobile ? 'auto' : '100vh',
        minHeight: isMobile ? '100vh' : undefined,
        overflow: isMobile ? undefined : 'hidden',
        width: '100%',
        paddingTop: paddingTop,
        paddingBottom: isMobile ? '1rem' : 0,
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        boxSizing: 'border-box',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32 }}
    >
      {/* NavBar */}
      <NavBar variant={navVariant} title={navTitle} showRadar={true} />

      {/* Ticker Strip */}
      <NewsTicker />

      <PanelControlProvider value={panelControlValue}>
        {/* Left sidebar + Right main area */}
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            // Collapsed: two tracks (rail + main) — the drag divider isn't
            // rendered, so omitting its track keeps the main column from being
            // auto-placed into an empty 0px track (which zeroed its width).
            gridTemplateColumns: isMobile
              ? 'minmax(0, 1fr)'
              : sidebarCollapsed
                ? `${COLLAPSED_SIDEBAR_WIDTH}px minmax(0, 1fr)`
                : `${sidebarWidth}px ${COLUMN_DIVIDER_WIDTH}px minmax(0, 1fr)`,
            gap: 0,
            width: '100%',
            // Desktop: grow to fill the space between the NavBar/ticker and the
            // viewport bottom. Each column owns its own scroll, and page-scroll
            // is already prevented by motion.main's overflow:hidden, so this
            // stays `visible` — otherwise it would clip the chat panel's upward
            // hover-lift where it sits flush under the detail view. The chat's
            // NeoPanel raises its z-index on hover so the lift paints cleanly.
            // Mobile: natural height, scrolls with the page.
            flex: isMobile ? undefined : '1 1 auto',
            minHeight: 0,
            overflow: isMobile ? undefined : 'visible',
          }}
        >
          {/* Left sidebar — control cell + all panels, tiled, with its own
              scroll. The container clips at the flush NavBar edge so an upward
              hover-lift on the top panel slides under the bar, not over it. The
              `empty-region` class darkens the area below the last panel so the
              empty space reads as inert. */}
          <div
            className="empty-region"
            style={{
              height: isMobile ? 'auto' : '100%',
              overflowY: isMobile ? 'visible' : 'auto',
              minHeight: 0,
            }}
          >
            <PanelLayout className="panel-stack">
              {/* Mobile keeps a standalone overview card at the top of the
                  stack. On desktop the overview lives in the DetailView as its
                  default background, so the control cell is the top entry. */}
              {isMobile && (
                <div className="panel-slot">
                  <OverviewPanel />
                </div>
              )}
              {/* Static control cell. It elevates its own stacking only while
                  its dropdown is open, so the panel below can still hover-lift
                  over the control row. */}
              <PanelControlCell
                panels={availablePanels}
                selected={selectedPanels}
                onTogglePanel={togglePanel}
                liveStatus={liveStatus}
                allExpanded={allExpanded}
                onToggleExpandAll={toggleExpandAll}
                showNonLive={showNonLive}
                onToggleShowNonLive={() => setShowNonLive((v) => !v)}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
                hasItemAbove={true}
              />
              <div
                id="panel-slot-alerts"
                className="panel-slot"
                style={{ display: panelDisplay('alerts') }}
              >
                <AlertPanel />
              </div>
              <div
                id="panel-slot-resources"
                className="panel-slot"
                style={{ display: panelDisplay('resources') }}
              >
                <ResourcesPanel detailEnabled={!isMobile} />
              </div>
              <div
                id="panel-slot-community"
                className="panel-slot"
                style={{ display: panelDisplay('community') }}
              >
                <CommunityPanel />
              </div>
              <div
                id="panel-slot-nyc311"
                className="panel-slot"
                style={{ display: panelDisplay('nyc311') }}
              >
                <NYC311Panel />
              </div>
              <div
                id="panel-slot-updates"
                className="panel-slot"
                style={{ display: panelDisplay('updates') }}
              >
                <UpdatesPanel />
              </div>
              {/* Collapsed: the status rail is the visible body (panels above
                  stay mounted but display:none so they keep reporting status).
                  Expanded desktop: a filler continues the panel box's borders to
                  the bottom of the column when the panels don't fill it. Both
                  collapse their top border onto the cell above via the -2px rule.
                  Mobile: the page scrolls, no gap to fill. */}
              {sidebarCollapsed ? (
                <SidebarRail
                  panels={availablePanels}
                  statuses={statuses}
                  onExpandToPanel={expandToPanel}
                />
              ) : (
                !isMobile && <div className="panel-stack-filler" />
              )}
            </PanelLayout>
          </div>

          {/* Vertical split handle — drag to resize the sidebar / main columns.
              Occupies the grid's middle track and draws a single seam line with
              a yellow grip, mirroring the horizontal pane divider. Hidden while
              the sidebar is collapsed to the fixed-width rail. */}
          {!isMobile && !sidebarCollapsed && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar and main panes"
              onPointerDown={handleColumnPointerDown}
              style={{
                position: 'relative',
                // Above the right column's horizontal split divider (zIndex 4) so
                // the sidebar grip paints over it where the two seams cross.
                zIndex: 6,
                cursor: 'col-resize',
                touchAction: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg)',
              }}
            >
              <div
                style={{
                  width: 2,
                  height: '100%',
                  background: 'var(--color-text)',
                  opacity: 0.9,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: 4,
                  height: 42,
                  background: '#FFB000',
                  border: '1px solid var(--color-text)',
                }}
              />
            </div>
          )}

          {/* Right main area — Resource Detail and Chat share this desktop
              workspace. When both are open, a horizontal split handle lets the
              user resize the panes; otherwise the available pane claims the
              workspace without the chat measuring itself. */}
          {!isMobile && (
            <div
              ref={rightColumnRef}
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
                overflow: 'visible',
              }}
            >
              <div
                className="empty-region"
                style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  minHeight: 0,
                }}
              >
                <DetailView />
              </div>
              {showDesktopSplitDivider && (
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  aria-label="Resize resource detail and chat panes"
                  onPointerDown={handleSplitPointerDown}
                  style={{
                    position: 'relative',
                    zIndex: 4,
                    flex: `0 0 ${SPLIT_DIVIDER_HEIGHT}px`,
                    marginLeft: -2,
                    cursor: 'row-resize',
                    touchAction: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-bg)',
                    borderLeft: '2px solid var(--color-text)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      // height: 2,
                      // background: 'var(--color-text)',
                      opacity: 0.9,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      width: 42,
                      height: 4,
                      background: '#FFB000',
                      border: '1px solid var(--color-text)',
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  flex:
                    showDesktopSplitDivider && chatPaneHeight !== null
                      ? `0 0 ${chatPaneHeight}px`
                      : isChatExpanded
                        ? '1 1 auto'
                        : '0 0 auto',
                  minHeight: 0,
                  marginLeft: -2,
                  marginTop: showDesktopSplitDivider ? 0 : -2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ChatPanel
                  isExpanded={isChatExpanded}
                  onToggle={() => setIsChatExpanded((v) => !v)}
                  fill={!isMobile && isChatExpanded}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile: chat stacks at the bottom of the page at natural height. */}
        {isMobile && (
          <ChatPanel
            isExpanded={isChatExpanded}
            onToggle={() => setIsChatExpanded((v) => !v)}
            fill={false}
          />
        )}
      </PanelControlProvider>
    </motion.main>
  );
};

const HelpPage: FC = () => {
  return (
    <DashboardProvider>
      <HelpDashboard />
    </DashboardProvider>
  );
};

export default HelpPage;
