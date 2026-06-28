'use client';

import { useEffect } from 'react';
import { useGrounding } from '@/components/help/DashboardContext';
import type { GroundingItem } from '@/components/help/DashboardContext';

/** Cap on how many items a panel exposes to the chat grounding bus, to bound the
 *  system-prompt token cost. Shared across all panels. */
export const GROUNDING_ITEM_CAP = 25;

/**
 * Publish a panel's currently-shown list to the chat grounding bus, so the chat
 * panel can see (and reference) what this panel is showing for the location.
 *
 * Pass the full filtered list as `items` (the hook caps it to
 * `GROUNDING_ITEM_CAP` and reports the pre-cap length as `totalCount`). Pass
 * `null`/empty to clear this panel's grounding; it also clears on unmount.
 */
export const usePublishGrounding = (
  panelId: string,
  label: string,
  items: GroundingItem[] | null,
  filters?: { query?: string; categories?: string[] },
): void => {
  const { publishPanelGrounding } = useGrounding();

  useEffect(() => {
    if (!items || items.length === 0) {
      publishPanelGrounding(panelId, null);
      return;
    }
    publishPanelGrounding(panelId, {
      panelId,
      label,
      items: items.slice(0, GROUNDING_ITEM_CAP),
      totalCount: items.length,
      filters,
    });
  }, [panelId, label, items, filters, publishPanelGrounding]);

  // Clear this panel's grounding when it unmounts.
  useEffect(
    () => () => publishPanelGrounding(panelId, null),
    [panelId, publishPanelGrounding],
  );
};
