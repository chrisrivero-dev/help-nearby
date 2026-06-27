/**
 * @jest-environment node
 */
import { _resetReliability } from '@/lib/registry/reliability';
import type { CommunityStore } from '../../types';
import { importCommunityOpportunities } from '../importer';
import {
  importedOpportunityKey,
  mapCommunityType,
  normalizeCommunityItem,
} from '../normalize';
import { selectCommunitySources } from '../registry';
import type { SelectedCommunitySource } from '../types';

beforeEach(() => _resetReliability());

function source(
  p: Partial<SelectedCommunitySource> = {},
): SelectedCommunitySource {
  return {
    id: 'test-source',
    name: 'Test Source',
    url: 'https://example.org/events',
    sourceType: 'manual',
    trust: 80,
    autoApprove: false,
    requiresLocation: false,
    fetch: async () => [],
    ...p,
  };
}

function emptyStore(): CommunityStore {
  return { tips: [], reports: [], opportunities: [], updates: [] };
}

describe('community source normalization', () => {
  it('maps source category language into supported opportunity types', () => {
    expect(mapCommunityType('Volunteer cleanup')).toBe('volunteer');
    expect(mapCommunityType('Food drive')).toBe('donation');
    expect(mapCommunityType('Pantry distribution')).toBe('food');
    expect(mapCommunityType('Community board meeting')).toBe('event');
    expect(mapCommunityType('mystery')).toBe('other');
  });

  it('normalizes manual source rows with provenance and pending default status', () => {
    const now = '2026-06-20T12:00:00.000Z';
    const item = normalizeCommunityItem(
      {
        externalId: 'abc',
        title: ' Neighborhood Cleanup ',
        type: 'volunteer',
        organizationName: ' Parks Team ',
        startAt: '2026-07-01T10:00:00-04:00',
        sourceUrl: 'https://example.org/cleanup',
      },
      source(),
      now,
    );

    expect(item).toMatchObject({
      title: 'Neighborhood Cleanup',
      type: 'volunteer',
      organizationName: 'Parks Team',
      sourceId: 'test-source',
      sourceName: 'Test Source',
      externalId: 'abc',
      sourceUrl: 'https://example.org/cleanup',
      status: 'pending',
      importedAt: now,
      lastSeenAt: now,
    });
    expect(item?.startAt).toBe('2026-07-01T14:00:00.000Z');
  });

  it('drops source rows without location when the source requires location', () => {
    const item = normalizeCommunityItem(
      {
        externalId: 'no-location',
        title: 'Generic Calendar Hub',
        type: 'event',
      },
      source({ requiresLocation: true }),
      '2026-06-20T12:00:00.000Z',
    );

    expect(item).toBeUndefined();
  });

  it('keeps source rows with coordinates when the source requires location', () => {
    const item = normalizeCommunityItem(
      {
        externalId: 'geo-event',
        title: 'Library Workshop',
        type: 'event',
        latitude: 40.758,
        longitude: -73.9855,
      },
      source({ requiresLocation: true }),
      '2026-06-20T12:00:00.000Z',
    );

    expect(item).toMatchObject({
      title: 'Library Workshop',
      latitude: 40.758,
      longitude: -73.9855,
    });
  });
});

describe('community source selection', () => {
  it('has no NYC community sources until location-bearing feeds are registered', async () => {
    const sources = await selectCommunitySources(40.758, -73.9855);
    expect(sources).toEqual([]);
  });

  it('has no LA community sources until location-bearing feeds are registered', async () => {
    const sources = await selectCommunitySources(34.0537, -118.2427);
    expect(sources).toEqual([]);
  });
});

describe('community opportunity import', () => {
  it('does not create public records from source hubs without location', async () => {
    const store = emptyStore();
    const now = new Date('2026-06-20T12:00:00.000Z');

    const first = await importCommunityOpportunities(store, {
      latitude: 40.758,
      longitude: -73.9855,
      now,
    });
    expect(first.created).toBe(0);
    expect(store.opportunities).toHaveLength(0);

    const countAfterFirst = store.opportunities.length;
    const second = await importCommunityOpportunities(store, {
      latitude: 40.758,
      longitude: -73.9855,
      now: new Date('2026-06-20T12:05:00.000Z'),
    });

    expect(store.opportunities).toHaveLength(countAfterFirst);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);
  });

  it('expires imported records whose end time is in the past', async () => {
    const store = emptyStore();
    const stale = normalizeCommunityItem(
      {
        externalId: 'expired-event',
        title: 'Expired Event',
        type: 'event',
        organizationName: 'Test Org',
        endAt: '2026-06-19T12:00:00.000Z',
      },
      source(),
      '2026-06-18T12:00:00.000Z',
    )!;
    store.opportunities.push({ ...stale, status: 'approved' });

    const result = await importCommunityOpportunities(store, {
      latitude: 40.758,
      longitude: -73.9855,
      now: new Date('2026-06-20T12:00:00.000Z'),
    });

    const expired = store.opportunities.find(
      (o) => importedOpportunityKey(o) === importedOpportunityKey(stale),
    );
    expect(result.expired).toBeGreaterThanOrEqual(1);
    expect(expired?.status).toBe('expired');
  });

  it('keeps a missing imported record for one import cycle before expiring it', async () => {
    const store = emptyStore();
    const missing = normalizeCommunityItem(
      {
        externalId: 'missing-event',
        title: 'Missing Event',
        type: 'event',
        organizationName: 'Test Org',
      },
      source({ id: 'source-outside-selected-stack' }),
      '2026-06-18T12:00:00.000Z',
    )!;
    store.opportunities.push({ ...missing, status: 'approved' });

    const firstMiss = await importCommunityOpportunities(store, {
      latitude: 40.758,
      longitude: -73.9855,
      now: new Date('2026-06-20T12:00:00.000Z'),
    });
    expect(firstMiss.expired).toBe(0);
    expect(store.opportunities.find((o) => o.id === missing.id)?.status).toBe(
      'approved',
    );

    const secondMiss = await importCommunityOpportunities(store, {
      latitude: 40.758,
      longitude: -73.9855,
      now: new Date('2026-06-21T12:00:00.000Z'),
    });
    expect(secondMiss.expired).toBe(1);
    expect(store.opportunities.find((o) => o.id === missing.id)?.status).toBe(
      'expired',
    );
  });
});
