#!/usr/bin/env node
/**
 * verify:real-demo — fails the build if the production Help Nearby UI ships
 * fake/preview data. This is a static source scan; it does not need a running
 * server. Run with: npm run verify:real-demo
 *
 * It enforces the "NO FAKE DATA" rule:
 *  - no PREVIEW badges or DEMO_/sample arrays in the help dashboard components
 *  - no known hardcoded sample strings in production components
 *  - the nearby-resources endpoint never synthesizes demo rows
 *  - tips, reports, community-opportunities and local-updates endpoints exist
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const failures = [];
const fail = (msg) => failures.push(msg);

function walk(dir, exts = ['.ts', '.tsx']) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      if (entry === 'node_modules' || entry === '__tests__') continue;
      out.push(...walk(full, exts));
    } else if (exts.includes(path.extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf-8') : null);
const rel = (p) => path.relative(ROOT, p);

// 1. No PREVIEW labels or DEMO_/sample arrays in the live help dashboard panels.
const HELP_DIR = path.join(SRC, 'components', 'help');
const FORBIDDEN_PATTERNS = [
  { re: /\bDEMO_[A-Z]+\s*=/, label: 'DEMO_ array declaration' },
  { re: />\s*PREVIEW\s*</, label: "'PREVIEW' badge text" },
  { re: /Cooling Center Now Open/i, label: 'sample update string' },
  { re: /Food Bank Volunteers Needed/i, label: 'sample community string' },
  { re: /Emergency Shelter Activated/i, label: 'sample update string' },
  { re: /Nonprofit Resource Drive/i, label: 'sample community string' },
  {
    re: /Example content showing how this panel/i,
    label: 'preview disclaimer',
  },
];

for (const file of walk(HELP_DIR)) {
  const content = read(file);
  if (!content) continue;
  for (const { re, label } of FORBIDDEN_PATTERNS) {
    if (re.test(content)) {
      fail(`${rel(file)}: contains ${label}`);
    }
  }
}

// 2. nearby-resources must not fall back to a demo/mock array.
const nearby = read(
  path.join(SRC, 'app', 'api', 'nearby-resources', 'route.ts'),
);
if (!nearby) {
  fail('api/nearby-resources/route.ts is missing');
} else {
  if (/DEMO_RESOURCES|MOCK_RESOURCES|SAMPLE_RESOURCES/.test(nearby)) {
    fail('api/nearby-resources/route.ts references a demo/mock resource array');
  }
  if (!/resources:\s*\[\]/.test(nearby)) {
    fail(
      'api/nearby-resources/route.ts should return an empty resources array when no live source covers the point',
    );
  }
}

// 3. Required endpoints exist.
const requiredEndpoints = [
  'app/api/community-tips/route.ts',
  'app/api/resource-reports/route.ts',
  'app/api/community-opportunities/route.ts',
  'app/api/local-updates/route.ts',
];
for (const ep of requiredEndpoints) {
  if (!existsSync(path.join(SRC, ep))) {
    fail(`required endpoint missing: src/${ep}`);
  }
}

// 4. Endpoints that serve public lists must gate on approved/non-expired.
for (const ep of [
  'app/api/community-opportunities/route.ts',
  'app/api/local-updates/route.ts',
]) {
  const c = read(path.join(SRC, ep));
  if (c && !/approved/.test(c)) {
    fail(`src/${ep}: public list does not filter on 'approved' status`);
  }
}

if (failures.length > 0) {
  console.error('\n❌ verify:real-demo FAILED — fake data detected:\n');
  for (const f of failures) console.error('  • ' + f);
  console.error(
    `\n${failures.length} issue(s). The production UI must only show real or admin-verified data.\n`,
  );
  process.exit(1);
}

console.log('✅ verify:real-demo passed — no fake/preview data detected.');
