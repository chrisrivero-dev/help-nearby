import type {
  IncidentCategory,
  IncidentItem,
  IncidentSeverity,
} from './types';

type IpawsArea = {
  areaDesc?: string;
  polygon?: string;
};

type IpawsInfo = {
  event?: string;
  category?: string[];
  urgency?: string;
  severity?: string;
  certainty?: string;
  effective?: string;
  expires?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  area?: IpawsArea[];
};

type IpawsGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }
  | null;

type IpawsRecord = {
  identifier?: string;
  sender?: string;
  sent?: string;
  status?: string;
  msgType?: string;
  scope?: string;
  searchGeometry?: IpawsGeometry;
  info?: IpawsInfo[];
};

type IpawsFetchResult = {
  ok: boolean;
  incidents: IncidentItem[];
};

const IPAWS_DATASET_URL =
  'https://www.fema.gov/api/open/v1/IpawsArchivedAlerts';
const LOOKBACK_HOURS = 6;
const MAX_RECORDS = 500;

function mapSeverity(cap: string | undefined): IncidentSeverity {
  switch ((cap || '').toLowerCase()) {
    case 'extreme':
      return 'emergency';
    case 'severe':
      return 'warning';
    case 'moderate':
      return 'watch';
    default:
      return 'advisory';
  }
}

function mapCategory(event: string | undefined): IncidentCategory {
  const e = (event || '').toLowerCase();
  if (!e) return 'other';
  if (e.includes('evacuation')) return 'evacuation';
  if (e.includes('shelter')) return 'shelter-in-place';
  if (e.includes('hazardous materials') || e.includes('hazmat')) return 'hazmat';
  if (e.includes('fire')) return 'fire';
  if (
    e.includes('tornado') ||
    e.includes('thunderstorm') ||
    e.includes('flood') ||
    e.includes('hurricane') ||
    e.includes('tropical') ||
    e.includes('winter') ||
    e.includes('storm') ||
    e.includes('wind') ||
    e.includes('heat')
  ) {
    return 'weather';
  }
  return 'other';
}

// Ray-casting point-in-polygon for a single linear ring.
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 0e0) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(
  lat: number,
  lng: number,
  geom: IpawsGeometry,
): boolean {
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    const rings = geom.coordinates;
    if (!rings.length) return false;
    // Outer ring only; ignore holes (these alerts don't use them).
    return pointInRing(lng, lat, rings[0]);
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some(
      (poly) => poly.length > 0 && pointInRing(lng, lat, poly[0]),
    );
  }
  return false;
}

// "200170_AlertOC_County_of_Orange" -> "AlertOC / County of Orange"
function humanizeSender(sender: string | undefined): string {
  if (!sender) return 'unknown sender';
  const stripped = sender.replace(/^\d+_/, '');
  const parts = stripped.split(/_+/).filter(Boolean);
  if (parts.length <= 1) return stripped.replace(/_/g, ' ');
  return `${parts[0]} / ${parts.slice(1).join(' ').replace(/_/g, ' ')}`;
}

function isAllowedMsgType(msgType: string | undefined): boolean {
  const m = (msgType || '').toLowerCase();
  return m === 'alert' || m === 'update';
}

export async function fetchIpawsIncidents(
  lat: number,
  lng: number,
  fetchedAt: string,
): Promise<IpawsFetchResult> {
  const since = new Date(
    Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const filter = `sent gt '${since}'`;
  const url =
    `${IPAWS_DATASET_URL}?$filter=${encodeURIComponent(filter)}` +
    `&$top=${MAX_RECORDS}&$orderby=sent%20desc`;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { ok: false, incidents: [] };
    }

    const data = (await response.json()) as {
      IpawsArchivedAlerts?: IpawsRecord[];
    };
    const records = Array.isArray(data.IpawsArchivedAlerts)
      ? data.IpawsArchivedAlerts
      : [];

    const nowMs = Date.now();

    const incidents: IncidentItem[] = [];
    for (const r of records) {
      if ((r.status || '').toLowerCase() !== 'actual') continue;
      if (!isAllowedMsgType(r.msgType)) continue;

      const info = r.info && r.info.length > 0 ? r.info[0] : undefined;
      if (!info) continue;

      const expiresStr = info.expires;
      if (!expiresStr) continue;
      const expMs = Date.parse(expiresStr);
      if (!Number.isFinite(expMs) || expMs <= nowMs) continue;

      if (!pointInGeometry(lat, lng, r.searchGeometry ?? null)) continue;

      const areaDesc = info.area?.[0]?.areaDesc || '';
      const sender = humanizeSender(r.sender);

      incidents.push({
        id: `ipaws-${r.identifier || `${r.sender}-${r.sent}`}`,
        title: info.headline || info.event || 'Public Safety Alert',
        status: 'active',
        severity: mapSeverity(info.severity),
        category: mapCategory(info.event),
        area: areaDesc,
        geometry: r.searchGeometry ?? null,
        effective: info.effective || r.sent || null,
        expires: expiresStr,
        instructions: info.instruction || info.description || '',
        source: {
          name: `FEMA IPAWS via ${sender}`,
          url: IPAWS_DATASET_URL,
          kind: 'api',
          fetchedAt,
        },
      });
    }

    return { ok: true, incidents };
  } catch {
    return { ok: false, incidents: [] };
  }
}
