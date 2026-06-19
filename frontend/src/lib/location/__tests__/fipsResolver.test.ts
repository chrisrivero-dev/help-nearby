/**
 * @jest-environment node
 */
import {
  resolveJurisdictions,
  _clearResolverCache,
} from '../fipsResolver';
import { countyId, placeId, stateId } from '../jurisdiction';
import { NYC_FIXTURES, LA_FIXTURES } from './resolver.fixtures';

beforeEach(() => _clearResolverCache());

// Resolution must never hit the network for points inside the bundled coverage.
// Fail loudly if it does, so a regression that breaks local PIP can't be hidden
// by a silent Census API fallback.
const realFetch = global.fetch;
beforeAll(() => {
  global.fetch = jest.fn(() => {
    throw new Error('resolver hit the network for a bundled point');
  }) as unknown as typeof fetch;
});
afterAll(() => {
  global.fetch = realFetch;
});

function idsOf(stack: Awaited<ReturnType<typeof resolveJurisdictions>>) {
  return new Set(stack.map((j) => j.id));
}

describe('resolveJurisdictions — NYC (accuracy gold standard)', () => {
  it.each(NYC_FIXTURES.map((f) => [f.name, f] as const))(
    '%s → correct borough/county + NYC place',
    async (_name, f) => {
      const stack = await resolveJurisdictions(f.lat, f.lng);
      const ids = idsOf(stack);
      expect(ids.has(countyId(f.county))).toBe(true);
      expect(ids.has(placeId(f.place!))).toBe(true);
      expect(ids.has(stateId('36'))).toBe(true);
      expect(ids.has('us')).toBe(true);
    },
  );

  it('orders the stack most-specific first (place → county → state → national)', async () => {
    const stack = await resolveJurisdictions(40.758, -73.9855); // Times Square
    expect(stack.map((j) => j.level)).toEqual([
      'place',
      'county',
      'state',
      'national',
    ]);
  });
});

describe('resolveJurisdictions — LA (default hub)', () => {
  it.each(LA_FIXTURES.map((f) => [f.name, f] as const))(
    '%s → LA County, place only when inside City of LA',
    async (_name, f) => {
      const stack = await resolveJurisdictions(f.lat, f.lng);
      const ids = idsOf(stack);
      expect(ids.has(countyId(f.county))).toBe(true);
      expect(ids.has(stateId('06'))).toBe(true);
      expect(ids.has('us')).toBe(true);
      if (f.place) {
        expect(ids.has(placeId(f.place))).toBe(true);
      } else {
        expect(ids.has(placeId('0644000'))).toBe(false);
      }
    },
  );
});

describe('resolveJurisdictions — invariants', () => {
  it('always ends with the national catch-all', async () => {
    const stack = await resolveJurisdictions(40.758, -73.9855);
    expect(stack[stack.length - 1].id).toBe('us');
  });

  it('caches repeated lookups in the same area', async () => {
    const a = await resolveJurisdictions(34.0537, -118.2427);
    const b = await resolveJurisdictions(34.0537, -118.2427);
    expect(b).toBe(a); // same array reference = cache hit
  });
});
