import type {
  CommunitySourceItem,
  SelectedCommunitySource,
} from '@/lib/community/sources/types';
import type { NYC311Item } from './types';

// The json-feed adapter coerces every mapped field to a string (empty when
// absent), so collapse blanks back to undefined.
const clean = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const finiteNumber = (value?: number): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/**
 * Map a raw adapter item to the panel-facing `NYC311Item`. Returns undefined for
 * records without a usable title so they're dropped before the fan-out collects.
 */
export function normalizeNyc311Item(
  item: CommunitySourceItem,
  source: SelectedCommunitySource,
): NYC311Item | undefined {
  const title = clean(item.title);
  if (!title) return undefined;

  const externalId = clean(item.externalId);
  return {
    id: `${source.id}:${externalId ?? title}`,
    title,
    category: clean(item.category),
    description: clean(item.description),
    organizationName: clean(item.organizationName) ?? source.name,
    address: clean(item.address),
    latitude: finiteNumber(item.latitude),
    longitude: finiteNumber(item.longitude),
    reportedAt: clean(item.startAt),
    website: clean(item.website),
    sourceUrl: clean(item.sourceUrl),
    sourceId: source.id,
    sourceName: source.name,
    externalId,
  };
}
