'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  NearbyResource,
  NearbyResponse,
  SourceMeta,
} from '@/lib/resources/schema';

const NEARBY_CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_RADIUS_MILES = 10;
const PROGRESSIVE_RADIUS_STAGES = [0.5, 1, 3, DEFAULT_RADIUS_MILES] as const;

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

interface ProgressiveNearbyResourcesOptions extends UseNearbyResourcesOptions {
  radiusStages?: readonly number[];
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

const emptyNearbyResourcesData = (): NearbyResourcesData => ({
  resources: [],
  sources: [],
  degraded: false,
  total: 0,
});

const canFetchNearby = (
  enabled: boolean,
  latitude: number,
  longitude: number,
) =>
  enabled &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

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
  const canFetch = canFetchNearby(enabled, latitude, longitude);

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

export function useProgressiveNearbyResources({
  latitude,
  longitude,
  enabled,
  radiusMiles = DEFAULT_RADIUS_MILES,
  radiusStages = PROGRESSIVE_RADIUS_STAGES,
}: ProgressiveNearbyResourcesOptions) {
  const queryClient = useQueryClient();
  const canFetch = canFetchNearby(enabled, latitude, longitude);
  const [data, setData] = useState<NearbyResourcesData | null>(null);
  const [loadedRadiusMiles, setLoadedRadiusMiles] = useState<number | null>(
    null,
  );
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isUsingPreviousLocationData, setIsUsingPreviousLocationData] =
    useState(false);
  const [error, setError] = useState<unknown>(null);
  const requestSeq = useRef(0);
  const dataRef = useRef<NearbyResourcesData | null>(null);

  const stages = useMemo(() => {
    const unique = Array.from(
      new Set([...radiusStages, radiusMiles].filter((r) => r > 0)),
    );
    return unique
      .map((r) => Math.min(r, radiusMiles))
      .filter((r, index, arr) => arr.indexOf(r) === index)
      .sort((a, b) => a - b);
  }, [radiusMiles, radiusStages]);

  const targetRadiusMiles = stages[stages.length - 1] ?? radiusMiles;

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const runProgressiveFetch = useCallback(
    async ({ bypassCache = false }: { bypassCache?: boolean } = {}) => {
      const seq = requestSeq.current + 1;
      requestSeq.current = seq;
      setError(null);

      if (!canFetch) {
        setData(null);
        setLoadedRadiusMiles(null);
        setIsInitialLoading(false);
        setIsExpanding(false);
        setIsUsingPreviousLocationData(false);
        return;
      }

      const currentData = dataRef.current;
      const hadData = currentData !== null;
      setIsInitialLoading(!hadData);
      setIsExpanding(hadData);
      setIsUsingPreviousLocationData(hadData);

      if (bypassCache && typeof window !== 'undefined') {
        for (const stageRadius of stages) {
          window.localStorage.removeItem(
            nearbyCacheKey(latitude, longitude, stageRadius),
          );
          await queryClient.invalidateQueries({
            queryKey: nearbyResourcesQueryKey(latitude, longitude, stageRadius),
          });
        }
      }

      let latest = currentData ?? emptyNearbyResourcesData();

      for (const stageRadius of stages) {
        if (requestSeq.current !== seq) return;
        try {
          const stageData = await queryClient.fetchQuery({
            queryKey: nearbyResourcesQueryKey(latitude, longitude, stageRadius),
            queryFn: () =>
              fetchNearbyResources(latitude, longitude, stageRadius),
            staleTime: NEARBY_CACHE_TTL_MS,
            gcTime: NEARBY_CACHE_TTL_MS * 2,
          });

          if (requestSeq.current !== seq) return;
          latest = stageData;
          dataRef.current = stageData;
          setData(stageData);
          setLoadedRadiusMiles(stageRadius);
          setIsInitialLoading(false);
          setIsUsingPreviousLocationData(false);
          setIsExpanding(stageRadius < targetRadiusMiles);
        } catch (err) {
          if (requestSeq.current !== seq) return;
          setError(err);
          if (!latest.resources.length) {
            setData(emptyNearbyResourcesData());
            dataRef.current = emptyNearbyResourcesData();
            setLoadedRadiusMiles(stageRadius);
            setIsInitialLoading(false);
            setIsUsingPreviousLocationData(false);
          }
        }
      }

      if (requestSeq.current !== seq) return;
      setIsInitialLoading(false);
      setIsExpanding(false);
      setIsUsingPreviousLocationData(false);
    },
    [canFetch, latitude, longitude, queryClient, stages, targetRadiusMiles],
  );

  useEffect(() => {
    void runProgressiveFetch();
  }, [runProgressiveFetch]);

  const refresh = useCallback(async () => {
    await runProgressiveFetch({ bypassCache: true });
  }, [runProgressiveFetch]);

  return {
    resources: data?.resources ?? null,
    sources: data?.sources ?? [],
    degraded: data?.degraded ?? false,
    total: data?.total ?? 0,
    loadedRadiusMiles,
    targetRadiusMiles,
    isLoading: isInitialLoading,
    isFetching: isInitialLoading || isExpanding,
    isInitialLoading,
    isExpanding,
    isStaleWhileLoading: isUsingPreviousLocationData,
    error,
    refresh,
  };
}
