import nyc311Sources from '@/data/nyc311.sources.json';
import { selectByJurisdiction } from '@/lib/registry/core';
import { runCommunityAdapter } from '@/lib/community/sources/adapters';
import type {
  CommunityAdapterConfig,
  CommunitySourceRow,
  SelectedCommunitySource,
} from '@/lib/community/sources/types';

const ROWS = nyc311Sources as unknown as CommunitySourceRow[];

/**
 * Substitute `{lat}`/`{lng}` location tokens into a json-feed adapter's url and
 * query values so a source can scope its request to the user's coordinates
 * (e.g. Socrata's `within_circle(location, {lat}, {lng}, …)`). Date tokens
 * (`{today}`) are still expanded later by the shared adapter. Non-json adapters
 * pass through unchanged. Done here (not in the shared adapter) so the community
 * vertical is untouched.
 */
function applyLocationTokens(
  adapter: CommunityAdapterConfig,
  lat: number,
  lng: number,
): CommunityAdapterConfig {
  if (adapter.kind !== 'json-feed') return adapter;
  const sub = (v: string) =>
    v.replace(/\{lat\}/g, String(lat)).replace(/\{lng\}/g, String(lng));
  return {
    ...adapter,
    url: sub(adapter.url),
    query: adapter.query
      ? Object.fromEntries(
          Object.entries(adapter.query).map(([k, v]) => [k, sub(v)]),
        )
      : undefined,
  };
}

function toSelected(
  row: CommunitySourceRow,
  lat: number,
  lng: number,
): SelectedCommunitySource {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    sourceType: row.sourceType,
    trust: row.trust,
    ttlSeconds: row.ttlSeconds,
    autoApprove: row.autoApprove === true,
    requiresLocation: row.requiresLocation === true,
    fetch: () =>
      runCommunityAdapter(applyLocationTokens(row.adapter, lat, lng)),
  };
}

export async function selectNyc311Sources(
  lat: number,
  lng: number,
): Promise<SelectedCommunitySource[]> {
  const rows = await selectByJurisdiction(ROWS, lat, lng);
  return rows.map((r) => toSelected(r, lat, lng));
}

export function listNyc311SourceRows(): CommunitySourceRow[] {
  return [...ROWS];
}
