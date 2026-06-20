/**
 * Gold-standard location fixtures — known points with their expected jurisdiction.
 * This is the accuracy gate (docs/location-data-network.md §9): if the resolver
 * gets these right, the bundled polygons + simplification level are safe. Add a
 * fixture whenever a real-world miss is found.
 *
 * `county` is the expected 5-digit county GEOID. `place` is the expected place
 * GEOID, or null when the point is inside the county but outside any bundled city
 * (e.g. Santa Monica is in LA County but is its own city, not City of LA).
 */
export interface LocationFixture {
  name: string;
  lat: number;
  lng: number;
  county: string;
  place: string | null;
}

// NYC — borough → county. place is always New York city (3651000).
export const NYC_FIXTURES: LocationFixture[] = [
  // Manhattan — New York County 36061
  { name: 'Times Square', lat: 40.758, lng: -73.9855, county: '36061', place: '3651000' },
  { name: 'Empire State Building', lat: 40.7484, lng: -73.9857, county: '36061', place: '3651000' },
  { name: 'Central Park (the Mall)', lat: 40.7739, lng: -73.971, county: '36061', place: '3651000' },
  { name: 'Grand Central', lat: 40.7527, lng: -73.9772, county: '36061', place: '3651000' },
  { name: 'Wall Street', lat: 40.7069, lng: -74.0089, county: '36061', place: '3651000' },
  { name: 'Apollo Theater, Harlem', lat: 40.8099, lng: -73.95, county: '36061', place: '3651000' },
  { name: 'Washington Square Park', lat: 40.7308, lng: -73.9973, county: '36061', place: '3651000' },
  // Brooklyn — Kings County 36047
  { name: 'Barclays Center', lat: 40.6826, lng: -73.9754, county: '36047', place: '3651000' },
  { name: 'Prospect Park', lat: 40.6602, lng: -73.969, county: '36047', place: '3651000' },
  { name: 'Coney Island', lat: 40.5755, lng: -73.9707, county: '36047', place: '3651000' },
  { name: 'Williamsburg (Bedford Ave)', lat: 40.717, lng: -73.9568, county: '36047', place: '3651000' },
  { name: 'Bay Ridge', lat: 40.626, lng: -74.03, county: '36047', place: '3651000' },
  // Queens — Queens County 36081
  { name: 'Flushing Meadows', lat: 40.7466, lng: -73.8422, county: '36081', place: '3651000' },
  { name: 'JFK Airport', lat: 40.6413, lng: -73.7781, county: '36081', place: '3651000' },
  { name: 'Astoria', lat: 40.7644, lng: -73.9235, county: '36081', place: '3651000' },
  { name: 'Jackson Heights', lat: 40.7557, lng: -73.8831, county: '36081', place: '3651000' },
  { name: 'Jamaica', lat: 40.702, lng: -73.789, county: '36081', place: '3651000' },
  // Bronx — Bronx County 36005
  { name: 'Yankee Stadium', lat: 40.8296, lng: -73.9262, county: '36005', place: '3651000' },
  { name: 'Bronx Zoo', lat: 40.8506, lng: -73.8769, county: '36005', place: '3651000' },
  { name: 'Fordham', lat: 40.861, lng: -73.889, county: '36005', place: '3651000' },
  { name: 'Riverdale', lat: 40.89, lng: -73.912, county: '36005', place: '3651000' },
  // Staten Island — Richmond County 36085
  { name: 'St. George (ferry)', lat: 40.6437, lng: -74.0729, county: '36085', place: '3651000' },
  { name: 'Staten Island Mall', lat: 40.5839, lng: -74.1647, county: '36085', place: '3651000' },
  { name: 'Great Kills', lat: 40.554, lng: -74.15, county: '36085', place: '3651000' },
];

// LA — all in Los Angeles County 06037. place is City of LA (0644000) or null.
export const LA_FIXTURES: LocationFixture[] = [
  // Inside City of LA
  { name: 'LA City Hall', lat: 34.0537, lng: -118.2427, county: '06037', place: '0644000' },
  { name: 'Griffith Observatory', lat: 34.1184, lng: -118.3004, county: '06037', place: '0644000' },
  { name: 'Venice Beach', lat: 33.985, lng: -118.4695, county: '06037', place: '0644000' },
  { name: 'USC', lat: 34.0224, lng: -118.2851, county: '06037', place: '0644000' },
  { name: 'Echo Park', lat: 34.0782, lng: -118.2606, county: '06037', place: '0644000' },
  { name: 'San Pedro', lat: 33.7361, lng: -118.2922, county: '06037', place: '0644000' },
  { name: 'Sylmar', lat: 34.3, lng: -118.45, county: '06037', place: '0644000' },
  // In LA County but NOT City of LA (own incorporated cities → place is null)
  { name: 'Santa Monica', lat: 34.0195, lng: -118.4912, county: '06037', place: null },
  { name: 'Long Beach', lat: 33.7701, lng: -118.1937, county: '06037', place: null },
  { name: 'Pasadena', lat: 34.1478, lng: -118.1445, county: '06037', place: null },
  { name: 'Beverly Hills', lat: 34.0736, lng: -118.4004, county: '06037', place: null },
  { name: 'Burbank', lat: 34.1808, lng: -118.309, county: '06037', place: null },
  { name: 'Inglewood', lat: 33.9617, lng: -118.3531, county: '06037', place: null },
  { name: 'Malibu', lat: 34.0259, lng: -118.7798, county: '06037', place: null },
  { name: 'Lancaster', lat: 34.6868, lng: -118.1542, county: '06037', place: null },
];

// Chicago — Cook County 17031. place is City of Chicago (1714000) or null.
export const CHICAGO_FIXTURES: LocationFixture[] = [
  // Inside City of Chicago
  { name: 'Chicago City Hall', lat: 41.8837, lng: -87.6318, county: '17031', place: '1714000' },
  { name: 'Harold Washington Library', lat: 41.8763, lng: -87.6282, county: '17031', place: '1714000' },
  { name: 'Garfield Park Conservatory', lat: 41.8865, lng: -87.7173, county: '17031', place: '1714000' },
  { name: "O'Hare Terminal 2", lat: 41.9769, lng: -87.9048, county: '17031', place: '1714000' },
  // In Cook County but NOT City of Chicago
  { name: 'Evanston', lat: 42.0451, lng: -87.6877, county: '17031', place: null },
  { name: 'Oak Park', lat: 41.885, lng: -87.7845, county: '17031', place: null },
];
