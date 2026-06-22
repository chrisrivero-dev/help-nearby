import { randomUUID } from 'node:crypto';
import type { CommunityOpportunity } from '../types';
import type {
  CommunityOpportunityType,
  CommunitySourceItem,
  SelectedCommunitySource,
} from './types';

const VALID_TYPES = new Set<CommunityOpportunityType>([
  'volunteer',
  'donation',
  'event',
  'shelter',
  'food',
  'other',
]);

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed || undefined;
}

function hasCoordinates(item: CommunitySourceItem): boolean {
  return (
    typeof item.latitude === 'number' &&
    Number.isFinite(item.latitude) &&
    typeof item.longitude === 'number' &&
    Number.isFinite(item.longitude)
  );
}

function hasLocation(item: CommunitySourceItem): boolean {
  return hasCoordinates(item) || !!clean(item.address);
}

export function mapCommunityType(value: unknown): CommunityOpportunityType {
  const raw = clean(value)?.toLowerCase() ?? '';
  if (VALID_TYPES.has(raw as CommunityOpportunityType)) {
    return raw as CommunityOpportunityType;
  }
  if (/volunteer|service|cleanup|clean-up|mentor/.test(raw)) return 'volunteer';
  if (/donat|drive|coat|food collection|in-kind/.test(raw)) return 'donation';
  if (/meal|pantr|food|grocery|produce/.test(raw)) return 'food';
  if (/shelter|warming|cooling|overnight/.test(raw)) return 'shelter';
  if (/event|meeting|calendar|festival|parade|ceremony|celebration|workshop|class/.test(raw)) {
    return 'event';
  }
  return 'other';
}

export function normalizeIsoDate(value: unknown): string | undefined {
  const text = clean(value);
  if (!text) return undefined;
  const time = Date.parse(text);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

export function importedOpportunityKey(item: Pick<
  CommunityOpportunity,
  | 'sourceId'
  | 'externalId'
  | 'title'
  | 'organizationName'
  | 'startAt'
  | 'address'
  | 'sourceUrl'
>): string {
  if (item.sourceId && item.externalId) {
    return `${item.sourceId}:${item.externalId}`;
  }
  return [
    item.sourceId,
    item.title,
    item.organizationName,
    item.startAt,
    item.address,
    item.sourceUrl,
  ]
    .map((part) => clean(part)?.toLowerCase() ?? '')
    .join('|');
}

export function normalizeCommunityItem(
  item: CommunitySourceItem,
  source: SelectedCommunitySource,
  nowIso: string,
): CommunityOpportunity | undefined {
  const title = clean(item.title);
  if (!title) return undefined;
  if (source.requiresLocation && !hasLocation(item)) return undefined;

  const sourceUrl = clean(item.sourceUrl) ?? source.url;
  const organizationName = clean(item.organizationName) ?? source.name;
  const startAt = normalizeIsoDate(item.startAt);
  const endAt = normalizeIsoDate(item.endAt);

  return {
    id: randomUUID(),
    title,
    type: mapCommunityType(item.type),
    category: clean(item.category),
    dateLabel: clean(item.dateLabel),
    timeLabel: clean(item.timeLabel),
    website: clean(item.website),
    organizationName,
    description: clean(item.description),
    venueName: clean(item.venueName),
    address: clean(item.address),
    latitude: typeof item.latitude === 'number' ? item.latitude : undefined,
    longitude: typeof item.longitude === 'number' ? item.longitude : undefined,
    startAt,
    endAt,
    sourceId: source.id,
    sourceName: source.name,
    externalId: clean(item.externalId),
    sourceUrl,
    contactPhone: clean(item.contactPhone),
    contactEmail: clean(item.contactEmail),
    importedAt: nowIso,
    lastSeenAt: nowIso,
    status: source.autoApprove ? 'approved' : 'pending',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
