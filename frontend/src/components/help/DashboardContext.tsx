'use client';

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * A panel-agnostic, openable detail item. Any panel can push one of these into
 * the shared DetailView via `openDetail`. `kind` selects the renderer; `id` is
 * stable and unique across panels (used for chat `[[open:<id>]]` markers and for
 * highlighting the active row); `payload` is the panel-specific data the renderer
 * needs.
 */
export interface DetailDescriptor<T = unknown> {
  kind: string;
  id: string;
  title: string;
  payload: T;
  /** Optional richer text for the chat system prompt (falls back to `title`). */
  groundingSummary?: string;
}

/** One openable option a panel exposes to the chat ("the lists to the left"). */
export interface GroundingItem {
  /** Full + openable, so chat markers resolve back to a real `openDetail`. */
  descriptor: DetailDescriptor;
  /** One line the model sees (e.g. title · category · distance · address). */
  groundingText: string;
}

/** A panel's contribution to chat grounding. */
export interface PanelGrounding {
  panelId: string;
  /** Human label for the grounding section, e.g. 'Resources'. */
  label: string;
  /** Capped list of openable items (panels cap their own length). */
  items: GroundingItem[];
  /** Total matches before the cap, so the prompt can note truncation. */
  totalCount: number;
  filters?: { query?: string; categories?: string[] };
}

interface DashboardContextValue {
  // ── Universal detail channel ──
  detail: DetailDescriptor | null;
  openDetail: (d: DetailDescriptor) => void;
  closeDetail: () => void;
  // ── Grounding bus (one entry per panel) ──
  panelGrounding: Record<string, PanelGrounding>;
  publishPanelGrounding: (panelId: string, g: PanelGrounding | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/** Throwing accessor — use inside the DashboardProvider tree. */
export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};

/** Non-throwing accessor — returns null when outside a provider (tests/isolation). */
export const useOptionalDashboard = (): DashboardContextValue | null =>
  useContext(DashboardContext);

/** Focused hook for the detail channel. */
export const useDetail = () => {
  const { detail, openDetail, closeDetail } = useDashboard();
  return { detail, openDetail, closeDetail };
};

/** Focused hook for the grounding bus. */
export const useGrounding = () => {
  const { panelGrounding, publishPanelGrounding } = useDashboard();
  return { panelGrounding, publishPanelGrounding };
};

export const DashboardProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [detail, setDetail] = useState<DetailDescriptor | null>(null);
  const [panelGrounding, setPanelGrounding] = useState<
    Record<string, PanelGrounding>
  >({});

  const openDetail = useCallback((d: DetailDescriptor) => setDetail(d), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  // Stable so panel publish-effects don't loop. Publishing `null` clears the
  // panel's grounding (e.g. on unmount or when its list becomes unavailable).
  const publishPanelGrounding = useCallback(
    (panelId: string, g: PanelGrounding | null) => {
      setPanelGrounding((prev) => {
        if (g === null) {
          if (!(panelId in prev)) return prev;
          const next = { ...prev };
          delete next[panelId];
          return next;
        }
        return { ...prev, [panelId]: g };
      });
    },
    [],
  );

  const value = useMemo<DashboardContextValue>(
    () => ({
      detail,
      openDetail,
      closeDetail,
      panelGrounding,
      publishPanelGrounding,
    }),
    [detail, openDetail, closeDetail, panelGrounding, publishPanelGrounding],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
