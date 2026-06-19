/**
 * A jurisdiction is one level of the geographic hierarchy a point falls in.
 * resolveJurisdictions() returns an ordered stack, most-specific first; that
 * order IS the source-selection fallback order (place → county → state → national).
 *
 * `id` is the registry key. Sources in the registry declare a `jurisdictionId`
 * and are selected when it appears in a point's resolved stack.
 * See docs/location-data-network.md §3–§5.
 */
export type JurisdictionLevel = 'place' | 'county' | 'state' | 'national';

export interface Jurisdiction {
  /** Registry key, e.g. 'place:3651000', 'county:36061', 'state:36', 'us'. */
  id: string;
  level: JurisdictionLevel;
  name: string;
  /** GEOID/FIPS the id derives from ('us' for national). */
  fips: string;
  /** Where the resolution came from — useful for debugging accuracy. */
  source: 'local' | 'census-api';
}

export const NATIONAL: Jurisdiction = {
  id: 'us',
  level: 'national',
  name: 'United States',
  fips: 'us',
  source: 'local',
};

export function placeId(geoid: string): string {
  return `place:${geoid}`;
}
export function countyId(geoid: string): string {
  return `county:${geoid}`;
}
export function stateId(stateFips: string): string {
  return `state:${stateFips}`;
}

/** A 5-digit county GEOID is state(2) + county(3); the state FIPS is its prefix. */
export function stateFipsFromCounty(countyGeoid: string): string {
  return countyGeoid.slice(0, 2);
}
