/**
 * End-to-end check for the data-driven registry (no jest required):
 *
 *   node scripts/validate-sources.mjs
 *
 * Resolves two points (NYC, LA) to their jurisdiction stacks, selects sources
 * from src/data/sources.json by jurisdiction, and live-fetches the selected
 * Socrata sources to prove the adapter + spatial filter return real rows. Hits
 * the network (NYC Open Data). See docs/location-data-network.md §5–§6.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const counties = read('src/data/geo/counties.json');
const places = read('src/data/geo/places.json');
const sources = read('src/data/sources.json');

// ── point-in-polygon (mirror of geo/pointInPolygon.ts) ──────────────────────
const pir = (lng, lat, r) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    )
      inside = !inside;
  }
  return inside;
};
const pip = (lng, lat, poly) =>
  pir(lng, lat, poly[0]) && !poly.slice(1).some((h) => pir(lng, lat, h));
const pif = (lng, lat, f) =>
  f.geometry.type === 'Polygon'
    ? pip(lng, lat, f.geometry.coordinates)
    : f.geometry.coordinates.some((p) => pip(lng, lat, p));
const find = (lng, lat, fc) =>
  fc.features.find((f) => pif(lng, lat, f)) ?? null;

// ── resolver stack (mirror of fipsResolver.ts) ──────────────────────────────
function resolve(lat, lng) {
  const ids = [];
  const p = find(lng, lat, places);
  if (p) ids.push(`place:${p.properties.GEOID}`);
  const c = find(lng, lat, counties);
  if (c) {
    ids.push(`county:${c.properties.GEOID}`);
    ids.push(`state:${String(c.properties.GEOID).slice(0, 2)}`);
  }
  ids.push('us');
  return ids;
}

const select = (lat, lng) => {
  const ids = new Set(resolve(lat, lng));
  return sources.filter((s) => s.enabled && ids.has(s.jurisdictionId));
};

// ── socrata SoQL (mirror of socrata.ts buildWhere) ──────────────────────────
function socrataWhere(adapter, lat, lng, radiusMiles) {
  let spatial;
  if (adapter.geo.kind === 'point') {
    spatial = `within_circle(${adapter.geo.field}, ${lat}, ${lng}, ${radiusMiles * 1609.34})`;
  } else {
    const dLat = radiusMiles / 69;
    const dLng =
      radiusMiles / (69 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    const cast = adapter.geo.cast ? '::number' : '';
    const latF = `${adapter.geo.latField}${cast}`;
    const lngF = `${adapter.geo.lngField}${cast}`;
    spatial =
      `${latF} > ${lat - dLat} AND ${latF} < ${lat + dLat} AND ` +
      `${lngF} > ${lng - dLng} AND ${lngF} < ${lng + dLng}`;
  }
  return adapter.where ? `(${adapter.where}) AND (${spatial})` : spatial;
}

async function fetchSocrata(s, lat, lng, radiusMiles) {
  const params = new URLSearchParams({
    $where: socrataWhere(s.adapter, lat, lng, radiusMiles),
    $limit: '500',
  });
  const res = await fetch(`${s.adapter.endpoint}?${params}`);
  if (!res.ok) throw new Error(`http_${res.status}`);
  const rows = await res.json();
  return rows.map((r) => ({
    name: r[s.adapter.fieldMap.name],
    address: r[s.adapter.fieldMap.address],
  }));
}

async function main() {
  const points = [
    { label: 'NYC — Times Square', lat: 40.758, lng: -73.9855 },
    { label: 'LA — City Hall', lat: 34.0537, lng: -118.2427 },
    { label: 'Chicago — City Hall', lat: 41.8837, lng: -87.6318 },
  ];

  let ok = true;
  for (const pt of points) {
    const selected = select(pt.lat, pt.lng);
    console.log(`\n${pt.label}`);
    console.log('  stack:   ', resolve(pt.lat, pt.lng).join(' → '));
    console.log(
      '  selected:',
      selected
        .map((s) => `${s.id} [${s.sourceType}/${s.category}]`)
        .join(', ') || '(none)',
    );

    for (const s of selected.filter((s) => s.sourceType === 'socrata')) {
      try {
        const rows = await fetchSocrata(s, pt.lat, pt.lng, 5);
        console.log(`  ↳ ${s.id}: ${rows.length} live rows`);
        if (rows[0])
          console.log(`      e.g. ${rows[0].name} — ${rows[0].address}`);
        if (rows.length === 0) {
          console.warn(`      ⚠ expected >0 rows for a 5mi NYC radius`);
          ok = false;
        }
      } catch (e) {
        console.error(`  ↳ ${s.id}: FETCH FAILED ${e.message}`);
        ok = false;
      }
    }
  }

  // Assert the core promise: NYC taps NYC sources, LA taps LA sources.
  const nyc = select(40.758, -73.9855).map((s) => s.id);
  const la = select(34.0537, -118.2427).map((s) => s.id);
  const chicago = select(41.8837, -87.6318).map((s) => s.id);
  const expect = (cond, msg) => {
    if (!cond) {
      console.error(`\n✗ ${msg}`);
      ok = false;
    }
  };
  expect(
    nyc.includes('nyc-benefits-access-centers'),
    'NYC should select NYC benefits centers',
  );
  expect(
    !nyc.includes('la-city-rec-parks-facilities'),
    'NYC must NOT select LA city sources',
  );
  expect(
    nyc.includes('hrsa-health-center-sites'),
    'NYC should still get national HRSA',
  );
  expect(
    la.includes('la-city-rec-parks-facilities'),
    'LA should select LA city rec/parks',
  );
  expect(
    !la.some((id) => id.startsWith('nyc-')),
    'LA must NOT select NYC sources',
  );
  expect(
    chicago.includes('chicago-public-library-branches'),
    'Chicago should select Chicago library branches',
  );
  expect(
    chicago.includes('chicago-warming-centers'),
    'Chicago should select Chicago warming centers',
  );
  expect(
    chicago.includes('hrsa-health-center-sites'),
    'Chicago should still get national HRSA',
  );
  expect(
    !chicago.some((id) => id.startsWith('nyc-')),
    'Chicago must NOT select NYC sources',
  );
  expect(
    !chicago.some((id) => id.startsWith('la-')),
    'Chicago must NOT select LA sources',
  );

  console.log(
    ok
      ? '\n✓ registry selection + live Socrata fetch verified'
      : '\n✗ checks failed',
  );
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
