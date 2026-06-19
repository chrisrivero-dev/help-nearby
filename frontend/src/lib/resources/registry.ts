/**
 * Data-driven source registry. Sources live in src/data/sources.json (data, not
 * code) and are selected by jurisdiction: a point is resolved to its jurisdiction
 * stack (place → county → state → national) and any enabled source whose
 * `jurisdictionId` is in that stack is selected. So an NYC point taps NYC sources,
 * an LA point taps LA sources, and both fall back to national feeds (e.g. HRSA).
 *
 * See docs/location-data-network.md §5. Replaces the bbox-based sourceRegistry.ts.
 */
import sourcesData from '@/data/sources.json';
import { selectByJurisdiction, type BaseSourceRow } from '@/lib/registry/core';
import { runAdapter, type AdapterConfig } from './adapters';
import type {
  NearbyQuery,
  NearbyResource,
  ResourceCategory,
  SourceType,
} from './schema';

export interface SourceRow extends BaseSourceRow {
  sourceType: SourceType;
  category: ResourceCategory;
  adapter: AdapterConfig;
}

/** A selected source with its adapter bound to a fetch() the route can call. */
export interface SelectedSource {
  id: string;
  name: string;
  url: string;
  sourceType: SourceType;
  category: ResourceCategory;
  trust: number;
  /** Cache TTL in seconds (default applied by the caller if unset). */
  ttlSeconds?: number;
  fetch: (q: NearbyQuery) => Promise<NearbyResource[]>;
}

const ROWS = sourcesData as unknown as SourceRow[];

function toSelected(row: SourceRow): SelectedSource {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    sourceType: row.sourceType,
    category: row.category,
    trust: row.trust,
    ttlSeconds: row.ttlSeconds,
    fetch: (q) =>
      runAdapter(
        row.sourceType,
        row.adapter,
        {
          id: row.id,
          name: row.name,
          url: row.url,
          sourceType: row.sourceType,
          category: row.category,
        },
        q,
      ),
  };
}

/**
 * Sources covering a point, most-specific jurisdiction first. Optionally filtered
 * to a category.
 */
export async function selectSources(
  lat: number,
  lng: number,
  category?: ResourceCategory,
): Promise<SelectedSource[]> {
  const rows = await selectByJurisdiction(
    ROWS,
    lat,
    lng,
    category ? (r) => r.category === category : undefined,
  );
  return rows.map(toSelected);
}
