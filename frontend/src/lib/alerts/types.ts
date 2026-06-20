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
  /** Per-item provenance — the registry stamps these from the source row so the
   *  panel can attribute each alert (NWS vs CAL FIRE vs a city crime feed). */
  sourceName?: string;
  sourceUrl?: string;
  /** Event location + source trust. Stamped by adapters/registry and used to
   *  consolidate the same event reported by multiple sources (e.g. a wildfire
   *  from both CAL FIRE and NASA EONET). Not required for rendering. */
  latitude?: number;
  longitude?: number;
  trust?: number;
}

/** Adapter kinds available to the alerts domain. */
export type AlertSourceType =
  | 'nws-weather'
  | 'usgs-earthquake'
  | 'nasa-eonet'
  | 'noaa-tsunami'
  | 'socrata-local-incident'
  | 'calfire'
  | 'airnow'
  | 'openfema-declaration';

export interface SocrataAlertAdapter {
  endpoint: string;
  locationField?: string;
  latField?: string;
  lngField?: string;
  dateField: string;
  titleField: string;
  descriptionField?: string;
  categoryField?: string;
  areaField?: string;
  urlField?: string;
  /** Keep only rows whose `categoryField` value matches one of these (case-insensitive
   *  substring). Used to drop routine notices from a mixed feed (e.g. Notify NYC). */
  includeCategories?: string[];
  days?: number;
  limit?: number;
  radiusKm?: number;
}

/** Config for the openFEMA disaster-declarations adapter. FEMA keys by FIPS:
 *  state is 2-digit, county is 3-digit (e.g. '037' for LA County). */
export interface FemaAlertAdapter {
  stateFips: string;
  countyFips?: string;
  days?: number;
  limit?: number;
}

export type AlertAdapterConfig = SocrataAlertAdapter | FemaAlertAdapter;

export interface AlertSourceRow extends BaseSourceRow {
  sourceType: AlertSourceType;
  adapter?: AlertAdapterConfig;
}
