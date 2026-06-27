/**
 * Dependency-free point-in-polygon for GeoJSON Polygon / MultiPolygon features,
 * with a cheap bounding-box prefilter. Coordinates are [lng, lat] (GeoJSON order).
 *
 * No external geo library: the hub-first coverage bundle is a handful of polygons,
 * so a linear scan with a bbox prefilter is fast enough. When the national county
 * bundle lands (~3,200 polygons) swap the prefilter for a Flatbush R-tree index —
 * the `pointInFeature` primitive stays the same. See docs/location-data-network.md.
 */

type Ring = number[][]; // [[lng,lat], ...]
type PolygonCoords = Ring[]; // [outerRing, ...holes]

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry:
    | { type: 'Polygon'; coordinates: PolygonCoords }
    | { type: 'MultiPolygon'; coordinates: PolygonCoords[] };
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

/** Ray-casting test against a single linear ring. */
function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Inside the outer ring AND not inside any hole. */
function pointInPolygon(
  lng: number,
  lat: number,
  poly: PolygonCoords,
): boolean {
  if (poly.length === 0) return false;
  if (!pointInRing(lng, lat, poly[0])) return false;
  for (let h = 1; h < poly.length; h++) {
    if (pointInRing(lng, lat, poly[h])) return false; // in a hole
  }
  return true;
}

export function pointInFeature(
  lng: number,
  lat: number,
  feature: GeoFeature,
): boolean {
  const g = feature.geometry;
  if (g.type === 'Polygon') return pointInPolygon(lng, lat, g.coordinates);
  for (const poly of g.coordinates) {
    if (pointInPolygon(lng, lat, poly)) return true;
  }
  return false;
}

/** Axis-aligned bounding box of a feature, computed once and cached on the object. */
export function featureBBox(feature: GeoFeature): BBox {
  const cached = (feature as { _bbox?: BBox })._bbox;
  if (cached) return cached;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  const polys =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  for (const poly of polys) {
    for (const [lng, lat] of poly[0]) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  const bbox = { minLng, minLat, maxLng, maxLat };
  (feature as { _bbox?: BBox })._bbox = bbox;
  return bbox;
}

function inBBox(lng: number, lat: number, b: BBox): boolean {
  return (
    lng >= b.minLng && lng <= b.maxLng && lat >= b.minLat && lat <= b.maxLat
  );
}

/**
 * First feature in the collection whose polygon contains the point.
 * Runs the bbox prefilter before the (more expensive) ray-casting test.
 */
export function findContainingFeature(
  lng: number,
  lat: number,
  collection: FeatureCollection,
): GeoFeature | null {
  for (const feature of collection.features) {
    if (!inBBox(lng, lat, featureBBox(feature))) continue;
    if (pointInFeature(lng, lat, feature)) return feature;
  }
  return null;
}
