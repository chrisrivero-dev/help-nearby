/**
 * Reconciliation — merges the raw resources returned by multiple sources into one
 * trustworthy record per real-world entity. Dense areas (NYC) surface the same
 * facility in several feeds (city + state + nonprofit + national); this layer
 * dedupes them, resolves field conflicts by source trust, and records per-field
 * provenance so the UI can attribute each value. See docs/location-data-network.md §7.
 *
 * Entity match = any TWO of three signals agree: normalized name, normalized
 * address, geospatial proximity (~50m). Two of three tolerates one feed having a
 * typo'd name, a missing address, or a slightly-off geocode without over-merging.
 */
import { haversineDistanceMiles } from '@/lib/location/distance';
import type { FieldProvenance, NearbyResource } from './schema';

const GEO_MATCH_MILES = 0.0311; // ~50m
const NAME_SIM_THRESHOLD = 0.8;

// ── Normalization ────────────────────────────────────────────────────────────

const NAME_DROP = new Set([
  'the', 'inc', 'incorporated', 'llc', 'corp', 'co', 'ltd',
]);

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['`"]/g, '') // strip apostrophes so "Mary's" -> "marys"
    .replace(/[.,()/-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !NAME_DROP.has(t))
    .join(' ')
    .trim();
}

const ADDR_REPLACERS: Array<[RegExp, string]> = [
  [/\bstreet\b/g, 'st'],
  [/\bavenue\b/g, 'ave'],
  [/\bboulevard\b/g, 'blvd'],
  [/\bdrive\b/g, 'dr'],
  [/\broad\b/g, 'rd'],
  [/\blane\b/g, 'ln'],
  [/\bplace\b/g, 'pl'],
  [/\bcourt\b/g, 'ct'],
  [/\bnorth\b/g, 'n'],
  [/\bsouth\b/g, 's'],
  [/\beast\b/g, 'e'],
  [/\bwest\b/g, 'w'],
];

export function normalizeAddress(raw: string): string {
  let s = raw
    .toLowerCase()
    .replace(/[.,'`"]/g, ' ')
    // Drop secondary unit designators and everything after them.
    .replace(/\b(suite|ste|unit|apt|apartment|fl|floor|room|rm|#).*$/g, ' ');
  for (const [re, to] of ADDR_REPLACERS) s = s.replace(re, to);
  // Strip ordinal suffixes on numbers: "42nd" -> "42".
  s = s.replace(/(\d+)(st|nd|rd|th)\b/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
}

/** Token Dice coefficient — robust to word order and minor extra tokens. */
function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return (2 * inter) / (ta.size + tb.size);
}

// ── Entity matching ──────────────────────────────────────────────────────────

export function isSameEntity(a: NearbyResource, b: NearbyResource): boolean {
  const nameMatch =
    diceSimilarity(normalizeName(a.name), normalizeName(b.name)) >=
    NAME_SIM_THRESHOLD;

  const addrMatch =
    !!a.address &&
    !!b.address &&
    normalizeAddress(a.address) === normalizeAddress(b.address);

  const geoMatch =
    typeof a.latitude === 'number' &&
    typeof a.longitude === 'number' &&
    typeof b.latitude === 'number' &&
    typeof b.longitude === 'number' &&
    haversineDistanceMiles(a.latitude, a.longitude, b.latitude, b.longitude) <=
      GEO_MATCH_MILES;

  return Number(nameMatch) + Number(addrMatch) + Number(geoMatch) >= 2;
}

// ── Merge ────────────────────────────────────────────────────────────────────

const MERGE_FIELDS: Array<keyof NearbyResource> = [
  'name', 'address', 'city', 'state', 'zip', 'phone', 'website',
  'latitude', 'longitude', 'updatedAt',
];

function trustOf(r: NearbyResource): number {
  return r.trust ?? 0;
}

function hasValue(v: unknown): boolean {
  return v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');
}

/** Merge a cluster of same-entity records into one canonical record. */
function mergeCluster(cluster: NearbyResource[]): NearbyResource {
  // Highest trust first; stable for equal trust so input order breaks ties.
  const ordered = [...cluster].sort((a, b) => trustOf(b) - trustOf(a));
  const primary = ordered[0];

  const merged: NearbyResource = { ...primary };
  const fieldProvenance: Record<string, FieldProvenance> = {};

  for (const field of MERGE_FIELDS) {
    const winner = ordered.find((r) => hasValue(r[field]));
    if (!winner) continue;
    (merged[field] as unknown) = winner[field];
    fieldProvenance[field as string] = {
      sourceName: winner.sourceName,
      trust: trustOf(winner),
      fetchedAt: winner.lastChecked,
    };
  }

  const contributingSources = Array.from(
    new Set(ordered.map((r) => r.sourceName)),
  );

  return {
    ...merged,
    isLive: cluster.some((r) => r.isLive),
    contributingSources,
    fieldProvenance,
  };
}

/**
 * Cluster resources by entity and merge each cluster. Greedy single-pass: each
 * resource joins the first existing cluster it matches, else starts a new one.
 * Result sets here are small (tens to low hundreds), so O(n·clusters) is fine.
 */
export function reconcileResources(
  resources: NearbyResource[],
): NearbyResource[] {
  const clusters: NearbyResource[][] = [];

  for (const r of resources) {
    const cluster = clusters.find((c) => c.some((m) => isSameEntity(m, r)));
    if (cluster) cluster.push(r);
    else clusters.push([r]);
  }

  return clusters.map(mergeCluster);
}
