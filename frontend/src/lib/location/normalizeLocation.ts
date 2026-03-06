export interface NormalizedLocation {
  zipCode: string;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
}

// In-memory cache — avoids repeated network calls for the same ZIP
const _cache = new Map<string, NormalizedLocation>();

export async function normalizeLocation(zip: string): Promise<NormalizedLocation> {
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5);

  const fallback: NormalizedLocation = {
    zipCode: cleanZip,
    city: 'Unknown',
    stateCode: 'US',
    latitude: 0,
    longitude: 0,
    isValid: false,
  };

  if (cleanZip.length !== 5) return fallback;
  if (_cache.has(cleanZip)) return _cache.get(cleanZip)!;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
    if (!res.ok) return fallback;

    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return fallback;

    const result: NormalizedLocation = {
      zipCode: cleanZip,
      city:       place['place name']         ?? 'Unknown',
      stateCode:  place['state abbreviation'] ?? 'US',
      latitude:   parseFloat(place['latitude'])  || 0,
      longitude:  parseFloat(place['longitude']) || 0,
      isValid: true,
    };

    _cache.set(cleanZip, result);
    return result;
  } catch {
    return fallback;
  }
}
