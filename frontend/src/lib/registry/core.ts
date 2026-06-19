/**
 * Shared registry core — the domain-agnostic machinery every data network reuses:
 * jurisdiction-based source selection (via the resolver) and a parallel fan-out
 * that collects per-source health. Each domain (resources, weather, disasters, …)
 * builds a TYPED registry on top of this and keeps its own output schema + panel
 * mapping. One location in → one resolver → many typed registries out → panels.
 * See docs/location-data-network.md §5b.
 */
import { resolveJurisdictions } from '@/lib/location/fipsResolver';
import { recordChecks } from './health';

/** Fields every registry row shares, regardless of domain/output shape. */
export interface BaseSourceRow {
  id: string;
  name: string;
  url: string;
  /** Selects the domain adapter. */
  sourceType: string;
  /** Registry key matched against a point's resolved jurisdiction stack. */
  jurisdictionId: string;
  /** Conflict precedence / ranking weight (higher wins). */
  trust: number;
  /** Free-form, human-readable refresh expectation (documentation). */
  refresh: string;
  /** Response cache TTL in seconds. Falls back to a per-domain default if unset. */
  ttlSeconds?: number;
  /** Kill switch — disable a source without a deploy. */
  enabled: boolean;
  notes?: string;
}

/** Minimal identity needed to fan out + report health. */
export interface SourceIdentity {
  id: string;
  name: string;
  url: string;
  sourceType: string;
}

/** Per-source health for one fan-out. */
export interface CheckedSource {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  ok: boolean;
  fetchedAt: string;
}

export interface FanOutResult<TOut> {
  items: TOut[];
  checked: CheckedSource[];
  degraded: boolean;
}

/**
 * Rows covering a point, most-specific jurisdiction first. A row is selected when
 * it's enabled, its `jurisdictionId` is in the point's resolved stack, and it
 * passes the optional extra filter (e.g. category). National rows (`us`) always
 * match, since the resolver always returns the national catch-all.
 */
export async function selectByJurisdiction<T extends BaseSourceRow>(
  rows: T[],
  lat: number,
  lng: number,
  extraFilter?: (row: T) => boolean,
): Promise<T[]> {
  const stack = await resolveJurisdictions(lat, lng);
  const order = new Map(stack.map((j, i) => [j.id, i]));
  return rows
    .filter(
      (r) =>
        r.enabled &&
        order.has(r.jurisdictionId) &&
        (!extraFilter || extraFilter(r)),
    )
    .sort(
      (a, b) =>
        (order.get(a.jurisdictionId) ?? Infinity) -
        (order.get(b.jurisdictionId) ?? Infinity),
    );
}

/**
 * Run each source in parallel with a domain-supplied runner, collecting results
 * and per-source health. A rejected runner marks that source not-ok and the
 * batch degraded, but never fails the whole request.
 */
export async function fanOut<T extends SourceIdentity, TOut>(
  rows: T[],
  run: (row: T) => Promise<TOut[]>,
): Promise<FanOutResult<TOut>> {
  const fetchedAt = new Date().toISOString();
  const settled = await Promise.allSettled(rows.map((r) => run(r)));
  const items: TOut[] = [];
  const checked: CheckedSource[] = [];
  let degraded = false;
  settled.forEach((res, i) => {
    const row = rows[i];
    const ok = res.status === 'fulfilled';
    checked.push({
      id: row.id,
      name: row.name,
      url: row.url,
      sourceType: row.sourceType,
      ok,
      fetchedAt,
    });
    if (ok) items.push(...res.value);
    else degraded = true;
  });
  recordChecks(checked);
  return { items, checked, degraded };
}
