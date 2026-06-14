import type {
  NearbyResource,
  NearbyQuery,
  ResourceCategory,
  SourceType,
} from '../schema';

/**
 * Generic adapter for ArcGIS REST FeatureServer / MapServer query endpoints.
 * Each registry entry supplies the layer URL, a field map, and metadata; the
 * adapter handles the HTTP call, timeout, JSON parsing, and normalization.
 */

export interface ArcgisFieldMap {
  id?: string; // attribute holding a stable id; if absent we synthesize from OBJECTID
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  /** Attribute holding latitude in WGS84. If absent, geometry.y is used (after projection). */
  latitude?: string;
  /** Attribute holding longitude in WGS84. If absent, geometry.x is used (after projection). */
  longitude?: string;
  updatedAt?: string;
  /** Optional attribute carrying a per-row category override. */
  category?: string;
}

export interface ArcgisAdapterConfig {
  /** Layer query URL, e.g. https://…/MapServer/4/query (we append params). */
  layerUrl: string;
  fieldMap: ArcgisFieldMap;
  source: {
    id: string;
    name: string;
    url: string;
    sourceType: SourceType;
    category: ResourceCategory;
  };
  /** Optional server-side WHERE clause; defaults to 1=1. */
  where?: string;
  /** Timeout in ms. Defaults to 6000. */
  timeoutMs?: number;
  /**
   * Opt-in: send the query point + radius to ArcGIS as a spatial filter so the
   * server returns only nearby features. Required for any source whose layer
   * has more than ~1000 features nationwide, since ArcGIS otherwise truncates
   * results by OBJECTID order rather than distance.
   */
  useSpatialQuery?: boolean;
}

interface ArcgisFeature {
  attributes: Record<string, unknown>;
  geometry?: { x?: number; y?: number };
}

interface ArcgisQueryResponse {
  features?: ArcgisFeature[];
  error?: { code: number; message: string };
}

function pickString(
  attrs: Record<string, unknown>,
  key?: string,
): string | undefined {
  if (!key) return undefined;
  const v = attrs[key];
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length > 0 ? s : undefined;
}

function pickNumber(
  attrs: Record<string, unknown>,
  key?: string,
): number | undefined {
  if (!key) return undefined;
  const v = attrs[key];
  if (v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export async function queryArcgisLayer(
  cfg: ArcgisAdapterConfig,
  q: NearbyQuery,
): Promise<NearbyResource[]> {
  const where = cfg.where ?? '1=1';
  const outFields = Array.from(
    new Set(
      Object.values(cfg.fieldMap).filter(
        (v): v is string => typeof v === 'string' && v.length > 0,
      ),
    ),
  ).join(',');

  const params = new URLSearchParams({
    where,
    outFields: outFields || '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });

  if (cfg.useSpatialQuery) {
    params.set('geometry', JSON.stringify({ x: q.longitude, y: q.latitude }));
    params.set('geometryType', 'esriGeometryPoint');
    params.set('inSR', '4326');
    params.set('spatialRel', 'esriSpatialRelIntersects');
    params.set('distance', String(q.radiusMiles));
    params.set('units', 'esriSRUnit_StatuteMile');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? 6000);
  let data: ArcgisQueryResponse;
  try {
    const res = await fetch(`${cfg.layerUrl}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`arcgis_http_${res.status}`);
    data = (await res.json()) as ArcgisQueryResponse;
  } finally {
    clearTimeout(timer);
  }

  if (data.error) throw new Error(`arcgis_error_${data.error.code}`);

  const features = Array.isArray(data.features) ? data.features : [];
  const lastChecked = new Date().toISOString();

  const out: NearbyResource[] = [];
  for (const feat of features) {
    const attrs = feat.attributes ?? {};
    const name = pickString(attrs, cfg.fieldMap.name);
    if (!name) continue;

    const lat = pickNumber(attrs, cfg.fieldMap.latitude) ?? feat.geometry?.y;
    const lng = pickNumber(attrs, cfg.fieldMap.longitude) ?? feat.geometry?.x;

    const rawId =
      pickString(attrs, cfg.fieldMap.id) ??
      String(attrs.OBJECTID ?? attrs.FID ?? '');
    const id = rawId
      ? `${cfg.source.id}:${rawId}`
      : `${cfg.source.id}:${name}:${lat ?? '?'},${lng ?? '?'}`;

    out.push({
      id,
      name,
      category: cfg.source.category,
      address: pickString(attrs, cfg.fieldMap.address),
      city: pickString(attrs, cfg.fieldMap.city),
      state: pickString(attrs, cfg.fieldMap.state),
      zip: pickString(attrs, cfg.fieldMap.zip),
      phone: pickString(attrs, cfg.fieldMap.phone),
      website: pickString(attrs, cfg.fieldMap.website),
      latitude:
        typeof lat === 'number' && Number.isFinite(lat) ? lat : undefined,
      longitude:
        typeof lng === 'number' && Number.isFinite(lng) ? lng : undefined,
      sourceName: cfg.source.name,
      sourceUrl: cfg.source.url,
      sourceType: cfg.source.sourceType,
      lastChecked,
      updatedAt: pickString(attrs, cfg.fieldMap.updatedAt),
      isLive: true,
    });
  }
  return out;
}
