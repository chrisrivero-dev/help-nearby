import sourcesData from '@/data/community.sources.json';
import { selectByJurisdiction, type BaseSourceRow } from '@/lib/registry/core';
import { runCommunityAdapter } from './adapters';
import type {
  CommunityAdapterConfig,
  CommunitySourceRow,
  CommunitySourceType,
  SelectedCommunitySource,
} from './types';

const ROWS = sourcesData as unknown as CommunitySourceRow[];

function toSelected(row: CommunitySourceRow): SelectedCommunitySource {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    sourceType: row.sourceType,
    trust: row.trust,
    ttlSeconds: row.ttlSeconds,
    autoApprove: row.autoApprove === true,
    requiresLocation: row.requiresLocation === true,
    fetch: () => runCommunityAdapter(row.adapter),
  };
}

export async function selectCommunitySources(
  lat: number,
  lng: number,
  sourceTypes?: CommunitySourceType[],
): Promise<SelectedCommunitySource[]> {
  const rows = await selectByJurisdiction(
    ROWS,
    lat,
    lng,
    sourceTypes ? (r) => sourceTypes.includes(r.sourceType) : undefined,
  );
  return rows.map(toSelected);
}

export function listCommunitySourceRows(): CommunitySourceRow[] {
  return [...ROWS];
}

export function defineCommunitySourceForTest(
  row: BaseSourceRow & {
    sourceType: CommunitySourceType;
    autoApprove?: boolean;
    requiresLocation?: boolean;
    adapter: CommunityAdapterConfig;
  },
): CommunitySourceRow {
  return row;
}
