/**
 * Rebuilds the bundled boundary polygons in src/data/geo/ from the US Census
 * TIGERweb REST services. Run when boundaries change (rarely, ~yearly) or when
 * adding a hub.
 *
 *   node scripts/build-coverage.mjs
 *
 * Hub-first by design (docs/location-data-network.md §3–§4):
 *   counties.json — NYC's 5 boroughs + LA County + Cook County
 *   places.json   — City of New York + City of Los Angeles + City of Chicago
 *
 * The national county bundle is a documented follow-up: add the remaining states
 * here (or switch to the cartographic boundary files + mapshaper simplify) and
 * index the polygons with Flatbush in pointInPolygon.ts when the count grows.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'src/data/geo');

const TIGER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb';
const COUNTY_LAYER = `${TIGER}/State_County/MapServer/13/query`;
const PLACE_LAYER = `${TIGER}/Places_CouSub_ConCity_SubMCD/MapServer/4/query`;

async function fetchGeoJson(layer, where) {
  const params = new URLSearchParams({
    where,
    outFields: 'GEOID,NAME,STATE,BASENAME',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  });
  const res = await fetch(`${layer}?${params}`);
  if (!res.ok) throw new Error(`TIGERweb ${res.status} for ${where}`);
  const fc = await res.json();
  if (!fc.features?.length) throw new Error(`no features for ${where}`);
  return fc.features;
}

const norm = (features, level) => ({
  type: 'FeatureCollection',
  features: features.map((f) => ({
    type: 'Feature',
    properties: { GEOID: f.properties.GEOID, NAME: f.properties.NAME, level },
    geometry: f.geometry,
  })),
});

async function main() {
  // NYC's 5 counties + LA County + Cook County.
  const nycCounties = await fetchGeoJson(
    COUNTY_LAYER,
    "STATE='36' AND (COUNTY='061' OR COUNTY='047' OR COUNTY='081' OR COUNTY='005' OR COUNTY='085')",
  );
  const laCounty = await fetchGeoJson(
    COUNTY_LAYER,
    "STATE='06' AND COUNTY='037'",
  );
  const cookCounty = await fetchGeoJson(
    COUNTY_LAYER,
    "STATE='17' AND COUNTY='031'",
  );

  // City of NYC + City of LA + City of Chicago.
  const nycPlace = await fetchGeoJson(
    PLACE_LAYER,
    "STATE='36' AND PLACE='51000'",
  );
  const laPlace = await fetchGeoJson(
    PLACE_LAYER,
    "STATE='06' AND PLACE='44000'",
  );
  const chicagoPlace = await fetchGeoJson(
    PLACE_LAYER,
    "STATE='17' AND PLACE='14000'",
  );

  fs.mkdirSync(OUT, { recursive: true });
  const counties = norm([...nycCounties, ...laCounty, ...cookCounty], 'county');
  const places = norm([...nycPlace, ...laPlace, ...chicagoPlace], 'place');
  fs.writeFileSync(path.join(OUT, 'counties.json'), JSON.stringify(counties));
  fs.writeFileSync(path.join(OUT, 'places.json'), JSON.stringify(places));

  const kb = (n) => `${(n / 1024).toFixed(0)}KB`;
  console.log(
    `counties.json: ${counties.features.length} features (${kb(fs.statSync(path.join(OUT, 'counties.json')).size)})`,
  );
  console.log(
    `places.json:   ${places.features.length} features (${kb(fs.statSync(path.join(OUT, 'places.json')).size)})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
