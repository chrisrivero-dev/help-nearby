/**
 * Per-source reliability for the registry core: an in-memory response cache and a
 * circuit breaker, composed into a single `reliableRun` wrapper that any registry
 * applies to its per-source runner before handing it to `fanOut`.
 *
 *   fanOut(rows, reliableRun(rawRun, { cacheKeyFor, ttlSecondsFor }))
 *
 * - Cache: memoizes a source's result per (source, location, …) key for its TTL,
 *   so repeat calls don't re-hit the upstream.
 * - Breaker: after N consecutive failures a source is "open" (skipped) for a
 *   cooldown, so one flaky upstream can't stall the fan-out on every request —
 *   it's marked down (degraded) instantly instead. After cooldown it half-opens
 *   and is retried once.
 *
 * State is module-level → shared across requests within a serverless instance,
 * reset on cold start. A shared store (Redis) is the multi-instance upgrade.
 * See docs/location-data-network.md §8.
 */

// ── In-memory TTL cache ──────────────────────────────────────────────────────

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}
const cacheStore = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | undefined {
  const entry = cacheStore.get(key);
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    cacheStore.delete(key);
    return undefined;
  }
  return entry.value as T;
}

function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ── Circuit breaker ──────────────────────────────────────────────────────────

export interface BreakerConfig {
  /** Consecutive failures before the circuit opens. */
  failureThreshold: number;
  /** How long the circuit stays open (ms) before a half-open retry. */
  cooldownMs: number;
}

const DEFAULT_BREAKER: BreakerConfig = {
  failureThreshold: 3,
  cooldownMs: 60_000,
};

interface BreakerState {
  failures: number;
  openUntil: number;
}
const breakerStore = new Map<string, BreakerState>();

function breakerState(id: string): BreakerState {
  let s = breakerStore.get(id);
  if (!s) {
    s = { failures: 0, openUntil: 0 };
    breakerStore.set(id, s);
  }
  return s;
}

/** False when the circuit is open (still in cooldown) — caller should skip. */
function canAttempt(id: string): boolean {
  return Date.now() >= breakerState(id).openUntil;
}

function recordSuccess(id: string): void {
  const s = breakerState(id);
  s.failures = 0;
  s.openUntil = 0;
}

function recordFailure(id: string, cfg: BreakerConfig): void {
  const s = breakerState(id);
  s.failures += 1;
  if (s.failures >= cfg.failureThreshold) {
    s.openUntil = Date.now() + cfg.cooldownMs;
  }
}

export class CircuitOpenError extends Error {
  constructor(id: string) {
    super(`circuit_open:${id}`);
    this.name = 'CircuitOpenError';
  }
}

// ── Composed wrapper ─────────────────────────────────────────────────────────

export interface ReliabilityOptions<T> {
  /** Cache key for a row+query; omit to disable caching for this run. */
  cacheKeyFor?: (row: T) => string;
  /** TTL seconds for a row's cache entry. Default 300. */
  ttlSecondsFor?: (row: T) => number;
  breaker?: Partial<BreakerConfig>;
}

/**
 * Wrap a per-source runner with cache + breaker. A cache hit short-circuits; an
 * open circuit throws `CircuitOpenError` (so `fanOut` marks the source down +
 * degraded without attempting the call).
 */
export function reliableRun<T extends { id: string }, TOut>(
  run: (row: T) => Promise<TOut[]>,
  opts: ReliabilityOptions<T> = {},
): (row: T) => Promise<TOut[]> {
  const cfg: BreakerConfig = { ...DEFAULT_BREAKER, ...opts.breaker };
  return async (row: T): Promise<TOut[]> => {
    if (!canAttempt(row.id)) throw new CircuitOpenError(row.id);

    const key = opts.cacheKeyFor?.(row);
    if (key) {
      const cached = cacheGet<TOut[]>(key);
      if (cached) return cached;
    }

    try {
      const out = await run(row);
      recordSuccess(row.id);
      if (key) cacheSet(key, out, opts.ttlSecondsFor?.(row) ?? 300);
      return out;
    } catch (err) {
      recordFailure(row.id, cfg);
      throw err;
    }
  };
}

export interface BreakerSnapshot {
  open: boolean;
  openUntil: number;
  failures: number;
}

/** Current circuit state per source id (for the health surface). */
export function breakerSnapshot(): Map<string, BreakerSnapshot> {
  const now = Date.now();
  const out = new Map<string, BreakerSnapshot>();
  for (const [id, s] of breakerStore) {
    out.set(id, {
      open: now < s.openUntil,
      openUntil: s.openUntil,
      failures: s.failures,
    });
  }
  return out;
}

/** Test/diagnostic helper — clears cache + breaker state. */
export function _resetReliability(): void {
  cacheStore.clear();
  breakerStore.clear();
}
