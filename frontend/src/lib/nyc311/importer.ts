import { fanOut, type CheckedSource } from '@/lib/registry/core';
import { reliableRun } from '@/lib/registry/reliability';
import type { SelectedCommunitySource } from '@/lib/community/sources/types';
import { selectNyc311Sources } from './registry';
import { normalizeNyc311Item } from './normalize';
import type { NYC311Item } from './types';

export interface Nyc311ImportOptions {
  latitude: number;
  longitude: number;
}

export interface Nyc311ImportResult {
  items: NYC311Item[];
  /** True when at least one NYC source covers the point (jurisdiction match). */
  applies: boolean;
  checked: CheckedSource[];
  degraded: boolean;
}

/**
 * Collect live NYC 311 records for a point. Unlike the community vertical there
 * is no persistent store/moderation — 311 data is ephemeral, so we fetch →
 * normalize → return. `applies:false` means no NYC source matched (non-NYC
 * point), which the panel uses to hide itself.
 */
export async function collectNyc311(
  opts: Nyc311ImportOptions,
): Promise<Nyc311ImportResult> {
  const sources = await selectNyc311Sources(opts.latitude, opts.longitude);
  if (sources.length === 0) {
    return { items: [], applies: false, checked: [], degraded: false };
  }

  const run = reliableRun(
    async (source: SelectedCommunitySource) =>
      (await source.fetch())
        .map((item) => normalizeNyc311Item(item, source))
        .filter((item): item is NYC311Item => !!item),
    {
      cacheKeyFor: (source) =>
        `nyc311:${source.id}:${opts.latitude.toFixed(3)}:${opts.longitude.toFixed(3)}`,
      ttlSecondsFor: (source) => source.ttlSeconds ?? 600,
    },
  );

  const out = await fanOut(sources, run);
  return {
    items: out.items,
    applies: true,
    checked: out.checked,
    degraded: out.degraded,
  };
}
