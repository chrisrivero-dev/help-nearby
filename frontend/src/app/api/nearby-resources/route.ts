import { NextRequest, NextResponse } from 'next/server';
import { haversineDistanceMiles } from '@/lib/location/distance';
import { selectSources, type SelectedSource } from '@/lib/resources/registry';
import type {
  NearbyResponse,
  SourceMeta,
  ResourceCategory,
} from '@/lib/resources/schema';
import { computeResourceKey } from '@/lib/community/resourceKey';
import { reconcileResources } from '@/lib/resources/reconcile';
import { fanOut } from '@/lib/registry/core';
import { reliableRun } from '@/lib/registry/reliability';
import {
  customSourcesToNearbyResources,
  readCustomSources,
} from '@/lib/resources/customSources';

const RESOURCE_CACHE_TTL_SECONDS = 3600;
/** Round coords to ~1km so nearby queries share cache entries. */
const roundCoord = (n: number) => n.toFixed(2);

const DEFAULT_RADIUS_MILES = 10;
const MAX_RADIUS_MILES = 50;

function parseFloatParam(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fan out to the selected sources via the shared registry core, stamping each
 * row with its source id + trust so reconciliation can resolve field conflicts
 * and attribute provenance.
 */
function runSources(
  sources: SelectedSource[],
  query: {
    latitude: number;
    longitude: number;
    radiusMiles: number;
    category?: ResourceCategory;
  },
) {
  const run = reliableRun(
    async (src: SelectedSource) => {
      const out = await src.fetch(query);
      return out.map((res) => ({ ...res, sourceId: src.id, trust: src.trust }));
    },
    {
      cacheKeyFor: (src) =>
        `${src.id}:${roundCoord(query.latitude)},${roundCoord(query.longitude)}:${query.radiusMiles}:${query.category ?? ''}`,
      ttlSecondsFor: (src) => src.ttlSeconds ?? RESOURCE_CACHE_TTL_SECONDS,
    },
  );
  return fanOut(sources, run);
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<NearbyResponse>> {
  const { searchParams } = request.nextUrl;

  const latitude = parseFloatParam(searchParams.get('lat'));
  const longitude = parseFloatParam(searchParams.get('lng'));
  const radiusRaw =
    parseFloatParam(searchParams.get('radiusMiles')) ??
    parseFloatParam(searchParams.get('radius'));
  const radiusMiles = Math.min(
    MAX_RADIUS_MILES,
    Math.max(0.1, radiusRaw ?? DEFAULT_RADIUS_MILES),
  );
  const category =
    (searchParams.get('category') as ResourceCategory | null) ?? undefined;

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { resources: [], sources: [], degraded: false },
      { status: 400 },
    );
  }

  const query = { latitude, longitude, radiusMiles, category };

  const live = await selectSources(latitude, longitude, category);
  const customStore = await readCustomSources();
  const customResources = customSourcesToNearbyResources(
    customStore.sources,
    query,
  ).filter((r) => !category || r.category === category);

  // No registered live or custom source covers this point — return empty, not
  // demo data.
  if (live.length === 0 && customResources.length === 0) {
    return NextResponse.json({
      resources: [],
      sources: [],
      degraded: false,
      total: 0,
    });
  }

  const liveRun =
    live.length > 0
      ? await runSources(live, query)
      : { items: [], checked: [], degraded: false };

  // Reconcile across sources: merge the same real-world entity reported by
  // multiple feeds into one record (trust-ranked fields + per-field provenance)
  // before ranking. See lib/resources/reconcile.ts.
  const resources = reconcileResources([...liveRun.items, ...customResources]);
  // CheckedSource widens sourceType to string for domain-agnosticism; these rows
  // are real SourceTypes, so narrow back for the typed response.
  const metas: SourceMeta[] = liveRun.checked.map((c) => ({
    ...c,
    sourceType: c.sourceType as SourceMeta['sourceType'],
  }));
  const customMeta: SourceMeta[] =
    customResources.length > 0
      ? [
          {
            id: 'custom-sources',
            name: 'Custom community sources',
            url: 'custom.sources.json',
            sourceType: 'custom',
            fetchedAt: new Date().toISOString(),
            ok: true,
          },
        ]
      : [];
  const degraded = liveRun.degraded;

  const sortedByDistance = resources
    .map((r) => {
      if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number')
        return r;
      return {
        ...r,
        distanceMiles: haversineDistanceMiles(
          latitude,
          longitude,
          r.latitude,
          r.longitude,
        ),
      };
    })
    .filter((r) =>
      r.distanceMiles === undefined ? true : r.distanceMiles <= radiusMiles,
    )
    .sort(
      (a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity),
    );

  const total = sortedByDistance.length;

  const withKeys = sortedByDistance.map((r) => ({
    ...r,
    resource_key: computeResourceKey(r.name, r.address),
  }));

  return NextResponse.json({
    resources: withKeys,
    sources: [...metas, ...customMeta],
    degraded,
    total,
  });
}
