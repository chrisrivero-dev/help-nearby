export interface NormalizedLocation {
  zipCode: string;
  city: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
}

export function normalizeLocation(zip: string): NormalizedLocation {
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5);

  // Minimal V1: basic validation + placeholder geo
  if (cleanZip.length !== 5) {
    return {
      zipCode: cleanZip,
      city: '',
      stateCode: '',
      latitude: 0,
      longitude: 0,
      isValid: false,
    };
  }

  // Temporary stub — we will replace with zipcodes-us later
  return {
    zipCode: cleanZip,
    city: 'Unknown',
    stateCode: 'US',
    latitude: 0,
    longitude: 0,
    isValid: true,
  };
}
