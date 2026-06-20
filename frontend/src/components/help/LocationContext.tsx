'use client';

import type { FC, ReactNode } from 'react';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  isResolvingLocation: boolean;
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

const US_STATE_ABBREVIATIONS: Record<string, string> = {
  California: 'CA',
  'New York': 'NY',
  Texas: 'TX',
  Florida: 'FL',
  Illinois: 'IL',
  Pennsylvania: 'PA',
  Ohio: 'OH',
  Georgia: 'GA',
  'North Carolina': 'NC',
  Michigan: 'MI',
  'New Jersey': 'NJ',
  Virginia: 'VA',
  Washington: 'WA',
  Arizona: 'AZ',
  Massachusetts: 'MA',
  Tennessee: 'TN',
  Indiana: 'IN',
  Missouri: 'MO',
  Maryland: 'MD',
  Wisconsin: 'WI',
  Colorado: 'CO',
  Minnesota: 'MN',
  'South Carolina': 'SC',
  Alabama: 'AL',
  Louisiana: 'LA',
  Kentucky: 'KY',
  Oregon: 'OR',
  Oklahoma: 'OK',
  Connecticut: 'CT',
  Utah: 'UT',
  Iowa: 'IA',
  Nevada: 'NV',
  Arkansas: 'AR',
  Mississippi: 'MS',
  Kansas: 'KS',
  'New Mexico': 'NM',
  Nebraska: 'NE',
  Idaho: 'ID',
  'West Virginia': 'WV',
  Hawaii: 'HI',
  'New Hampshire': 'NH',
  Maine: 'ME',
  Montana: 'MT',
  'Rhode Island': 'RI',
  Delaware: 'DE',
  'South Dakota': 'SD',
  'North Dakota': 'ND',
  Alaska: 'AK',
  Vermont: 'VT',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
};

const toStateCode = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^[a-zA-Z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return US_STATE_ABBREVIATIONS[trimmed] ?? trimmed;
};

const COORDINATE_QUERY_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

const parseCoordinateQuery = (query: string) => {
  const match = query.match(COORDINATE_QUERY_RE);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
};

const reverseGeocodeCoordinates = async (lat: number, lng: number) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=10`,
  );
  if (!res.ok) return null;

  const data = await res.json();
  const address = data?.address ?? {};
  const resolvedCity =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.municipality ||
    address.county ||
    '';
  const resolvedState = toStateCode(address.state);

  if (!resolvedCity && !resolvedState && !address.postcode) return null;

  return {
    zipCode: address.postcode ?? '',
    city: resolvedCity,
    stateCode: resolvedState,
  };
};

export const LocationProvider: FC<LocationProviderProps> = ({
  children,
  defaultZip = '',
}) => {
  const [locationQuery, setLocationQuery] = useState(defaultZip);
  const [zip, setZipState] = useState(defaultZip);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const requestSeq = useRef(0);

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
        stateCode: toStateCode(place['state abbreviation']),
        latitude: lat,
        longitude: lng,
        isValid: true,
      };
    };

    try {
      const coords = parseCoordinateQuery(raw);
      if (coords) {
        try {
          const resolved = await reverseGeocodeCoordinates(
            coords.lat,
            coords.lng,
          );

          return {
            zipCode: resolved?.zipCode ?? '',
            city: resolved?.city || 'Map-selected area',
            stateCode: resolved?.stateCode ?? '',
            latitude: coords.lat,
            longitude: coords.lng,
            isValid: true,
          };
        } catch {
          return {
            zipCode: '',
            city: 'Map-selected area',
            stateCode: '',
            latitude: coords.lat,
            longitude: coords.lng,
            isValid: true,
          };
        }
      }

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
      return (
        buildResult(place ? { ...place, 'post code': cleanZip } : undefined) ??
        fallback
      );
    } catch (error) {
      console.error('Error normalizing location:', error);
      return fallback;
    }
  }, []);

  // Update location when zip changes
  useEffect(() => {
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;

    if (!locationQuery) {
      setZipState('');
      setCity('');
      setState('');
      setLatitude(0);
      setLongitude(0);
      setIsValid(false);
      setIsResolvingLocation(false);
      setLocationError(null);
      return;
    }

    setIsResolvingLocation(true);
    setLocationError(null);

    const coords = parseCoordinateQuery(locationQuery);
    if (coords) {
      setZipState('');
      setCity('');
      setState('');
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      setIsValid(true);

      reverseGeocodeCoordinates(coords.lat, coords.lng)
        .then((resolved) => {
          if (requestSeq.current !== seq) return;
          setZipState(resolved?.zipCode ?? '');
          setCity(resolved?.city || 'Map-selected area');
          setState(resolved?.stateCode ?? '');
          setIsResolvingLocation(false);
          setLocationError(null);
        })
        .catch(() => {
          if (requestSeq.current !== seq) return;
          setZipState('');
          setCity('Map-selected area');
          setState('');
          setIsResolvingLocation(false);
          setLocationError(null);
        });
      return;
    }

    normalizeLocation(locationQuery)
      .then((result) => {
        if (requestSeq.current !== seq) return;
        setZipState(result.zipCode);
        setCity(result.city);
        setState(result.stateCode);
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        setIsValid(result.isValid);
        setIsResolvingLocation(false);
        setLocationError(
          result.isValid
            ? null
            : 'Location not found. Please check your input.',
        );
      })
      .catch(() => {
        if (requestSeq.current !== seq) return;
        setZipState('');
        setCity('Unknown');
        setState('');
        setLatitude(0);
        setLongitude(0);
        setIsValid(false);
        setIsResolvingLocation(false);
        setLocationError('Failed to lookup location. Please try again later.');
      });
  }, [locationQuery, normalizeLocation]);

  const setLocation = useCallback((newZip: string) => {
    setLocationQuery(newZip.trim());
  }, []);

  const clearLocation = useCallback(() => {
    setLocationQuery('');
    setZipState('');
    setCity('');
    setState('');
    setLatitude(0);
    setLongitude(0);
    setIsValid(false);
    setIsResolvingLocation(false);
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
    isResolvingLocation,
    setLocationError,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
