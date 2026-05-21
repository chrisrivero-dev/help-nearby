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

  // Normalize location - validates ZIP and gets coordinates
  const normalizeLocation = useCallback(async (zipCode: string) => {
    const cleanZip = zipCode.replace(/\D/g, '').slice(0, 5);

    const fallback = {
      zipCode: cleanZip,
      city: 'Unknown',
      stateCode: 'US',
      latitude: 0,
      longitude: 0,
      isValid: false,
    };

    if (cleanZip.length !== 5) return fallback;

    try {
      const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
      if (!res.ok) return fallback;

      const data = await res.json();
      const place = data?.places?.[0];
      if (!place) return fallback;

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
        return fallback;
      }

      return {
        zipCode: cleanZip,
        city: place['place name'] ?? 'Unknown',
        stateCode: place['state abbreviation'] ?? 'US',
        latitude: lat,
        longitude: lng,
        isValid: true,
      };
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
