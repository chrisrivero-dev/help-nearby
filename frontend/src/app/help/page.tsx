'use client';

import type { FC } from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ResourceDetailView } from '@/components/help/ResourceDetailView';
import { ChatPanel } from '@/components/help/ChatPanel';
import type { NearbyResource } from '@/lib/resources/schema';

const HelpDashboard: FC = () => {
  // Overview panel state
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);
  // Detect mobile for responsive layout
  const [isMobile, setIsMobile] = useState(false);
  const [selectedResource, setSelectedResource] =
    useState<NearbyResource | null>(null);
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
        init[p.id] = { available: p.id !== 'nyc311', live: false };
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
        cur.live === status.live
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
  const panelDisplay = (id: HelpPanelId) =>
    isPanelVisible(id) ? undefined : 'none';

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
        {/* Full-width OverviewPanel - above the 2-column grid. Wrapped in a
            relatively-positioned, elevated layer so its upward hover-lift paints
            over the NewsTicker above it instead of sliding behind it. The -2px
            top margin overlaps the panel's top border onto the ticker's bottom
            border so they collapse into one line at rest, while keeping the
            border present so it shows when the panel lifts. */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: -2 }}>
          <OverviewPanel
            isExpanded={isOverviewExpanded}
            onToggle={() => setIsOverviewExpanded((v) => !v)}
          />
        </div>

        {/* Left sidebar + Right main area */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'minmax(0, 1fr)'
              : 'clamp(320px, 32%, 440px) minmax(0, 1fr)',
            gap: 0,
            width: '100%',
            // Desktop: grow to fill the space between the OverviewPanel and the
            // viewport bottom, clipping so each column owns its own scroll.
            // Mobile: natural height, scrolls with the page.
            flex: isMobile ? undefined : '1 1 auto',
            minHeight: 0,
            overflow: isMobile ? undefined : 'hidden',
          }}
        >
          {/* Left sidebar — control cell + all panels, tiled, with its own
              scroll. The container clips at the flush NavBar edge so an upward
              hover-lift on the top panel slides under the bar, not over it. */}
          <div
            style={{
              height: isMobile ? 'auto' : '100%',
              overflowY: isMobile ? 'visible' : 'auto',
              minHeight: 0,
            }}
          >
            <PanelLayout className="panel-stack">
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
              />
              <div
                className="panel-slot"
                style={{ display: panelDisplay('alerts') }}
              >
                <AlertPanel />
              </div>
              <div
                className="panel-slot"
                style={{ display: panelDisplay('resources') }}
              >
                <ResourcesPanel
                  onSelectResource={isMobile ? undefined : setSelectedResource}
                  selectedResourceId={selectedResource?.id}
                />
              </div>
              <div
                className="panel-slot"
                style={{ display: panelDisplay('community') }}
              >
                <CommunityPanel />
              </div>
              <div
                className="panel-slot"
                style={{ display: panelDisplay('nyc311') }}
              >
                <NYC311Panel />
              </div>
              <div
                className="panel-slot"
                style={{ display: panelDisplay('updates') }}
              >
                <UpdatesPanel />
              </div>
              {/* Filler: continues the panel box's left/right/bottom borders
                  down to the bottom of the column when the panels don't fill it,
                  so the sidebar reads as one bordered region. Its top border
                  collapses with the last panel via the shared -2px stack rule.
                  Desktop only — on mobile the page scrolls and there is no gap
                  to fill. */}
              {!isMobile && <div className="panel-stack-filler" />}
            </PanelLayout>
          </div>

          {/* Right main area — Resource Detail scrolls in the flexible top
              region; the Chat panel stays anchored at the bottom (above the
              NewsTicker) and opens/closes upward with its own fluid animation.
              Always present on desktop so the chat has a home even when no
              resource is selected. */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: 0,
              }}
            >
              {/* Flexible top region: grows to push the chat to the bottom and
                  shrinks as the chat expands. Holds the detail view when a
                  resource is selected, otherwise stays empty. */}
              <div
                style={{
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  minHeight: 0,
                }}
              >
                {selectedResource && (
                  <ResourceDetailView
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                  />
                )}
              </div>
              {/* Bottom-anchored chat. flex-shrink keeps it bounded by the
                  column; its messages area scrolls internally. The -2px left
                  margin overlaps the chat's left border onto the sidebar's
                  right border so the two 2px borders collapse into one line
                  instead of doubling into a 4px seam (align-items: stretch
                  keeps the right edge flush with the column). */}
              <div style={{ flex: '0 1 auto', minHeight: 0, marginLeft: -2 }}>
                <ChatPanel />
              </div>
            </div>
          )}
        </div>

        {/* Mobile: chat stacks at the bottom of the page at natural height. */}
        {isMobile && <ChatPanel />}
      </PanelControlProvider>
    </motion.main>
  );
};

const HelpPage: FC = () => {
  return <HelpDashboard />;
};

export default HelpPage;
