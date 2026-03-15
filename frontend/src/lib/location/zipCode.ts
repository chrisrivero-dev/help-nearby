export interface ZipCodeLocation {
  zipCode: string;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
}

// In-memory cache — avoids repeated network calls for the same ZIP
const _cache = new Map<string, ZipCodeLocation>();

export async function lookupZipCode(zip: string): Promise<ZipCodeLocation> {
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5);

  const fallback: ZipCodeLocation = {
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

    const lat = parseFloat(place['latitude']);
    const lng = parseFloat(place['longitude']);

    // Validate that we got valid coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return fallback;
    }

    const result: ZipCodeLocation = {
      zipCode: cleanZip,
      city: place['place name'] ?? 'Unknown',
      stateCode: place['state abbreviation'] ?? 'US',
      latitude: lat,
      longitude: lng,
      isValid: true,
    };

    _cache.set(cleanZip, result);
    return result;
  } catch (error) {
    console.error('Error looking up zip code:', error);
    return fallback;
  }
}