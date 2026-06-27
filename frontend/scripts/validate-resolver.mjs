/**
 * Gold-standard accuracy gate for the location resolver (no jest required).
 *
 *   node scripts/validate-resolver.mjs
 *
 * Runs every fixture in src/lib/location/__tests__/resolver.fixtures.ts through
 * the same point-in-polygon logic as fipsResolver.ts against the bundled
 * boundary polygons, and asserts each known point resolves to the expected
 * county + place. Exits non-zero on any miss. See docs/location-data-network.md §9.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const counties = read('src/data/geo/counties.json');
const places = read('src/data/geo/places.json');

// Ray-casting PIP — mirror of src/lib/location/geo/pointInPolygon.ts.
const pir = (lng, lat, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
};
const pip = (lng, lat, poly) => {
  if (!pir(lng, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++)
    if (pir(lng, lat, poly[h])) return false;
  return true;
};
const pif = (lng, lat, f) => {
  const g = f.geometry;
  if (g.type === 'Polygon') return pip(lng, lat, g.coordinates);
  return g.coordinates.some((p) => pip(lng, lat, p));
};
const find = (lng, lat, fc) =>
  fc.features.find((f) => pif(lng, lat, f)) ?? null;

// Load fixtures without a TS toolchain by extracting the two arrays.
const src = fs.readFileSync(
  path.join(root, 'src/lib/location/__tests__/resolver.fixtures.ts'),
  'utf8',
);
const grab = (name) => {
  const m = src.match(new RegExp(`${name}[^=]*=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!m) throw new Error(`fixture ${name} not found`);
  return eval(m[1]);
};
const sets = [
  ['NYC', grab('NYC_FIXTURES')],
  ['LA', grab('LA_FIXTURES')],
  ['Chicago', grab('CHICAGO_FIXTURES')],
];

let pass = 0;
const failures = [];
for (const [label, set] of sets) {
  for (const f of set) {
    const c = find(f.lng, f.lat, counties);
    const p = find(f.lng, f.lat, places);
    const cg = c ? String(c.properties.GEOID) : null;
    const pg = p ? String(p.properties.GEOID) : null;
    if (cg === f.county && pg === f.place) pass++;
    else
      failures.push(
        `${label} ${f.name}: county ${cg} (exp ${f.county}), place ${pg} (exp ${f.place})`,
      );
  }
}

const total = pass + failures.length;
if (failures.length) {
  console.error(`\n✗ ${failures.length}/${total} fixtures failed:`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(
  `✓ ${pass}/${total} gold-standard fixtures passed (NYC + LA + Chicago)`,
);
