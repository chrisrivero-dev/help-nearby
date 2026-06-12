import { NextRequest, NextResponse } from 'next/server';
import { fetchNwsIncidents } from '@/lib/incidents/nws';
import { fetchIpawsIncidents } from '@/lib/incidents/ipaws';
import type { IncidentItem, CheckedSource } from '@/lib/incidents/types';

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get('lat');
  const lngParam = request.nextUrl.searchParams.get('lng');

  if (!latParam || !lngParam) {
    return NextResponse.json(
      {
        alerts: [],
        sources: [],
        fetchedAt: new Date().toISOString(),
        error: 'missing_coordinates',
      },
      { status: 400 },
    );
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);

  if (!isValidCoordinates(lat, lng)) {
    return NextResponse.json(
      {
        alerts: [],
        sources: [],
        fetchedAt: new Date().toISOString(),
        error: 'invalid_coordinates',
      },
      { status: 400 },
    );
  }

  const fetchedAt = new Date().toISOString();

  try {
    const [nws, ipaws] = await Promise.all([
      fetchNwsIncidents(lat, lng, fetchedAt),
      fetchIpawsIncidents(lat, lng, fetchedAt),
    ]);

    const alerts: IncidentItem[] = [...nws.incidents, ...ipaws.incidents];
    const sources: CheckedSource[] = [
      { name: 'National Weather Service', ok: nws.ok, kind: 'api' },
      { name: 'FEMA IPAWS', ok: ipaws.ok, kind: 'api' },
    ];

    return NextResponse.json({
      alerts,
      sources,
      fetchedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        alerts: [],
        sources: [],
        fetchedAt: new Date().toISOString(),
        error: 'alerts_failed',
      },
      { status: 500 },
    );
  }
}
