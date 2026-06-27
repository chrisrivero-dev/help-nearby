export interface ZipCodeLocation {
  zipCode: string;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
}

// In-memory cache — avoids repeated network calls for the same query
const _cache = new Map<string, ZipCodeLocation>();

// Query mentions NYC or a borough → worth trying the city-native geocoder first.
const NYC_HINT =
  /\b(nyc|new york|manhattan|brooklyn|queens|the bronx|bronx|staten island)\b/i;

/**
 * NYC GeoSearch (geosearch.planninglabs.nyc, official NYC DCP) — rooftop-accurate,
 * no API key. Only matches NYC addresses, so we gate it behind an NYC hint and fall
 * back to Nominatim when it returns nothing. Sharper than Nominatim inside the city,
 * which improves which NYC sub-area the resolver picks for all panels.
 */
async function lookupNycGeoSearch(
  query: string,
): Promise<ZipCodeLocation | null> {
  try {
    const url = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(
      query,
    )}&size=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const feature = data?.features?.[0];
    const coords = feature?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;

    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const props = feature.properties ?? {};
    return {
      zipCode: typeof props.postalcode === 'string' ? props.postalcode : '',
      city: props.borough || props.locality || 'New York',
      stateCode: typeof props.region === 'string' ? props.region : 'New York',
      latitude: lat,
      longitude: lng,
      isValid: true,
    };
  } catch (e) {
    console.error('GeoSearch lookup error:', e);
    return null;
  }
}

/**
 * Lookup location information based on a query.
 * If the query looks like a US ZIP code (5 digits), use the Zippopotam.us API.
 * Otherwise treat the query as an address (city, state, or full address) and use
 * the OpenStreetMap Nominatim API.
 *
 * @param query - ZIP code string or free‑form address.
 * @returns location data conforming to ZipCodeLocation.
 */
export async function lookupLocation(query: string): Promise<ZipCodeLocation> {
  const cleanQuery = query.trim();

  // Determine if query is a ZIP code (5 numeric digits)
  const zipMatch = cleanQuery.replace(/\D/g, '').slice(0, 5);
  const isZip = /^\d{5}$/.test(zipMatch);

  // Common fallback when lookup fails
  const fallback: ZipCodeLocation = {
    zipCode: isZip ? zipMatch : '',
    city: 'Unknown',
    stateCode: '',
    latitude: 0,
    longitude: 0,
    isValid: false,
  };

  // -------------------
  // ZIP code handling
  // -------------------
  if (isZip) {
    if (_cache.has(zipMatch)) return _cache.get(zipMatch)!;

    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zipMatch}`);
      if (!res.ok) return fallback;

      const data = await res.json();
      const place = data?.places?.[0];
      if (!place) return fallback;

      const lat = parseFloat(place['latitude']);
      const lng = parseFloat(place['longitude']);
      if (isNaN(lat) || isNaN(lng)) return fallback;

      const result: ZipCodeLocation = {
        zipCode: zipMatch,
        city: place['place name'] ?? 'Unknown',
        stateCode: place['state abbreviation'] ?? '',
        latitude: lat,
        longitude: lng,
        isValid: true,
      };
      _cache.set(zipMatch, result);
      return result;
    } catch (e) {
      console.error('ZIP lookup error:', e);
      return fallback;
    }
  }

  // -------------------
  // Address handling
  // -------------------
  const cacheKey = `addr:${cleanQuery.toLowerCase()}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey)!;

  // City-native geocoder for NYC-looking queries; falls back to Nominatim below.
  if (NYC_HINT.test(cleanQuery)) {
    const nyc = await lookupNycGeoSearch(cleanQuery);
    if (nyc) {
      _cache.set(cacheKey, nyc);
      return nyc;
    }
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery,
    )}&addressdetails=1&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'help-nearby-app/1.0 (+https://github.com/chrisrivero-dev/help-nearby)',
      },
    });
    if (!res.ok) return fallback;

    const results = await res.json();
    if (!results || results.length === 0) return fallback;

    const first = results[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (isNaN(lat) || isNaN(lng)) return fallback;

    const address = first.address || {};
    const city =
      address.city || address.town || address.village || address.hamlet || '';
    const state = address.state || '';

    const result: ZipCodeLocation = {
      zipCode: '',
      city,
      stateCode: state,
      latitude: lat,
      longitude: lng,
      isValid: true,
    };
    _cache.set(cacheKey, result);
    return result;
  } catch (e) {
    console.error('Address lookup error:', e);
    return fallback;
  }
}
