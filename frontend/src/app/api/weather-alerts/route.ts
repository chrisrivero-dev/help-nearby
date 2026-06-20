import { NextRequest, NextResponse } from 'next/server';
import { normalizeLocation } from '@/lib/location/normalizeLocation';
import { fetchAlerts } from '@/lib/alerts/registry';

function isValidZip(zip: string | null): zip is string {
  return Boolean(zip && /^\d{5}$/.test(zip));
}

function isValidCoordinates(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get('zip');
  const latParam = request.nextUrl.searchParams.get('lat');
  const lngParam = request.nextUrl.searchParams.get('lng');

  let lat: number;
  let lng: number;
  let location: { latitude: number; longitude: number } | null = null;

  try {
    if (latParam && lngParam) {
      // Coordinates provided directly
      lat = parseFloat(latParam);
      lng = parseFloat(lngParam);
      if (!isValidCoordinates(lat, lng)) {
        return jsonResponse(
          {
            alerts: [],
            source: 'Official alert sources',
            fetchedAt: new Date().toISOString(),
            location: null,
            error: 'invalid_coordinates',
          },
          400,
        );
      }
      // Normalize location for API response
      location = await normalizeLocation(zip || '');
    } else if (zip) {
      // ZIP provided - normalize to coordinates
      if (!isValidZip(zip)) {
        return jsonResponse(
          {
            alerts: [],
            source: 'Official alert sources',
            fetchedAt: new Date().toISOString(),
            location: null,
            error: 'invalid_zip',
          },
          400,
        );
      }
      const normalized = await normalizeLocation(zip);
      if (!normalized?.latitude || !normalized?.longitude) {
        return jsonResponse(
          {
            alerts: [],
            source: 'Official alert sources',
            fetchedAt: new Date().toISOString(),
            location: normalized,
            error: 'unsupported_zip',
          },
          404,
        );
      }
      lat = Number(normalized.latitude);
      lng = Number(normalized.longitude);
      location = normalized;
    } else {
      return jsonResponse(
        {
          alerts: [],
          source: 'Official alert sources',
          fetchedAt: new Date().toISOString(),
          location: null,
          error: 'missing_location',
        },
        400,
      );
    }

    // Scoped alert sources for this point via the shared registry core.
    const { alerts, checked, degraded } = await fetchAlerts(lat, lng);
    const fetchedAt = new Date().toISOString();

    if (degraded && alerts.length === 0) {
      return jsonResponse(
        {
          alerts: [],
          source: 'Official alert sources',
          sources: checked,
          fetchedAt,
          location,
          error: 'official_alerts_unavailable',
        },
        502,
      );
    }

    return jsonResponse({
      alerts,
      source: {
        name: 'Official alert sources',
        url: 'https://www.weather.gov/',
        attribution:
          'Official weather, disaster, geologic, tsunami, and local public-safety alert sources',
      },
      sources: checked,
      fetchedAt,
      location,
      error: null,
    });
  } catch (error) {
    return jsonResponse(
      {
        alerts: [],
        source: 'Official alert sources',
        fetchedAt: new Date().toISOString(),
        location: null,
        error: 'official_alerts_failed',
      },
      500,
    );
  }
}
