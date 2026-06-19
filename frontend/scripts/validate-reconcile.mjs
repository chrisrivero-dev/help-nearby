/**
 * Reconciliation accuracy gate (no jest required):
 *
 *   node scripts/validate-reconcile.mjs
 *
 * Mirrors the matching + merge logic of src/lib/resources/reconcile.ts and asserts
 * the key behaviors on synthetic multi-source fixtures: normalization, 2-of-3
 * entity matching, trust-ranked field merge, and per-field provenance. The jest
 * test (reconcile.test.ts) is the authoritative unit test once the runner is fixed.
 * See docs/location-data-network.md §7.
 */
const R = 3958.8;
const toRad = (d) => (d * Math.PI) / 180;
const haversine = (a1, o1, a2, o2) => {
  const dLat = toRad(a2 - a1);
  const dLng = toRad(o2 - o1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const NAME_DROP = new Set(['the', 'inc', 'incorporated', 'llc', 'corp', 'co', 'ltd']);
const normalizeName = (raw) =>
  raw
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['`"]/g, '')
    .replace(/[.,()/-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !NAME_DROP.has(t))
    .join(' ')
    .trim();

const ADDR = [
  [/\bstreet\b/g, 'st'], [/\bavenue\b/g, 'ave'], [/\bboulevard\b/g, 'blvd'],
  [/\bdrive\b/g, 'dr'], [/\broad\b/g, 'rd'], [/\blane\b/g, 'ln'],
  [/\bplace\b/g, 'pl'], [/\bcourt\b/g, 'ct'], [/\bnorth\b/g, 'n'],
  [/\bsouth\b/g, 's'], [/\beast\b/g, 'e'], [/\bwest\b/g, 'w'],
];
const normalizeAddress = (raw) => {
  let s = raw
    .toLowerCase()
    .replace(/[.,'`"]/g, ' ')
    .replace(/\b(suite|ste|unit|apt|apartment|fl|floor|room|rm|#).*$/g, ' ');
  for (const [re, to] of ADDR) s = s.replace(re, to);
  s = s.replace(/(\d+)(st|nd|rd|th)\b/g, '$1');
  return s.replace(/\s+/g, ' ').trim();
};

const dice = (a, b) => {
  if (a === b) return 1;
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return (2 * inter) / (ta.size + tb.size);
};

const hasVal = (v) => v !== undefined && v !== null && !(typeof v === 'string' && !v.trim());

const isSameEntity = (a, b) => {
  const nameMatch = dice(normalizeName(a.name), normalizeName(b.name)) >= 0.8;
  const addrMatch = !!a.address && !!b.address && normalizeAddress(a.address) === normalizeAddress(b.address);
  const geoMatch =
    [a.latitude, a.longitude, b.latitude, b.longitude].every((n) => typeof n === 'number') &&
    haversine(a.latitude, a.longitude, b.latitude, b.longitude) <= 0.0311;
  return Number(nameMatch) + Number(addrMatch) + Number(geoMatch) >= 2;
};

const FIELDS = ['name', 'address', 'city', 'state', 'zip', 'phone', 'website', 'latitude', 'longitude'];
const trustOf = (r) => r.trust ?? 0;

const mergeCluster = (cluster) => {
  const ordered = [...cluster].sort((a, b) => trustOf(b) - trustOf(a));
  const merged = { ...ordered[0] };
  const prov = {};
  for (const f of FIELDS) {
    const w = ordered.find((r) => hasVal(r[f]));
    if (!w) continue;
    merged[f] = w[f];
    prov[f] = { sourceName: w.sourceName, trust: trustOf(w) };
  }
  merged.contributingSources = [...new Set(ordered.map((r) => r.sourceName))];
  merged.fieldProvenance = prov;
  return merged;
};

const reconcile = (resources) => {
  const clusters = [];
  for (const r of resources) {
    const c = clusters.find((cl) => cl.some((m) => isSameEntity(m, r)));
    if (c) c.push(r);
    else clusters.push([r]);
  }
  return clusters.map(mergeCluster);
};

// ── assertions ───────────────────────────────────────────────────────────────
let ok = true;
const check = (cond, msg) => {
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) ok = false;
};

console.log('normalization');
check(normalizeName("St. Mary's Church, Inc.") === 'st marys church', "name: St. Mary's Church, Inc. → st marys church");
check(normalizeAddress('123 West 42nd Street') === '123 w 42 st', 'addr: 123 West 42nd Street → 123 w 42 st');

console.log('entity matching (2 of 3)');
const a = { name: 'HRA Benefits Center', address: '123 West 42nd Street', latitude: 40.758, longitude: -73.9855 };
check(isSameEntity(a, { name: 'HRA Benefits Center', address: '123 W 42 St', latitude: 41, longitude: -73 }), 'name+address match despite bad geo');
check(isSameEntity(a, { name: 'HRA Benefits Center', latitude: 40.7581, longitude: -73.9856 }), 'name+geo match despite missing address');
check(!isSameEntity(a, { name: 'HRA Benefits Center', latitude: 41, longitude: -73 }), 'single signal does NOT match');
check(!isSameEntity(a, { name: 'Other Pantry', address: '999 Other Ave', latitude: 40.9, longitude: -73.8 }), 'distinct facility not merged');

console.log('merge + provenance');
const merged = reconcile([
  { id: 'city:1', name: 'HRA Benefits Center', address: '123 West 42nd Street', latitude: 40.758, longitude: -73.9855, sourceName: 'NYC HRA', trust: 80 },
  { id: 'np:1', name: 'HRA Benefits Ctr', address: '123 W 42 St', phone: '212-555-1234', latitude: 40.7581, longitude: -73.9856, sourceName: 'Helper Nonprofit', trust: 40 },
]);
check(merged.length === 1, 'two feeds of one entity → 1 record');
check(merged[0].name === 'HRA Benefits Center', 'higher-trust name wins');
check(merged[0].fieldProvenance?.name?.sourceName === 'NYC HRA', 'name provenance = NYC HRA');
check(merged[0].phone === '212-555-1234', 'phone falls through to the only feed with it');
check(merged[0].fieldProvenance?.phone?.sourceName === 'Helper Nonprofit', 'phone provenance = Helper Nonprofit');
check(JSON.stringify(merged[0].contributingSources) === JSON.stringify(['NYC HRA', 'Helper Nonprofit']), 'contributors recorded, highest trust first');

console.log(ok ? '\n✓ reconciliation verified' : '\n✗ reconciliation checks failed');
process.exit(ok ? 0 : 1);
