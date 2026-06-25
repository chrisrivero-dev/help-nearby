'use client';

import { createContext, useContext } from 'react';

/** Stable identifiers for the sidebar panels, in display order. */
export type HelpPanelId =
  | 'alerts'
  | 'resources'
  | 'community'
  | 'nyc311'
  | 'updates';

/** Registry of sidebar panels (id + dropdown label), in display order. */
export const HELP_PANELS: { id: HelpPanelId; label: string }[] = [
  { id: 'alerts', label: 'ALERTS! NEARBY' },
  { id: 'resources', label: 'RESOURCES! NEARBY' },
  { id: 'community', label: 'COMMUNITY! NEARBY' },
  { id: 'nyc311', label: '311! NEARBY' },
  { id: 'updates', label: 'UPDATES! NEARBY' },
];

/** Broadcast command for expand/collapse-all. `nonce` bumps on each press so
 *  panels only react to a fresh command, not their initial mount. */
export interface ExpandSignal {
  value: boolean;
  nonce: number;
}

export interface PanelStatus {
  /** Whether this panel applies to the current location (e.g. 311 → NYC only).
   *  Non-applicable panels are dropped from the control picker and not shown. */
  available: boolean;
  /** Whether the panel's source is live (green / connected API). */
  live: boolean;
}

export interface PanelControlValue {
  /** A panel reports its applicability + live status. */
  reportStatus: (id: HelpPanelId, status: PanelStatus) => void;
  /** Latest expand/collapse-all command. */
  expandSignal: ExpandSignal;
}

const PanelControlContext = createContext<PanelControlValue | null>(null);

export const PanelControlProvider = PanelControlContext.Provider;

/** Returns the panel-control context, or null when rendered outside a provider. */
export const usePanelControl = (): PanelControlValue | null =>
  useContext(PanelControlContext);
