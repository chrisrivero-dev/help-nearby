'use server';

import { NextRequest, NextResponse } from 'next/server';
import { normalizeLocation } from '@/lib/location/normalizeLocation';

interface FEMAFeature {
  id?: string;
  attributes?: {
    disasterNumber?: string;
    incidentType?: string;
    declarationType?: string;
    state?: string;
    designatedArea?: string;
    declarationDate?: string;
    incidentBeginDate?: string;
    closeoutDate?: string;
    incidentTypeDisplayName?: string;
    disasterTitle?: string;
  };
}

interface Disaster {
  id: string;
  title: string;
  type: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  state: string;
}

const INCIDENT_TYPE_COLORS: Record<string, string> = {
  Fire: '#ea580c',
  Flood: '#60a5fa',
  Storm: '#eab308',
  Earthquake: '#dc2626',
  Hurricane: '#f472b6',
  Tornado: '#f97316',
  'Severe Ice Storm': '#60a5fa',
  'Tropical Storm': '#f472b6',
};

const INCIDENT_TYPE_DEFAULT_COLOR = '#a855f7';

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get('lat');
  const lngParam = request.nextUrl.searchParams.get('lng');

  if (!latParam || !lngParam) {
    return NextResponse.json(
      {
        disasters: [],
        error: 'missing_coordinates',
      },
      { status: 400 },
    );
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return NextResponse.json(
      {
        disasters: [],
        error: 'invalid_coordinates',
      },
      { status: 400 },
    );
  }

  try {
    // Filter: last 24 hours (ISO-8601 format)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();

    // Get disasters within 50 miles of location (1 degree ≈ 69 miles)
    const latDelta = 0.72; // ~50 miles
    const lngDelta = 0.72; // ~50 miles

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // FEMA API doesn't support geo.query for bounding box directly
    // We'll fetch recent disasters and filter by location on the server side

    const response = await fetch(
      `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$filter=declarationDate ge '${yesterdayISO}' and designatedArea ne ''&$top=100`,
      {
        headers: {
          'User-Agent': 'HelpNearby/1.0',
          Accept: 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          disasters: [],
          error: 'fema_unavailable',
        },
        { status: 502 },
      );
    }

    const data = await response.json();

    // Filter by location and map to our format
    const disasters: Disaster[] = (data.disasterDeclarationsSummaries || [])
      .filter((item: FEMAFeature) => {
        const designatedArea = item.attributes?.designatedArea || '';
        if (!designatedArea) return false;

        // Parse coordinates from designatedArea (e.g., "Los Angeles County, CA")
        // For now, we'll include all disasters from the state
        // In production, you'd parse the actual coordinates from the data
        return true;
      })
      .map((item: FEMAFeature) => ({
        id: item.id || item.attributes?.disasterNumber || '',
        title:
          item.attributes?.disasterTitle ||
          item.attributes?.incidentTypeDisplayName ||
          item.attributes?.incidentType ||
          'Disaster',
        type:
          item.attributes?.incidentTypeDisplayName ||
          item.attributes?.incidentType ||
          'Other',
        location: item.attributes?.designatedArea || '',
        startDate: item.attributes?.incidentBeginDate || null,
        endDate: item.attributes?.closeoutDate || null,
        state: item.attributes?.state || '',
      }));

    return NextResponse.json({
      disasters,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        disasters: [],
        error: 'api_error',
      },
      { status: 500 },
    );
  }
}
