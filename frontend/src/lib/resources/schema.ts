/**
 * Normalized resource shape consumed by /api/nearby-resources and the
 * Help Nearby dashboard. Every adapter (ArcGIS REST, open-data, manual
 * fallback) emits this shape so the UI and the map can share one source
 * of truth.
 */
export type SourceType = 'arcgis-rest' | 'open-data' | 'api' | 'manual-fallback';

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
  name: string;
  category: ResourceCategory;
  address?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  lastChecked?: string;
  updatedAt?: string;
  isLive: boolean;
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
