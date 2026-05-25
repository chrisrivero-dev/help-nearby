import manualIncidentsData from '@/data/manual-incidents.json';
import type { IncidentItem, ManualIncidentEntry } from './types';

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function isManualEntry(value: unknown): value is ManualIncidentEntry {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.status === 'string' &&
    typeof v.lat === 'number' &&
    typeof v.lng === 'number' &&
    typeof v.radiusKm === 'number' &&
    typeof v.source === 'object' &&
    v.source !== null
  );
}

type ManualFetchResult = {
  ok: boolean;
  incidents: IncidentItem[];
};

export function loadManualIncidents(
  lat: number,
  lng: number,
  radiusKm: number,
  now: Date,
): ManualFetchResult {
  try {
    const raw = manualIncidentsData as unknown;
    if (!Array.isArray(raw)) return { ok: true, incidents: [] };

    const entries = raw.filter(isManualEntry);
    const nowMs = now.getTime();

    const incidents: IncidentItem[] = entries
      .filter((entry) => {
        if (entry.expires) {
          const exp = Date.parse(entry.expires);
          if (Number.isFinite(exp) && exp < nowMs) return false;
        }
        const distance = haversineKm(lat, lng, entry.lat, entry.lng);
        return distance <= entry.radiusKm + radiusKm;
      })
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        status: entry.status,
        severity: entry.severity,
        category: entry.category,
        area: entry.area,
        geometry: null,
        effective: entry.effective,
        expires: entry.expires,
        instructions: entry.instructions,
        source: {
          name: entry.source.name,
          url: entry.source.url,
          kind: 'manual-source-backed',
          fetchedAt: entry.source.verifiedAt,
        },
      }));

    return { ok: true, incidents };
  } catch {
    return { ok: false, incidents: [] };
  }
}
