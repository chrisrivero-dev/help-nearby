'use client';

import type { FC, ReactNode } from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

export interface LocationState {
  zip: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isValid: boolean;
}

interface LocationContextValue extends LocationState {
  setLocation: (zip: string) => void;
  clearLocation: () => void;
  locationError: string | null;
  setLocationError: (error: string | null) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined,
);

export const useLocationContext = () => {
  const ctx = useContext(LocationContext);
  if (!ctx)
    throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
};

// Non-throwing variant for components (e.g. the Clock) that may render outside
// a LocationProvider. Returns undefined when no provider is present.
export const useOptionalLocationContext = () => useContext(LocationContext);

interface LocationProviderProps {
  children: ReactNode;
  defaultZip?: string;
}

export const LocationProvider: FC<LocationProviderProps> = ({
  children,
  defaultZip = '',
}) => {
  const [zip, setZipState] = useState(defaultZip);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Normalize location - accepts a ZIP code or a "City, ST" query and
  // resolves it to coordinates.
  const normalizeLocation = useCallback(async (query: string) => {
    const raw = query.trim();

    const fallback = {
      zipCode: '',
      city: 'Unknown',
      stateCode: 'US',
      latitude: 0,
      longitude: 0,
      isValid: false,
    };

    const buildResult = (place: Record<string, string> | undefined) => {
      if (!place) return null;

      const lat = parseFloat(place['latitude']);
      const lng = parseFloat(place['longitude']);

      if (
        isNaN(lat) ||
        isNaN(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return null;
      }

      return {
        zipCode: place['post code'] ?? '',
        city: place['place name'] ?? 'Unknown',
        stateCode: place['state abbreviation'] ?? 'US',
        latitude: lat,
        longitude: lng,
        isValid: true,
      };
    };

    try {
      // City search: anything containing letters, e.g. "Brooklyn, NY".
      if (/[a-zA-Z]/.test(raw)) {
        const parts = raw.split(',').map((p) => p.trim());
        let cityName = parts[0];
        let stateCode = parts[1];

        // Support "City ST" without a comma by peeling off a trailing
        // two-letter state token.
        if (!stateCode) {
          const tokens = cityName.split(/\s+/);
          const last = tokens[tokens.length - 1];
          if (tokens.length > 1 && /^[a-zA-Z]{2}$/.test(last)) {
            stateCode = last;
            cityName = tokens.slice(0, -1).join(' ');
          }
        }

        if (!cityName || !stateCode || !/^[a-zA-Z]{2}$/.test(stateCode)) {
          return fallback;
        }

        const res = await fetch(
          `https://api.zippopotam.us/us/${stateCode.toLowerCase()}/${encodeURIComponent(
            cityName.toLowerCase(),
          )}`,
        );
        if (!res.ok) return fallback;

        const data = await res.json();
        return buildResult(data?.places?.[0]) ?? fallback;
      }

      // ZIP search.
      const cleanZip = raw.replace(/\D/g, '').slice(0, 5);
      if (cleanZip.length !== 5) return fallback;

      const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
      if (!res.ok) return fallback;

      const data = await res.json();
      const place = data?.places?.[0];
      // The ZIP endpoint omits "post code" on each place, so backfill it.
      return buildResult(place ? { ...place, 'post code': cleanZip } : undefined) ?? fallback;
    } catch (error) {
      console.error('Error normalizing location:', error);
      return fallback;
    }
  }, []);

  // Update location when zip changes
  useEffect(() => {
    if (!zip) {
      setCity('');
      setState('');
      setLatitude(0);
      setLongitude(0);
      setIsValid(false);
      return;
    }

    normalizeLocation(zip).then((result) => {
      setZipState(result.zipCode);
      setCity(result.city);
      setState(result.stateCode);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setIsValid(result.isValid);
    });
  }, [zip, normalizeLocation]);

  const setLocation = useCallback((newZip: string) => {
    setZipState(newZip);
  }, []);

  const clearLocation = useCallback(() => {
    setZipState('');
    setCity('');
    setState('');
    setLatitude(0);
    setLongitude(0);
    setIsValid(false);
    setLocationError(null);
  }, []);

  const value: LocationContextValue = {
    zip,
    city,
    state,
    latitude,
    longitude,
    isValid,
    setLocation,
    clearLocation,
    locationError,
    setLocationError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
