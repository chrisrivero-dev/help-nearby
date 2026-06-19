/**
 * Normalized resource shape consumed by /api/nearby-resources and the
 * Help Nearby dashboard. Every adapter (ArcGIS REST, open-data, manual
 * fallback) emits this shape so the UI and the map can share one source
 * of truth.
 */
export type SourceType =
  | 'arcgis-rest'
  | 'socrata'
  | 'open-data'
  | 'api'
  | 'manual-fallback';

export type ResourceCategory =
  | 'health'
  | 'social_services'
  | 'library'
  | 'government'
  | 'cooling'
  | 'shelter'
  | 'food'
  | 'recreation'
  | 'other';

export interface NearbyResource {
  id: string;
  resource_key?: string;
  name: string;
  category: ResourceCategory;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  /** Registry id of the (primary) source — set when known; used by reconciliation. */
  sourceId?: string;
  /** Source trust tier (higher wins field conflicts). Set during selection. */
  trust?: number;
  lastChecked?: string;
  updatedAt?: string;
  isLive: boolean;

  // ─── Reconciliation output (present on merged records) ───────────────────
  /** Names of every source that reported this entity, highest-trust first. */
  contributingSources?: string[];
  /** Per-field origin: which source supplied each value, and when. */
  fieldProvenance?: Record<string, FieldProvenance>;
}

export interface FieldProvenance {
  sourceName: string;
  trust: number;
  /** ISO timestamp this source was last fetched/checked. */
  fetchedAt?: string;
}

export interface SourceMeta {
  id: string;
  name: string;
  url: string;
  sourceType: SourceType;
  fetchedAt: string;
  ok: boolean;
}

export interface NearbyQuery {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  category?: ResourceCategory;
}

export interface NearbyResponse {
  resources: NearbyResource[];
  sources: SourceMeta[];
  degraded: boolean;
}
