'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Search } from 'lucide-react';
import { useTheme } from './useTheme';
import { useRouter } from 'next/navigation';
import FeatureBar from './FeatureBar';
import { useLocationContext } from './help/LocationContext';
import { useNearbyResources } from '@/lib/resources/useNearbyResources';
import type { NearbyResource, ResourceCategory } from '@/lib/resources/schema';

import { useMap } from 'react-leaflet';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface DiscoverProps {
  centerLat: number;
  centerLng: number;
  hasInitialCenter?: boolean;
}

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  health: 'Health',
  social_services: 'Social Services',
  library: 'Library',
  government: 'Government',
  cooling: 'Cooling',
  shelter: 'Shelter',
  food: 'Food',
  recreation: 'Recreation',
  other: 'Other',
};

const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  health: '#ef4444',
  social_services: '#f59e0b',
  library: '#8b5cf6',
  government: '#64748b',
  cooling: '#06b6d4',
  shelter: '#0ea5e9',
  food: '#22c55e',
  recreation: '#84cc16',
  other: '#f97316',
};

const formatDist = (mi?: number) => {
  if (typeof mi !== 'number') return '';
  return mi < 0.1
    ? '< 0.1 mi'
    : mi < 10
      ? `${mi.toFixed(1)} mi`
      : `${Math.round(mi)} mi`;
};

const formatAddress = (r: NearbyResource) =>
  [r.address, r.city, r.state].filter(Boolean).join(', ');

const MapInstanceSetter: FC<{
  onMapReady: (map: import('leaflet').Map) => void;
}> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const Discover: FC<DiscoverProps> = ({
  centerLat,
  centerLng,
  hasInitialCenter = false,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    zip,
    city,
    state,
    latitude,
    longitude,
    isValid,
    setLocation,
    locationError,
    isResolvingLocation,
  } = useLocationContext();
  const [locationInput, setLocationInput] = useState(zip);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(
    null,
  );
  const [leafletModule, setLeafletModule] = useState<
    typeof import('leaflet') | null
  >(null);
  const lastCenteredLocation = useRef('');

  const hasMapCenter = isValid || hasInitialCenter;
  const activeLat = isValid ? latitude : centerLat;
  const activeLng = isValid ? longitude : centerLng;
  const nearby = useNearbyResources({
    latitude,
    longitude,
    enabled: isValid,
  });
  const resourcesWithCoords = useMemo(
    () =>
      (nearby.resources ?? []).filter(
        (r) =>
          typeof r.latitude === 'number' &&
          typeof r.longitude === 'number' &&
          Number.isFinite(r.latitude) &&
          Number.isFinite(r.longitude),
      ),
    [nearby.resources],
  );
  const locationLabel =
    isValid && (city || state)
      ? [city, state].filter(Boolean).join(', ')
      : zip || 'Current location';

  // Load leaflet module on client side
  useEffect(() => {
    import('leaflet').then((mod) => {
      setLeafletModule(mod);
    });
  }, []);

  useEffect(() => {
    setLocationInput(zip);
  }, [zip]);

  useEffect(() => {
    if (locationError) {
      setSearchError(locationError);
    } else {
      setSearchError(null);
    }
  }, [locationError]);

  useEffect(() => {
    if (
      !mapInstance ||
      !Number.isFinite(activeLat) ||
      !Number.isFinite(activeLng)
    )
      return;
    const key = `${activeLat.toFixed(5)},${activeLng.toFixed(5)}`;
    if (lastCenteredLocation.current === key) return;
    lastCenteredLocation.current = key;
    mapInstance.flyTo([activeLat, activeLng], 13, {
      animate: true,
      duration: 0.8,
    });
  }, [activeLat, activeLng, mapInstance]);

  const activeLocationIcon = useMemo(
    () =>
      leafletModule?.divIcon({
        html: '<div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 24px solid var(--color-text); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        className: '',
      }),
    [leafletModule],
  );

  const resourceIconFor = (category: ResourceCategory) =>
    leafletModule?.divIcon({
      html: `<div style="width: 18px; height: 18px; border-radius: 50%; background: ${CATEGORY_COLORS[category]}; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      className: '',
    });

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '4px',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  };

  const zoomButtonStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  };

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        setSearchError(null);
      },
      () => {
        setSearchError('Could not access your current location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSearch = () => {
    const value = locationInput.trim();
    if (!value) {
      setSearchError('Enter a ZIP code, city and state, or coordinates.');
      return;
    }
    setSearchError(null);
    setLocation(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Center container for back button, search bar, and feature bar */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '12px',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Back button */}
          <button
            onClick={() => router.push('/help')}
            style={{
              ...buttonStyle,
              padding: '4px 8px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px',
              borderRadius: '6px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              backgroundColor:
                theme === 'dark'
                  ? 'rgba(0, 0, 0, 0.3)'
                  : 'rgba(255, 255, 255, 0.5)',
              width: '260px',
            }}
          >
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search for a Location"
              disabled={isResolvingLocation}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '4px',
                border: 'none',
                fontSize: '14px',
                outline: 'none',
                backgroundColor:
                  theme === 'dark'
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(255, 255, 255, 0.5)',
                color: 'var(--color-text)',
                textAlign: 'center',
              }}
            />
            <button
              onClick={handleLocate}
              disabled={isResolvingLocation}
              style={{
                ...buttonStyle,
                padding: '4px 8px',
                width: 'auto',
              }}
              title="Use my location"
            >
              <Crosshair size={14} fill="none" />
            </button>
            <button
              onClick={handleSearch}
              disabled={isResolvingLocation}
              style={{
                ...buttonStyle,
                padding: '4px 8px',
                width: 'auto',
              }}
              title="Search"
            >
              <Search size={14} fill="none" />
            </button>
          </div>

          {/* Feature Bar */}
          <div>
            <FeatureBar bgColor="var(--color-bg)" />
          </div>
        </div>
      </motion.div>

      {/* Full-page map */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#0f0f0f',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] }}
      >
        {hasMapCenter ? (
          <MapContainer
            center={[activeLat, activeLng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <MapInstanceSetter onMapReady={setMapInstance} />
            <TileLayer
              url={
                theme === 'dark'
                  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
              }
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
              noWrap={true}
            />
            {isValid && activeLocationIcon && (
              <Marker
                position={[latitude, longitude]}
                icon={activeLocationIcon}
              >
                <Popup>{locationLabel}</Popup>
              </Marker>
            )}
            {resourcesWithCoords.map((resource, index) => {
              const icon = resourceIconFor(resource.category);
              if (
                !icon ||
                resource.latitude === undefined ||
                resource.longitude === undefined
              )
                return null;
              const address = formatAddress(resource);
              return (
                <Marker
                  key={`${resource.sourceName}:${resource.id}:${index}`}
                  position={[resource.latitude, resource.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: 190,
                        maxWidth: 260,
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>
                        {resource.name}
                      </div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>
                        {CATEGORY_LABELS[resource.category]}
                        {resource.distanceMiles !== undefined
                          ? ` - ${formatDist(resource.distanceMiles)}`
                          : ''}
                      </div>
                      {address && (
                        <div style={{ fontSize: 12, marginBottom: 4 }}>
                          {address}
                        </div>
                      )}
                      <div
                        style={{ fontSize: 11, color: '#666', marginBottom: 6 }}
                      >
                        Source: {resource.sourceName}
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${resource.latitude},${resource.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, fontWeight: 700 }}
                      >
                        Directions
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        ) : (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text)',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            Loading location...
          </div>
        )}
      </motion.div>

      {/* Resource status */}
      <motion.div
        style={{
          position: 'absolute',
          left: '20px',
          bottom: '20px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 10px',
          borderRadius: '6px',
          backgroundColor:
            theme === 'dark'
              ? 'rgba(0, 0, 0, 0.72)'
              : 'rgba(255, 255, 255, 0.78)',
          color: 'var(--color-text)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
          fontFamily: "'Poppins', sans-serif",
          fontSize: '12px',
          fontWeight: 700,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {nearby.isLoading || nearby.isFetching
          ? 'Loading resources...'
          : `${resourcesWithCoords.length} resources mapped`}
        {nearby.degraded ? ' - last-known data' : ''}
      </motion.div>

      {/* Search error banner */}
      {searchError && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '400px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {searchError}
        </motion.div>
      )}

      {/* Zoom controls - Bottom Right */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          padding: '8px',
        }}
      >
        <button onClick={() => mapInstance?.zoomIn()} style={zoomButtonStyle}>
          +
        </button>
        <button onClick={() => mapInstance?.zoomOut()} style={zoomButtonStyle}>
          -
        </button>
      </div>
    </div>
  );
};

export default Discover;
