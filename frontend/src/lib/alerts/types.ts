import type { BaseSourceRow } from '@/lib/registry/core';

/**
 * Weather/emergency alert shape consumed by AlertPanel. One alert = an active
 * hazard advisory for the user's area. Kept identical to the legacy
 * /api/weather-alerts payload so the panel contract is unchanged.
 */
export interface WeatherAlert {
  id: string;
  title: string;
  headline: string;
  description: string;
  instruction: string;
  severity: string;
  urgency: string;
  certainty: string;
  effective: string | null;
  expires: string | null;
  area: string;
  url: string;
}

/** Adapter kinds available to the alerts domain. */
export type AlertSourceType = 'nws-weather';

export interface AlertSourceRow extends BaseSourceRow {
  sourceType: AlertSourceType;
}
