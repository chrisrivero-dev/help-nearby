/**
 * @jest-environment node
 */
import {
  normalizeName,
  normalizeAddress,
  isSameEntity,
  reconcileResources,
} from '../reconcile';
import type { NearbyResource } from '../schema';

function res(p: Partial<NearbyResource>): NearbyResource {
  return {
    id: p.id ?? Math.random().toString(36),
    name: p.name ?? 'X',
    category: 'social_services',
    sourceName: p.sourceName ?? 'src',
    sourceUrl: 'http://example.com',
    sourceType: 'socrata',
    isLive: true,
    lastChecked: '2026-06-19T00:00:00.000Z',
    ...p,
  };
}

describe('normalization', () => {
  it('canonicalizes names (case, punctuation, suffixes, &)', () => {
    expect(normalizeName("St. Mary's Church, Inc.")).toBe('st marys church');
    expect(normalizeName('The Food & Help Center')).toBe(
      'food and help center',
    );
  });

  it('canonicalizes addresses (street types, directionals, ordinals, units)', () => {
    expect(normalizeAddress('123 West 42nd Street')).toBe('123 w 42 st');
    expect(normalizeAddress('123 W 42 St, Suite 500')).toBe('123 w 42 st');
  });
});

describe('isSameEntity (any two of three signals)', () => {
  const base = res({
    name: 'HRA Benefits Center',
    address: '123 West 42nd Street',
    latitude: 40.758,
    longitude: -73.9855,
  });

  it('matches on name + address even when geo is off', () => {
    const other = res({
      name: 'HRA Benefits Center',
      address: '123 W 42 St',
      latitude: 41.0, // far
      longitude: -73.0,
    });
    expect(isSameEntity(base, other)).toBe(true);
  });

  it('matches on name + geo even when address differs/missing', () => {
    const other = res({
      name: 'HRA Benefits Center',
      latitude: 40.7581,
      longitude: -73.9856,
    });
    expect(isSameEntity(base, other)).toBe(true);
  });

  it('does NOT match on a single signal alone', () => {
    const onlyName = res({
      name: 'HRA Benefits Center',
      latitude: 41,
      longitude: -73,
    });
    expect(isSameEntity(base, onlyName)).toBe(false);
  });

  it('does not over-merge distinct nearby facilities', () => {
    const neighbor = res({
      name: 'Completely Different Pantry',
      address: '999 Other Ave',
      latitude: 40.9,
      longitude: -73.8,
    });
    expect(isSameEntity(base, neighbor)).toBe(false);
  });
});

describe('reconcileResources (trust-ranked merge + provenance)', () => {
  it('merges duplicates, higher trust wins each field, records provenance', () => {
    const cityFeed = res({
      id: 'city:1',
      name: 'HRA Benefits Center',
      address: '123 West 42nd Street',
      phone: undefined, // city feed lacks phone
      latitude: 40.758,
      longitude: -73.9855,
      sourceName: 'NYC HRA',
      trust: 80,
    });
    const nonprofitFeed = res({
      id: 'np:1',
      name: 'HRA Benefits Ctr', // slightly different
      address: '123 W 42 St',
      phone: '212-555-1234', // only nonprofit has phone
      latitude: 40.7581,
      longitude: -73.9856,
      sourceName: 'Helper Nonprofit',
      trust: 40,
    });

    const merged = reconcileResources([cityFeed, nonprofitFeed]);
    expect(merged).toHaveLength(1);
    const m = merged[0];

    // Name comes from the higher-trust city feed...
    expect(m.name).toBe('HRA Benefits Center');
    expect(m.fieldProvenance?.name.sourceName).toBe('NYC HRA');
    // ...but phone falls through to the only feed that has it.
    expect(m.phone).toBe('212-555-1234');
    expect(m.fieldProvenance?.phone.sourceName).toBe('Helper Nonprofit');
    // Both contributors recorded, highest trust first.
    expect(m.contributingSources).toEqual(['NYC HRA', 'Helper Nonprofit']);
  });

  it('leaves genuinely distinct resources untouched', () => {
    const a = res({
      name: 'Alpha Center',
      address: '1 A St',
      latitude: 40.1,
      longitude: -73.1,
    });
    const b = res({
      name: 'Beta House',
      address: '2 B Ave',
      latitude: 41.2,
      longitude: -74.2,
    });
    expect(reconcileResources([a, b])).toHaveLength(2);
  });
});
