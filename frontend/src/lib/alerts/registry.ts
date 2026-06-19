/**
 * Alerts registry — the scoped source list feeding AlertPanel. Built on the
 * shared registry core (resolver-based selection + fan-out), typed to WeatherAlert.
 * Today it's NWS (national); city/state alert feeds register in alerts.sources.json
 * scoped to place:/state: ids and are selected automatically for matching points.
 * See docs/location-data-network.md §5b.
 */
import alertsData from '@/data/alerts.sources.json';
import {
  selectByJurisdiction,
  fanOut,
  type CheckedSource,
} from '@/lib/registry/core';
import { reliableRun } from '@/lib/registry/reliability';
import type { AlertSourceRow, WeatherAlert } from './types';

const ROWS = alertsData as unknown as AlertSourceRow[];

const ALERT_CACHE_TTL_SECONDS = 300;
const roundCoord = (n: number) => n.toFixed(2);

const NWS_USER_AGENT = 'HelpNearby/1.0 (https://helpnearby.co)';

type NwsFeature = {
  id?: string;
  properties?: {
    id?: string;
    event?: string;
    headline?: string;
    description?: string;
    instruction?: string;
    severity?: string;
    urgency?: string;
    certainty?: string;
    effective?: string;
    expires?: string;
    areaDesc?: string;
    web?: string;
  };
};

/** Fetch + normalize NWS active alerts. Throws on failure so fan-out marks it down. */
async function fetchNwsWeather(
  lat: number,
  lng: number,
): Promise<WeatherAlert[]> {
  const url = `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lng.toFixed(4)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`nws_http_${res.status}`);
  const data = (await res.json()) as { features?: NwsFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];
  return features.map((feature, index) => {
    const p = feature.properties || {};
    return {
      id: p.id || feature.id || `nws-alert-${index}`,
      title: p.event || 'Weather Alert',
      headline: p.headline || p.event || 'Official weather alert',
      description: p.description || '',
      instruction: p.instruction || '',
      severity: p.severity || 'Unknown',
      urgency: p.urgency || 'Unknown',
      certainty: p.certainty || 'Unknown',
      effective: p.effective || null,
      expires: p.expires || null,
      area: p.areaDesc || '',
      url: p.web || 'https://www.weather.gov/',
    };
  });
}

const ADAPTERS: Record<
  AlertSourceRow['sourceType'],
  (lat: number, lng: number) => Promise<WeatherAlert[]>
> = {
  'nws-weather': fetchNwsWeather,
};

export interface AlertsResult {
  alerts: WeatherAlert[];
  checked: CheckedSource[];
  degraded: boolean;
}

/** Active alerts for a point, from every alert source scoped to it. */
export async function fetchAlerts(
  lat: number,
  lng: number,
): Promise<AlertsResult> {
  const rows = await selectByJurisdiction(ROWS, lat, lng);
  const run = reliableRun(
    (row: AlertSourceRow) => ADAPTERS[row.sourceType](lat, lng),
    {
      cacheKeyFor: (row) => `${row.id}:${roundCoord(lat)},${roundCoord(lng)}`,
      ttlSecondsFor: (row) => row.ttlSeconds ?? ALERT_CACHE_TTL_SECONDS,
    },
  );
  const { items, checked, degraded } = await fanOut(rows, run);
  return { alerts: items, checked, degraded };
}
