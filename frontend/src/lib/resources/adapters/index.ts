/**
 * Adapter registry — maps a source's `sourceType` to the function that fetches
 * and normalizes its data. Every adapter emits NearbyResource[] so the registry,
 * route, UI, and map share one schema. See docs/location-data-network.md §6.
 *
 * Adding a new platform (GeoJSON, generic REST, Places) = write one adapter and
 * add a line here; no route changes.
 */
import type { NearbyQuery, NearbyResource, SourceType } from '../schema';
import { queryArcgisLayer, type ArcgisAdapterConfig } from './arcgis';
import {
  querySocrata,
  type SocrataAdapterConfig,
  type SourceMetaLite,
} from './socrata';

/** Per-source adapter config as stored in the registry (sources.json). */
export type AdapterConfig =
  | ({ kind: 'arcgis-rest' } & Omit<ArcgisAdapterConfig, 'source'>)
  | ({ kind: 'socrata' } & SocrataAdapterConfig);

export function runAdapter(
  sourceType: SourceType,
  config: AdapterConfig,
  source: SourceMetaLite,
  query: NearbyQuery,
): Promise<NearbyResource[]> {
  switch (config.kind) {
    case 'arcgis-rest':
      // queryArcgisLayer carries source meta inside its config; reassemble it.
      return queryArcgisLayer(
        {
          ...config,
          source: {
            id: source.id,
            name: source.name,
            url: source.url,
            sourceType: source.sourceType,
            category: source.category,
          },
        },
        query,
      );
    case 'socrata':
      return querySocrata(config, source, query);
    default: {
      const _exhaustive: never = config;
      throw new Error(`unknown adapter: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
