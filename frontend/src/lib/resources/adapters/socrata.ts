import type { NearbyResource, NearbyQuery, SourceType } from '../schema';

/**
 * Generic adapter for Socrata Open Data (SODA) JSON endpoints — the platform
 * behind NYC, LA, SF, Chicago, Cook County, many states, etc. One adapter unlocks
 * a large swath of US municipal data. See docs/location-data-network.md §6.
 *
 * Spatial filtering is server-side via SoQL `$where`, in one of two modes:
 *   - point:  within_circle(<field>, lat, lng, meters)  — for true location cols
 *   - latlng: numeric bbox on separate lat/lng columns   — the common NYC case,
 *             where datasets expose `latitude`/`longitude` rather than a point.
 */

export interface SocrataFieldMap {
  id?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  /** Required for latlng geo mode; optional for point mode if present. */
  latitude?: string;
  longitude?: string;
  updatedAt?: string;
}

export type SocrataGeo =
  | { kind: 'point'; field: string }
  | { kind: 'latlng'; latField: string; lngField: string };

export interface SocrataAdapterConfig {
  /** Resource URL, e.g. https://data.cityofnewyork.us/resource/9d9t-bmk7.json */
  endpoint: string;
  geo: SocrataGeo;
  fieldMap: SocrataFieldMap;
  /** Extra SoQL filter ANDed with the spatial clause. */
  where?: string;
  /** Max rows pulled before client-side distance work. Default 500. */
  limit?: number;
  /** Timeout in ms. Default 6000. */
  timeoutMs?: number;
}

export interface SourceMetaLite {
  id: string;
  name: string;
  url: string;
  sourceType: SourceType;
  category: NearbyResource['category'];
}

const MILES_PER_DEG_LAT = 69.0;

function pickStr(row: Record<string, unknown>, key?: string): string | undefined {
  if (!key) return undefined;
  const v = row[key];
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

function pickNum(row: Record<string, unknown>, key?: string): number | undefined {
  if (!key) return undefined;
  const v = row[key];
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

interface ParsedLocation {
  lat?: number;
  lng?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Socrata's nested `location` point-column type:
 *   { latitude, longitude, human_address: '{"address":..,"city":..,"state":..,"zip":..}' }
 * Extracts coords + the embedded postal address. Very common across Socrata, so
 * point-geo sources get address fields for free when the row lacks flat columns.
 */
function parseLocationObject(value: unknown): ParsedLocation {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;
  const out: ParsedLocation = {};
  const lat = Number(obj.latitude);
  const lng = Number(obj.longitude);
  if (Number.isFinite(lat)) out.lat = lat;
  if (Number.isFinite(lng)) out.lng = lng;
  const ha = obj.human_address;
  if (typeof ha === 'string') {
    try {
      const parsed = JSON.parse(ha) as Record<string, string>;
      out.address = parsed.address?.trim() || undefined;
      out.city = parsed.city?.trim() || undefined;
      out.state = parsed.state?.trim() || undefined;
      out.zip = parsed.zip?.trim() || undefined;
    } catch {
      /* leave address fields undefined */
    }
  }
  return out;
}

/** Bounding box (in degrees) that encloses the query radius. */
function radiusBBox(lat: number, lng: number, radiusMiles: number) {
  const latDelta = radiusMiles / MILES_PER_DEG_LAT;
  const cos = Math.cos((lat * Math.PI) / 180);
  const lngDelta = radiusMiles / (MILES_PER_DEG_LAT * Math.max(cos, 0.01));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

function buildWhere(cfg: SocrataAdapterConfig, q: NearbyQuery): string {
  const meters = q.radiusMiles * 1609.34;
  let spatial: string;
  if (cfg.geo.kind === 'point') {
    spatial = `within_circle(${cfg.geo.field}, ${q.latitude}, ${q.longitude}, ${meters})`;
  } else {
    const b = radiusBBox(q.latitude, q.longitude, q.radiusMiles);
    const { latField, lngField } = cfg.geo;
    spatial =
      `${latField} > ${b.minLat} AND ${latField} < ${b.maxLat} AND ` +
      `${lngField} > ${b.minLng} AND ${lngField} < ${b.maxLng}`;
  }
  return cfg.where ? `(${cfg.where}) AND (${spatial})` : spatial;
}

export async function querySocrata(
  cfg: SocrataAdapterConfig,
  source: SourceMetaLite,
  q: NearbyQuery,
): Promise<NearbyResource[]> {
  const params = new URLSearchParams({
    $where: buildWhere(cfg, q),
    $limit: String(cfg.limit ?? 500),
  });

  // Optional app token raises Socrata rate limits; works without it.
  const token = process.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['X-App-Token'] = token;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 6000);
  let rows: Record<string, unknown>[];
  try {
    const res = await fetch(`${cfg.endpoint}?${params.toString()}`, {
      signal: controller.signal,
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`socrata_http_${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error('socrata_unexpected_body');
    rows = json as Record<string, unknown>[];
  } finally {
    clearTimeout(timer);
  }

  const lastChecked = new Date().toISOString();
  const out: NearbyResource[] = [];
  for (const row of rows) {
    const name = pickStr(row, cfg.fieldMap.name);
    if (!name) continue;

    const latField =
      cfg.geo.kind === 'latlng' ? cfg.geo.latField : cfg.fieldMap.latitude;
    const lngField =
      cfg.geo.kind === 'latlng' ? cfg.geo.lngField : cfg.fieldMap.longitude;
    const lat = pickNum(row, latField);
    const lng = pickNum(row, lngField);

    const rawId = pickStr(row, cfg.fieldMap.id);
    const id = rawId
      ? `${source.id}:${rawId}`
      : `${source.id}:${name}:${lat ?? '?'},${lng ?? '?'}`;

    out.push({
      id,
      name,
      category: source.category,
      address: pickStr(row, cfg.fieldMap.address),
      city: pickStr(row, cfg.fieldMap.city),
      state: pickStr(row, cfg.fieldMap.state),
      zip: pickStr(row, cfg.fieldMap.zip),
      phone: pickStr(row, cfg.fieldMap.phone),
      website: pickStr(row, cfg.fieldMap.website),
      latitude: lat,
      longitude: lng,
      sourceName: source.name,
      sourceUrl: source.url,
      sourceType: source.sourceType,
      lastChecked,
      updatedAt: pickStr(row, cfg.fieldMap.updatedAt),
      isLive: true,
    });
  }
  return out;
}
