/**
 * Resolves a lat/lng to an ordered jurisdiction stack (most-specific first).
 *
 * Strategy — local bundle first, Census API as backup:
 *   1. Bundled high-fidelity polygons (NYC's 5 counties + LA/Cook County for
 *      counties; NYC + LA + Chicago city for places) → point-in-polygon, fully
 *      offline.
 *   2. On a local county miss, fall back to the Census geographies API (exact,
 *      rare path). Never throws — worst case returns just [NATIONAL].
 *
 * The order returned IS the source-selection fallback order. See
 * docs/location-data-network.md §3–§4. The bundled coverage is hub-first by
 * design (NYC = accuracy gold standard, LA = default hub, Chicago = scale
 * proof); the national county bundle is a documented follow-up.
 */
import countiesData from '@/data/geo/counties.json';
import placesData from '@/data/geo/places.json';
import {
  findContainingFeature,
  featureBBox,
  type FeatureCollection,
} from './geo/pointInPolygon';
import {
  NATIONAL,
  placeId,
  countyId,
  stateId,
  stateFipsFromCounty,
  type Jurisdiction,
} from './jurisdiction';

const counties = countiesData as unknown as FeatureCollection;
const places = placesData as unknown as FeatureCollection;

// ── Density-aware resolution cache ───────────────────────────────────────────
// Repeated searches in the same area resolve for free. Dense hubs use a finer
// key (~110m) so distinct neighborhoods don't collapse into one bucket;
// elsewhere ~1.1km is plenty. Same module-level Map pattern as locationLookup.ts.
const _cache = new Map<string, Jurisdiction[]>();

/** Union bbox of the bundled place polygons = the dense-hub footprint. */
const HUB_BBOXES = places.features.map(featureBBox);

function inHub(lat: number, lng: number): boolean {
  return HUB_BBOXES.some(
    (b) =>
      lng >= b.minLng && lng <= b.maxLng && lat >= b.minLat && lat <= b.maxLat,
  );
}

function cacheKey(lat: number, lng: number): string {
  const p = inHub(lat, lng) ? 3 : 2;
  return `${lat.toFixed(p)},${lng.toFixed(p)}`;
}

function geoidName(f: { properties: Record<string, unknown> }) {
  return {
    geoid: String(f.properties.GEOID),
    name: String(f.properties.NAME ?? ''),
  };
}

export async function resolveJurisdictions(
  lat: number,
  lng: number,
): Promise<Jurisdiction[]> {
  const key = cacheKey(lat, lng);
  const hit = _cache.get(key);
  if (hit) return hit;

  const stack: Jurisdiction[] = [];

  // 1) Local place (only the bundled hub cities).
  const placeHit = findContainingFeature(lng, lat, places);
  if (placeHit) {
    const { geoid, name } = geoidName(placeHit);
    stack.push({
      id: placeId(geoid),
      level: 'place',
      name,
      fips: geoid,
      source: 'local',
    });
  }

  // 2) Local county (+ derived state).
  const countyHit = findContainingFeature(lng, lat, counties);
  if (countyHit) {
    const { geoid, name } = geoidName(countyHit);
    const stateFips = stateFipsFromCounty(geoid);
    stack.push(
      {
        id: countyId(geoid),
        level: 'county',
        name,
        fips: geoid,
        source: 'local',
      },
      {
        id: stateId(stateFips),
        level: 'state',
        name: '',
        fips: stateFips,
        source: 'local',
      },
    );
  } else {
    // 3) Local miss → Census API backup (exact, rare).
    stack.push(...(await censusFallback(lat, lng)));
  }

  // 4) National catch-all is always last (drives the final fallback to
  //    national feeds like HRSA).
  stack.push(NATIONAL);

  _cache.set(key, stack);
  return stack;
}

/**
 * Census geographies API — resolves county + state FIPS for a point exactly.
 * Only called on a local-bundle miss. Never throws.
 */
async function censusFallback(
  lat: number,
  lng: number,
): Promise<Jurisdiction[]> {
  try {
    const url =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current` +
      `&layers=Counties,States&format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const geographies = (await res.json())?.result?.geographies ?? {};
    const county = geographies['Counties']?.[0];
    if (!county?.GEOID) return [];
    const stateFips = String(
      county.STATE ?? stateFipsFromCounty(String(county.GEOID)),
    );
    return [
      {
        id: countyId(String(county.GEOID)),
        level: 'county',
        name: String(county.NAME ?? ''),
        fips: String(county.GEOID),
        source: 'census-api',
      },
      {
        id: stateId(stateFips),
        level: 'state',
        name: '',
        fips: stateFips,
        source: 'census-api',
      },
    ];
  } catch {
    return []; // resolver still returns [NATIONAL]
  }
}

/** Test/diagnostic helper. */
export function _clearResolverCache(): void {
  _cache.clear();
}
