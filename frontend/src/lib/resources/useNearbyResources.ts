'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  NearbyResource,
  NearbyResponse,
  SourceMeta,
} from '@/lib/resources/schema';

const NEARBY_CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_RADIUS_MILES = 10;

interface NearbyCacheEntry {
  resources: NearbyResource[];
  sources: SourceMeta[];
  degraded: boolean;
  total: number;
  ts: number;
}

interface NearbyResourcesData {
  resources: NearbyResource[];
  sources: SourceMeta[];
  degraded: boolean;
  total: number;
}

interface UseNearbyResourcesOptions {
  latitude: number;
  longitude: number;
  enabled: boolean;
  radiusMiles?: number;
}

const roundedCoord = (n: number) => n.toFixed(3);

export const nearbyResourcesQueryKey = (
  latitude: number,
  longitude: number,
  radiusMiles = DEFAULT_RADIUS_MILES,
) =>
  [
    'nearby-resources',
    roundedCoord(latitude),
    roundedCoord(longitude),
    radiusMiles,
  ] as const;

const nearbyCacheKey = (
  latitude: number,
  longitude: number,
  radiusMiles = DEFAULT_RADIUS_MILES,
) =>
  `hn:nearby:${roundedCoord(latitude)},${roundedCoord(longitude)}:${radiusMiles}`;

const readNearbyCache = (key: string): NearbyResourcesData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as NearbyCacheEntry;
    if (!entry?.ts || Date.now() - entry.ts > NEARBY_CACHE_TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return {
      resources: entry.resources ?? [],
      sources: entry.sources ?? [],
      degraded: Boolean(entry.degraded),
      total: entry.total ?? entry.resources?.length ?? 0,
    };
  } catch {
    return null;
  }
};

const writeNearbyCache = (key: string, data: NearbyResourcesData): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...data, ts: Date.now() }),
    );
  } catch {
    /* storage full or disabled - non-fatal */
  }
};

async function fetchNearbyResources(
  latitude: number,
  longitude: number,
  radiusMiles: number,
): Promise<NearbyResourcesData> {
  const cacheKey = nearbyCacheKey(latitude, longitude, radiusMiles);
  const cached = readNearbyCache(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    lat: latitude.toString(),
    lng: longitude.toString(),
    radiusMiles: radiusMiles.toString(),
  });
  const res = await fetch(`/api/nearby-resources?${params.toString()}`);
  if (!res.ok) {
    return {
      resources: [],
      sources: [],
      degraded: false,
      total: 0,
    };
  }

  const data = (await res.json()) as NearbyResponse;
  const normalized = {
    resources: data.resources ?? [],
    sources: data.sources ?? [],
    degraded: Boolean(data.degraded),
    total: data.total ?? data.resources?.length ?? 0,
  };
  writeNearbyCache(cacheKey, normalized);
  return normalized;
}

export function useNearbyResources({
  latitude,
  longitude,
  enabled,
  radiusMiles = DEFAULT_RADIUS_MILES,
}: UseNearbyResourcesOptions) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => nearbyResourcesQueryKey(latitude, longitude, radiusMiles),
    [latitude, longitude, radiusMiles],
  );
  const cacheKey = nearbyCacheKey(latitude, longitude, radiusMiles);
  const canFetch =
    enabled &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchNearbyResources(latitude, longitude, radiusMiles),
    enabled: canFetch,
    staleTime: NEARBY_CACHE_TTL_MS,
    gcTime: NEARBY_CACHE_TTL_MS * 2,
  });
  const { refetch } = query;

  const refresh = useCallback(async () => {
    if (!canFetch) return;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(cacheKey);
    }
    await queryClient.invalidateQueries({ queryKey });
    await refetch();
  }, [cacheKey, canFetch, queryClient, queryKey, refetch]);

  return {
    resources: query.data?.resources ?? null,
    sources: query.data?.sources ?? [],
    degraded: query.data?.degraded ?? false,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh,
  };
}
