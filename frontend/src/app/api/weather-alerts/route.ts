import { NextRequest, NextResponse } from 'next/server';
import { normalizeLocation } from '@/lib/location/normalizeLocation';

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

type NwsFeature = {
  id?: string;
  properties?: {
    id?: string;
    event?: string;
    headline?: string;
    description?: string;
    instruction?: string;
    severity?: string;
    urgency?: string;
    certainty?: string;
    effective?: string;
    expires?: string;
    areaDesc?: string;
    web?: string;
    senderName?: string;
  };
};

type WeatherAlert = {
  id: string;
  title: string;
  headline: string;
  description: string;
  instruction: string;
  severity: string;
  urgency: string;
  certainty: string;
  effective: string | null;
  expires: string | null;
  area: string;
  url: string;
};

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
            source: 'National Weather Service',
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
            source: 'National Weather Service',
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
            source: 'National Weather Service',
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
          source: 'National Weather Service',
          fetchedAt: new Date().toISOString(),
          location: null,
          error: 'missing_location',
        },
        400,
      );
    }

    const nwsUrl = `https://api.weather.gov/alerts/active?point=${lat.toFixed(
      4,
    )},${lng.toFixed(4)}`;

    const response = await fetch(nwsUrl, {
      headers: {
        'User-Agent': 'HelpNearby/1.0 (https://helpnearby.co)',
        Accept: 'application/geo+json',
      },
      next: { revalidate: 300 },
    });

    const fetchedAt = new Date().toISOString();

    if (!response.ok) {
      return jsonResponse(
        {
          alerts: [],
          source: 'National Weather Service',
          fetchedAt,
          location,
          error: 'nws_unavailable',
        },
        502,
      );
    }

    const data = await response.json();

    const alerts: WeatherAlert[] = Array.isArray(data.features)
      ? data.features.map((feature: NwsFeature, index: number) => {
          const properties = feature.properties || {};

          return {
            id: properties.id || feature.id || `nws-alert-${index}`,
            title: properties.event || 'Weather Alert',
            headline:
              properties.headline ||
              properties.event ||
              'Official weather alert',
            description: properties.description || '',
            instruction: properties.instruction || '',
            severity: properties.severity || 'Unknown',
            urgency: properties.urgency || 'Unknown',
            certainty: properties.certainty || 'Unknown',
            effective: properties.effective || null,
            expires: properties.expires || null,
            area: properties.areaDesc || '',
            url: properties.web || 'https://www.weather.gov/',
          };
        })
      : [];

    return jsonResponse({
      alerts,
      source: {
        name: 'National Weather Service',
        url: 'https://www.weather.gov/',
        attribution:
          'Official weather alerts from the National Weather Service',
      },
      fetchedAt,
      location,
      error: null,
    });
  } catch (error) {
    return jsonResponse(
      {
        alerts: [],
        source: 'National Weather Service',
        fetchedAt: new Date().toISOString(),
        location: null,
        error: 'weather_alerts_failed',
      },
      500,
    );
  }
}
