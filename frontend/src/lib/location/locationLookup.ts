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

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&addressdetails=1&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'help-nearby-app/1.0 (+https://github.com/chrisrivero-dev/help-nearby)',
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
    const city = address.city || address.town || address.village || address.hamlet || '';
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