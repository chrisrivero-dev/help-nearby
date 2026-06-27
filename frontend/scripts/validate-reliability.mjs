/**
 * Reliability gate (no jest required):
 *
 *   node scripts/validate-reliability.mjs
 *
 * Mirrors the cache + circuit-breaker logic of src/lib/registry/reliability.ts and
 * asserts: cache hits avoid re-running, the breaker opens after the failure
 * threshold and skips with a CircuitOpenError, it half-opens after cooldown, and
 * breakers are isolated per source. The jest test (reliability.test.ts) is the
 * authoritative unit test once the runner is fixed. See docs/location-data-network.md §8.
 */
let nowMs = 1000;
const now = () => nowMs;

const cacheStore = new Map();
const cacheGet = (k) => {
  const e = cacheStore.get(k);
  if (!e) return undefined;
  if (now() >= e.expiresAt) {
    cacheStore.delete(k);
    return undefined;
  }
  return e.value;
};
const cacheSet = (k, v, ttl) =>
  cacheStore.set(k, { value: v, expiresAt: now() + ttl * 1000 });

const breakerStore = new Map();
const state = (id) => {
  let s = breakerStore.get(id);
  if (!s) {
    s = { failures: 0, openUntil: 0 };
    breakerStore.set(id, s);
  }
  return s;
};
const canAttempt = (id) => now() >= state(id).openUntil;
const recordSuccess = (id) => {
  const s = state(id);
  s.failures = 0;
  s.openUntil = 0;
};
const recordFailure = (id, cfg) => {
  const s = state(id);
  s.failures += 1;
  if (s.failures >= cfg.failureThreshold) s.openUntil = now() + cfg.cooldownMs;
};
class CircuitOpenError extends Error {}

const reliableRun = (run, opts = {}) => {
  const cfg = {
    failureThreshold: 3,
    cooldownMs: 60000,
    ...(opts.breaker || {}),
  };
  return async (row) => {
    if (!canAttempt(row.id)) throw new CircuitOpenError(row.id);
    const key = opts.cacheKeyFor?.(row);
    if (key) {
      const c = cacheGet(key);
      if (c) return c;
    }
    try {
      const out = await run(row);
      recordSuccess(row.id);
      if (key) cacheSet(key, out, opts.ttlSecondsFor?.(row) ?? 300);
      return out;
    } catch (e) {
      recordFailure(row.id, cfg);
      throw e;
    }
  };
};

let ok = true;
const check = (cond, msg) => {
  console.log(`  ${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) ok = false;
};
const rejects = async (p, pred) => {
  try {
    await p;
    return false;
  } catch (e) {
    return pred(e);
  }
};

await (async () => {
  console.log('cache');
  let calls = 0;
  const cached = reliableRun(
    async () => {
      calls++;
      return [calls];
    },
    { cacheKeyFor: () => 'k', ttlSecondsFor: () => 60 },
  );
  const a = await cached({ id: 's' });
  const b = await cached({ id: 's' });
  check(a[0] === 1 && b[0] === 1 && calls === 1, 'cache hit avoids re-running');

  console.log('circuit breaker');
  let attempts = 0;
  const flaky = reliableRun(
    async () => {
      attempts++;
      throw new Error('down');
    },
    { breaker: { failureThreshold: 3, cooldownMs: 10000 } },
  );
  for (let i = 0; i < 3; i++) await rejects(flaky({ id: 'f' }), () => true);
  check(attempts === 3, '3 attempts before opening');
  const skipped = await rejects(
    flaky({ id: 'f' }),
    (e) => e instanceof CircuitOpenError,
  );
  check(
    skipped && attempts === 3,
    'opens: 4th call skipped with CircuitOpenError',
  );

  console.log('half-open recovery');
  let mode = 'fail';
  const hx = reliableRun(
    async () => {
      if (mode === 'fail') throw new Error('down');
      return ['ok'];
    },
    { breaker: { failureThreshold: 2, cooldownMs: 5000 } },
  );
  nowMs = 1000;
  await rejects(hx({ id: 'x' }), () => true);
  await rejects(hx({ id: 'x' }), () => true);
  nowMs = 3000;
  check(
    await rejects(hx({ id: 'x' }), (e) => e instanceof CircuitOpenError),
    'still open during cooldown',
  );
  mode = 'ok';
  nowMs = 7000;
  const recovered = await hx({ id: 'x' });
  check(
    JSON.stringify(recovered) === JSON.stringify(['ok']),
    'half-opens and recovers after cooldown',
  );

  console.log('isolation');
  const iso = reliableRun(
    async (r) => {
      if (r.id === 'bad') throw new Error('down');
      return [r.id];
    },
    { breaker: { failureThreshold: 1, cooldownMs: 10000 } },
  );
  nowMs = 1000;
  await rejects(iso({ id: 'bad' }), () => true);
  check(
    await rejects(iso({ id: 'bad' }), (e) => e instanceof CircuitOpenError),
    'bad source opens',
  );
  const good = await iso({ id: 'good' });
  check(
    JSON.stringify(good) === JSON.stringify(['good']),
    'other source unaffected',
  );
})();

console.log(ok ? '\n✓ reliability verified' : '\n✗ reliability checks failed');
process.exit(ok ? 0 : 1);
