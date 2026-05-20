import { NextRequest, NextResponse } from 'next/server';
import { haversineDistanceMiles } from '@/lib/location/distance';
import {
  liveSourcesFor,
  fallbackSourcesFor,
  type RegisteredSource,
} from '@/lib/resources/sourceRegistry';
import type { NearbyResource, NearbyResponse, SourceMeta, ResourceCategory } from '@/lib/resources/schema';

const MAX_RESULTS = 25;
const MAX_PER_SOURCE_DEFAULT = 8;
const DEFAULT_RADIUS_MILES = 10;
const MAX_RADIUS_MILES = 50;

function parseFloatParam(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function runSources(
  sources: RegisteredSource[],
  query: { latitude: number; longitude: number; radiusMiles: number; category?: ResourceCategory },
): Promise<{ resources: NearbyResource[]; metas: SourceMeta[]; anyFailed: boolean }> {
  const fetchedAt = new Date().toISOString();
  const settled = await Promise.allSettled(sources.map((s) => s.fetch(query)));
  const resources: NearbyResource[] = [];
  const metas: SourceMeta[] = [];
  let anyFailed = false;
  settled.forEach((r, i) => {
    const src = sources[i];
    const ok = r.status === 'fulfilled';
    metas.push({
      id: src.id,
      name: src.name,
      url: src.url,
      sourceType: src.sourceType,
      fetchedAt,
      ok,
    });
    if (ok) {
      resources.push(...r.value);
    } else {
      anyFailed = true;
    }
  });
  return { resources, metas, anyFailed };
}

export async function GET(request: NextRequest): Promise<NextResponse<NearbyResponse>> {
  const { searchParams } = request.nextUrl;

  const latitude = parseFloatParam(searchParams.get('lat'));
  const longitude = parseFloatParam(searchParams.get('lng'));
  const radiusRaw = parseFloatParam(searchParams.get('radiusMiles'));
  const radiusMiles = Math.min(
    MAX_RADIUS_MILES,
    Math.max(0.1, radiusRaw ?? DEFAULT_RADIUS_MILES),
  );
  const category = (searchParams.get('category') as ResourceCategory | null) ?? undefined;

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return NextResponse.json(
      { resources: [], sources: [], degraded: false },
      { status: 400 },
    );
  }

  const query = { latitude, longitude, radiusMiles, category };

  const live = liveSourcesFor(latitude, longitude, category);

  // No registered live source covers this point — return empty, not demo data.
  if (live.length === 0) {
    return NextResponse.json({ resources: [], sources: [], degraded: false });
  }

  const liveRun = await runSources(live, query);

  let resources = liveRun.resources;
  let metas = liveRun.metas;
  let degraded = false;

  // If every live adapter failed AND nothing was returned, try fallback seeds
  // for this point. Anything from fallback is labeled isLive:false by design.
  if (resources.length === 0 && liveRun.anyFailed) {
    const fb = fallbackSourcesFor(latitude, longitude, category);
    if (fb.length > 0) {
      const fbRun = await runSources(fb, query);
      resources = fbRun.resources;
      metas = [...metas, ...fbRun.metas];
      degraded = true;
    }
  }

  const sortedByDistance = resources
    .map((r) => {
      if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number') return r;
      return {
        ...r,
        distanceMiles: haversineDistanceMiles(latitude, longitude, r.latitude, r.longitude),
      };
    })
    .filter((r) =>
      r.distanceMiles === undefined ? true : r.distanceMiles <= radiusMiles,
    )
    .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));

  // Source balancing: on uncategorized "snapshot" calls (the Help dashboard's
  // default mode), prevent a single high-density source from filling the whole
  // global cap and crowding out other authoritative sources. A category-filtered
  // call is treated as a directed search — no per-source cap is applied so the
  // user gets the best matches for that category.
  const perSourceCap = category ? Infinity : MAX_PER_SOURCE_DEFAULT;
  const perSourceCount = new Map<string, number>();
  const balanced: typeof sortedByDistance = [];
  for (const r of sortedByDistance) {
    const key = r.sourceName;
    const n = perSourceCount.get(key) ?? 0;
    if (n >= perSourceCap) continue;
    perSourceCount.set(key, n + 1);
    balanced.push(r);
    if (balanced.length >= MAX_RESULTS) break;
  }

  return NextResponse.json({ resources: balanced, sources: metas, degraded });
}
