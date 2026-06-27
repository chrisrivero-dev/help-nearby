import { fanOut } from '@/lib/registry/core';
import { reliableRun } from '@/lib/registry/reliability';
import type { CommunityOpportunity, CommunityStore } from '../types';
import { importedOpportunityKey, normalizeCommunityItem } from './normalize';
import { selectCommunitySources } from './registry';
import type { SelectedCommunitySource } from './types';

export interface CommunityImportOptions {
  latitude: number;
  longitude: number;
  now?: Date;
}

export interface CommunityImportResult {
  opportunities: CommunityOpportunity[];
  checked: Array<{
    id: string;
    name: string;
    url: string;
    sourceType: string;
    ok: boolean;
    fetchedAt: string;
  }>;
  degraded: boolean;
  created: number;
  updated: number;
  expired: number;
}

function isImported(o: CommunityOpportunity): boolean {
  return !!o.sourceId;
}

function isExpired(o: CommunityOpportunity, nowMs: number): boolean {
  return !!o.endAt && Date.parse(o.endAt) < nowMs;
}

function mergeOpportunity(
  existing: CommunityOpportunity,
  incoming: CommunityOpportunity,
): CommunityOpportunity {
  return {
    ...existing,
    title: incoming.title,
    type: incoming.type,
    category: incoming.category,
    dateLabel: incoming.dateLabel,
    timeLabel: incoming.timeLabel,
    website: incoming.website,
    organizationName: incoming.organizationName,
    description: incoming.description,
    venueName: incoming.venueName,
    address: incoming.address,
    latitude: incoming.latitude,
    longitude: incoming.longitude,
    startAt: incoming.startAt,
    endAt: incoming.endAt,
    sourceId: incoming.sourceId,
    sourceName: incoming.sourceName,
    externalId: incoming.externalId,
    sourceUrl: incoming.sourceUrl,
    contactPhone: incoming.contactPhone,
    contactEmail: incoming.contactEmail,
    importedAt: existing.importedAt ?? incoming.importedAt,
    lastSeenAt: incoming.lastSeenAt,
    status: existing.status === 'expired' ? incoming.status : existing.status,
    updatedAt: incoming.updatedAt,
  };
}

export async function collectCommunityOpportunities(
  opts: CommunityImportOptions,
): Promise<Omit<CommunityImportResult, 'created' | 'updated' | 'expired'>> {
  const nowIso = (opts.now ?? new Date()).toISOString();
  const sources = await selectCommunitySources(opts.latitude, opts.longitude);
  const run = reliableRun(
    async (source: SelectedCommunitySource) =>
      (await source.fetch())
        .map((item) => normalizeCommunityItem(item, source, nowIso))
        .filter((item): item is CommunityOpportunity => !!item),
    {
      cacheKeyFor: (source) =>
        `community:${source.id}:${opts.latitude.toFixed(3)}:${opts.longitude.toFixed(3)}`,
      ttlSecondsFor: (source) => source.ttlSeconds ?? 300,
    },
  );
  const out = await fanOut(sources, run);
  return {
    opportunities: out.items,
    checked: out.checked,
    degraded: out.degraded,
  };
}

export async function importCommunityOpportunities(
  store: CommunityStore,
  opts: CommunityImportOptions,
): Promise<CommunityImportResult> {
  const now = opts.now ?? new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const collected = await collectCommunityOpportunities({ ...opts, now });
  const byKey = new Map<string, number>();
  store.opportunities.forEach((o, index) => {
    if (isImported(o)) byKey.set(importedOpportunityKey(o), index);
  });

  const seenKeys = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const incoming of collected.opportunities) {
    const key = importedOpportunityKey(incoming);
    seenKeys.add(key);
    const existingIndex = byKey.get(key);
    if (existingIndex === undefined) {
      store.opportunities.push(incoming);
      byKey.set(key, store.opportunities.length - 1);
      created += 1;
      continue;
    }
    store.opportunities[existingIndex] = mergeOpportunity(
      store.opportunities[existingIndex],
      incoming,
    );
    updated += 1;
  }

  let expired = 0;
  store.opportunities = store.opportunities.map((o) => {
    if (!isImported(o) || o.status === 'expired') return o;
    const key = importedOpportunityKey(o);
    if (isExpired(o, nowMs)) {
      expired += 1;
      return { ...o, status: 'expired', updatedAt: nowIso };
    }
    if (o.lastSeenAt && !seenKeys.has(key)) {
      const lastSeen = Date.parse(o.lastSeenAt);
      const lastUpdated = Date.parse(o.updatedAt);
      if (Number.isNaN(lastSeen) || Number.isNaN(lastUpdated)) return o;
      if (lastUpdated <= lastSeen) {
        return { ...o, updatedAt: nowIso };
      }
      expired += 1;
      return { ...o, status: 'expired', updatedAt: nowIso };
    }
    return o;
  });

  return {
    ...collected,
    created,
    updated,
    expired,
  };
}
