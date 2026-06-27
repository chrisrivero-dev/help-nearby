/**
 * Source health surface. Every registry fan-out records its per-source results
 * here (via `recordChecks`, called from `fanOut`), so an admin view can see which
 * sources are healthy, degraded, or circuit-open without instrumenting each route.
 *
 * State is module-level → per serverless instance, reset on cold start. A shared
 * store (Redis/DB) is the cross-instance upgrade. See docs/location-data-network.md §8.
 */
import type { CheckedSource } from './core';
import { breakerSnapshot } from './reliability';

export interface SourceHealth {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  /** Result of the most recent check. */
  ok: boolean;
  lastCheckedAt: string;
  lastOkAt: string | null;
  consecutiveFailures: number;
  totalChecks: number;
  totalFailures: number;
}

const store = new Map<string, SourceHealth>();

/** Record the outcome of one fan-out's per-source checks. */
export function recordChecks(checked: CheckedSource[]): void {
  for (const c of checked) {
    const prev = store.get(c.id);
    const totalChecks = (prev?.totalChecks ?? 0) + 1;
    const totalFailures = (prev?.totalFailures ?? 0) + (c.ok ? 0 : 1);
    store.set(c.id, {
      id: c.id,
      name: c.name,
      url: c.url,
      sourceType: c.sourceType,
      ok: c.ok,
      lastCheckedAt: c.fetchedAt,
      lastOkAt: c.ok ? c.fetchedAt : (prev?.lastOkAt ?? null),
      consecutiveFailures: c.ok ? 0 : (prev?.consecutiveFailures ?? 0) + 1,
      totalChecks,
      totalFailures,
    });
  }
}

export type HealthStatus = 'healthy' | 'degraded' | 'circuit_open';

export interface SourceHealthRow extends SourceHealth {
  status: HealthStatus;
  /** Circuit-breaker open state (from the reliability layer). */
  circuitOpen: boolean;
  circuitOpenUntil: string | null;
  /** Failure rate over observed checks, 0–1. */
  failureRate: number;
}

/** Merged health + circuit snapshot, worst sources first. */
export function getHealthSnapshot(): SourceHealthRow[] {
  const breakers = breakerSnapshot();
  const rows: SourceHealthRow[] = [];
  for (const h of store.values()) {
    const b = breakers.get(h.id);
    const circuitOpen = b?.open ?? false;
    const status: HealthStatus = circuitOpen
      ? 'circuit_open'
      : h.ok
        ? 'healthy'
        : 'degraded';
    rows.push({
      ...h,
      status,
      circuitOpen,
      circuitOpenUntil: b?.openUntil
        ? new Date(b.openUntil).toISOString()
        : null,
      failureRate: h.totalChecks ? h.totalFailures / h.totalChecks : 0,
    });
  }
  const rank: Record<HealthStatus, number> = {
    circuit_open: 0,
    degraded: 1,
    healthy: 2,
  };
  return rows.sort((a, b) => rank[a.status] - rank[b.status]);
}

/** Test/diagnostic helper. */
export function _resetHealth(): void {
  store.clear();
}
