import { NextRequest, NextResponse } from 'next/server';
import { fetchNwsIncidents } from '@/lib/incidents/nws';
import { fetchIpawsIncidents } from '@/lib/incidents/ipaws';
import { loadManualIncidents } from '@/lib/incidents/manualIncidents';
import type {
  CheckedSource,
  IncidentApiResponse,
  IncidentItem,
} from '@/lib/incidents/types';

// Active incident data must not be over-cached. Route is dynamic; NWS fetch
// uses a short 60s revalidate window.
export const dynamic = 'force-dynamic';

const DEFAULT_RADIUS_KM = 50;
const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 500;

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function clampRadius(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_RADIUS_KM;
  return Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, value));
}

function badRequest(error: string): NextResponse<IncidentApiResponse> {
  return NextResponse.json(
    {
      incidents: [],
      checkedSources: [],
      generatedAt: new Date().toISOString(),
      error,
    },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const latParam = params.get('lat');
  const lngParam = params.get('lng');
  const radiusParam = params.get('radiusKm');

  if (!latParam || !lngParam) {
    return badRequest('missing_coordinates');
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);
  if (!isValidCoord(lat, lng)) {
    return badRequest('invalid_coordinates');
  }

  const radiusKm = clampRadius(
    radiusParam ? parseFloat(radiusParam) : DEFAULT_RADIUS_KM,
  );

  const generatedAt = new Date().toISOString();

  const [nws, ipaws, manual] = await Promise.all([
    fetchNwsIncidents(lat, lng, generatedAt),
    fetchIpawsIncidents(lat, lng, generatedAt),
    Promise.resolve(loadManualIncidents(lat, lng, radiusKm, new Date())),
  ]);

  const incidents: IncidentItem[] = [
    ...nws.incidents,
    ...ipaws.incidents,
    ...manual.incidents,
  ];

  const checkedSources: CheckedSource[] = [
    { name: 'National Weather Service', ok: nws.ok, kind: 'api' },
    { name: 'FEMA IPAWS', ok: ipaws.ok, kind: 'api' },
    { name: 'Manual source-backed registry', ok: manual.ok, kind: 'manual' },
  ];

  const anySourceOk = checkedSources.some((s) => s.ok);

  const body: IncidentApiResponse = {
    incidents,
    checkedSources,
    generatedAt,
  };

  if (incidents.length === 0 && anySourceOk) {
    body.message = 'No active official alerts for this area right now.';
  }

  return NextResponse.json(body, { status: 200 });
}
