'use client';

import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  List,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { useTheme } from './useTheme';
import { useRouter } from 'next/navigation';
import FeatureBar from './FeatureBar';
import { useLocationContext } from './help/LocationContext';
import { useProgressiveNearbyResources } from '@/lib/resources/useNearbyResources';
import type { NearbyResource, ResourceCategory } from '@/lib/resources/schema';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/resources/categories';

import { useMap, useMapEvents } from 'react-leaflet';

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

const DISCOVER_PAGE_SIZE = 25;

const formatDist = (mi?: number) => {
  if (typeof mi !== 'number') return '';
  return mi < 0.1
    ? '< 0.1 mi'
    : mi < 10
      ? `${mi.toFixed(1)} mi`
      : `${Math.round(mi)} mi`;
};

const formatAddress = (r: NearbyResource) => {
  const place = [r.city, r.state].filter(Boolean).join(', ');
  const zip = r.zip?.split('-')[0];
  return [r.address, [place, zip].filter(Boolean).join(' ') || undefined]
    .filter(Boolean)
    .join(', ');
};

const resourceMarkerKey = (resource: NearbyResource) =>
  resource.resource_key ?? `${resource.sourceName}:${resource.id}`;

const formatLocationDisplay = ({
  zip,
  city,
  state,
  isValid,
}: {
  zip: string;
  city: string;
  state: string;
  isValid: boolean;
}) => {
  const place = [city, state].filter(Boolean).join(', ');
  if (place && zip) return `${place} ${zip}`;
  if (place) return place;
  if (zip) return zip;
  return isValid ? 'Map-selected area' : '';
};

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
  const [page, setPage] = useState(1);
  const [listOpen, setListOpen] = useState(true);
  const [resourceQuery, setResourceQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<ResourceCategory[]>(
    [],
  );
  const [leafletModule, setLeafletModule] = useState<
    typeof import('leaflet') | null
  >(null);
  const lastCenteredLocation = useRef('');
  const resourceMarkerRefs = useRef<Map<string, import('leaflet').Marker>>(
    new Map(),
  );

  const hasMapCenter = isValid || hasInitialCenter;
  const activeLat = isValid ? latitude : centerLat;
  const activeLng = isValid ? longitude : centerLng;
  const nearby = useProgressiveNearbyResources({
    latitude,
    longitude,
    enabled: isValid,
  });
  const allResources = nearby.resources ?? [];
  const availableCategories = useMemo<ResourceCategory[]>(() => {
    const present = new Set(allResources.map((r) => r.category));
    return (Object.keys(CATEGORY_LABELS) as ResourceCategory[]).filter((c) =>
      present.has(c),
    );
  }, [allResources]);
  const filteredResources = useMemo(() => {
    const q = resourceQuery.trim().toLowerCase();
    return allResources.filter((r) => {
      if (activeCategories.length > 0 && !activeCategories.includes(r.category))
        return false;
      if (!q) return true;
      const haystack = [
        r.name,
        r.address,
        r.city,
        r.state,
        r.zip,
        r.phone,
        r.sourceName,
        r.customCategoryLabel,
        CATEGORY_LABELS[r.category],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategories, allResources, resourceQuery]);
  const filtersActive =
    resourceQuery.trim().length > 0 || activeCategories.length > 0;
  const totalPages =
    filteredResources.length === 0
      ? 0
      : Math.ceil(filteredResources.length / DISCOVER_PAGE_SIZE);
  const shownTotalPages = Math.max(totalPages, 1);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedResources = useMemo(() => {
    const offset = (page - 1) * DISCOVER_PAGE_SIZE;
    return filteredResources.slice(offset, offset + DISCOVER_PAGE_SIZE);
  }, [filteredResources, page]);
  const resourcesWithCoords = useMemo(
    () =>
      pagedResources.filter(
        (r) =>
          typeof r.latitude === 'number' &&
          typeof r.longitude === 'number' &&
          Number.isFinite(r.latitude) &&
          Number.isFinite(r.longitude),
      ),
    [pagedResources],
  );
  const readableLocationLabel = useMemo(
    () => formatLocationDisplay({ zip, city, state, isValid }),
    [city, isValid, state, zip],
  );
  const locationLabel = readableLocationLabel || 'Current location';

  // Load leaflet module on client side
  useEffect(() => {
    import('leaflet').then((mod) => {
      setLeafletModule(mod);
    });
  }, []);

  useEffect(() => {
    if (isResolvingLocation && !zip && !city && !state) {
      setLocationInput('Resolving map location...');
      return;
    }

    setLocationInput(readableLocationLabel);
  }, [
    city,
    isResolvingLocation,
    latitude,
    longitude,
    readableLocationLabel,
    state,
    zip,
  ]);

  useEffect(() => {
    setPage(1);
  }, [latitude, longitude]);

  useEffect(() => {
    setPage(1);
  }, [activeCategories, resourceQuery]);

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

  const resourceIconFor = (resource: NearbyResource) => {
    const color = CATEGORY_COLORS[resource.category];
    const customTriangle = encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,22 2,3 22,3" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/></svg>`,
    );
    return leafletModule?.divIcon({
      html: resource.isCustom
        ? `<img alt="" src="data:image/svg+xml,${customTriangle}" style="display:block;width:24px;height:24px;filter:drop-shadow(0 2px 7px rgba(0,0,0,0.35));" />`
        : `<div style="width: 18px; height: 18px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>`,
      iconSize: resource.isCustom ? [24, 24] : [22, 22],
      iconAnchor: resource.isCustom ? [12, 22] : [11, 11],
      popupAnchor: resource.isCustom ? [0, -24] : [0, -11],
      className: '',
    });
  };

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

  const topRightControlStyle: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: '4px',
    border: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#d8d8d8'}`,
    backgroundColor:
      theme === 'dark' ? 'rgba(0, 0, 0, 0.76)' : 'rgba(255, 255, 255, 0.86)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
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

  const toggleCategory = (category: ResourceCategory) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const focusResource = (resource: NearbyResource) => {
    if (
      typeof resource.latitude !== 'number' ||
      typeof resource.longitude !== 'number'
    ) {
      return;
    }
    mapInstance?.flyTo([resource.latitude, resource.longitude], 15, {
      animate: true,
      duration: 0.55,
    });

    const marker = resourceMarkerRefs.current.get(resourceMarkerKey(resource));
    window.setTimeout(() => {
      marker?.openPopup();
    }, 350);
  };

  const pagerButtonStyle = (disabled: boolean): React.CSSProperties => ({
    width: 30,
    height: 30,
    borderRadius: '4px',
    border: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#d8d8d8'}`,
    backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
    color: 'var(--color-text)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
  });

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
            alignItems: 'flex-start',
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
              position: 'relative',
              width: '260px',
            }}
          >
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
            {searchError && (
              <motion.div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  zIndex: 1002,
                  backgroundColor:
                    theme === 'dark'
                      ? 'rgba(0, 0, 0, 0.82)'
                      : 'rgba(255, 255, 255, 0.94)',
                  color: 'var(--color-text)',
                  padding: '0.55rem 0.7rem',
                  borderRadius: '6px',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.72rem',
                  lineHeight: 1.4,
                  textAlign: 'center',
                  border: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#e0e0e0'}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {searchError}
              </motion.div>
            )}
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
              const icon = resourceIconFor(resource);
              if (
                !icon ||
                resource.latitude === undefined ||
                resource.longitude === undefined
              )
                return null;
              const address = formatAddress(resource);
              const markerKey = resourceMarkerKey(resource);
              return (
                <Marker
                  key={markerKey}
                  position={[resource.latitude, resource.longitude]}
                  icon={icon}
                  opacity={nearby.isStaleWhileLoading ? 0.45 : 1}
                  ref={(marker) => {
                    if (marker) {
                      resourceMarkerRefs.current.set(markerKey, marker);
                    } else {
                      resourceMarkerRefs.current.delete(markerKey);
                    }
                  }}
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
                      {resource.phone && (
                        <div style={{ fontSize: 12, marginBottom: 4 }}>
                          {resource.phone}
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
        {nearby.isInitialLoading
          ? 'Loading nearest resources...'
          : nearby.isStaleWhileLoading
            ? 'Updating nearest resources...'
            : `${resourcesWithCoords.length} resources mapped`}
        {nearby.isExpanding && nearby.loadedRadiusMiles
          ? ` - expanding to ${nearby.targetRadiusMiles} mi`
          : ''}
        {nearby.degraded ? ' - last-known data' : ''}
      </motion.div>

      {/* Top-right map controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          aria-label={listOpen ? 'Close resource list' : 'Open resource list'}
          style={topRightControlStyle}
        >
          {listOpen ? <X size={17} /> : <List size={17} />}
        </button>
        <FeatureBar
          vertical
          bgColor="transparent"
          itemStyle={topRightControlStyle}
          gap="8px"
        />
      </div>

      <motion.aside
        initial={false}
        animate={{ x: listOpen ? 0 : 'calc(100% + 84px)' }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '84px',
          right: '64px',
          bottom: '76px',
          zIndex: 1000,
          width: 'min(360px, calc(100vw - 40px))',
          background:
            theme === 'dark'
              ? 'rgba(10, 10, 10, 0.88)'
              : 'rgba(255, 255, 255, 0.92)',
          color: 'var(--color-text)',
          border: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#e0e0e0'}`,
          boxShadow:
            theme === 'dark'
              ? '0 10px 28px rgba(0,0,0,0.48)'
              : '0 10px 28px rgba(0,0,0,0.16)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: listOpen ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            padding: '0.9rem 1rem',
            borderBottom: `1px solid ${theme === 'dark' ? '#242424' : '#e8e8e8'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 800,
                fontSize: '0.76rem',
                letterSpacing: '0.12em',
              }}
            >
              RESOURCES
            </div>
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.68rem',
                color: theme === 'dark' ? '#a3a3a3' : '#555',
                marginTop: '0.15rem',
              }}
            >
              Page {Math.min(page, shownTotalPages)} of {shownTotalPages}
              {filteredResources.length > 0
                ? ` · ${filteredResources.length} results`
                : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
            <button
              type="button"
              aria-label="Previous resources page"
              disabled={!hasPreviousPage || nearby.isInitialLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={pagerButtonStyle(
                !hasPreviousPage || nearby.isInitialLoading,
              )}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              aria-label="Next resources page"
              disabled={!hasNextPage || nearby.isInitialLoading}
              onClick={() => setPage((p) => p + 1)}
              style={pagerButtonStyle(!hasNextPage || nearby.isInitialLoading)}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '0.8rem 1rem',
            borderBottom: `1px solid ${theme === 'dark' ? '#242424' : '#e8e8e8'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: `1px solid ${theme === 'dark' ? '#252525' : '#e4e4e4'}`,
              background: theme === 'dark' ? '#0a0a0a' : '#fafafa',
              padding: '0.4rem 0.6rem',
            }}
          >
            <Search size={13} color={theme === 'dark' ? '#a3a3a3' : '#555'} />
            <input
              type="text"
              value={resourceQuery}
              onChange={(e) => setResourceQuery(e.target.value)}
              placeholder="Filter by name, street, ZIP, or source…"
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.7rem',
                color: 'var(--color-text)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
              }}
            />
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setResourceQuery('');
                  setActiveCategories([]);
                }}
                aria-label="Clear resource filters"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme === 'dark' ? '#a3a3a3' : '#555',
                  lineHeight: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {availableCategories.length > 1 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
              }}
            >
              {availableCategories.map((category) => {
                const active = activeCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-pressed={active}
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '0.22rem 0.55rem',
                      cursor: 'pointer',
                      border: `1px solid ${
                        active
                          ? '#fbbf24'
                          : theme === 'dark'
                            ? '#2a2a2a'
                            : '#e0e0e0'
                      }`,
                      background: active ? '#fbbf24' : 'transparent',
                      color: active
                        ? '#000'
                        : theme === 'dark'
                          ? '#a3a3a3'
                          : '#555',
                    }}
                  >
                    {CATEGORY_LABELS[category]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {nearby.isInitialLoading ? (
            <div
              style={{
                padding: '1.2rem 1rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.78rem',
                color: theme === 'dark' ? '#a3a3a3' : '#555',
              }}
            >
              Loading nearest resources...
            </div>
          ) : pagedResources.length === 0 ? (
            <div
              style={{
                padding: '1.2rem 1rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.78rem',
                color: theme === 'dark' ? '#a3a3a3' : '#555',
                lineHeight: 1.5,
              }}
            >
              {nearby.isExpanding
                ? 'Expanding the search area...'
                : 'No resources found for this page.'}
            </div>
          ) : (
            <>
              {nearby.isExpanding && (
                <div
                  style={{
                    padding: '0.5rem 1rem',
                    borderBottom: `1px solid ${theme === 'dark' ? '#242424' : '#ededed'}`,
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: theme === 'dark' ? '#fbbf24' : '#92400e',
                    background:
                      theme === 'dark'
                        ? 'rgba(120, 53, 15, 0.22)'
                        : 'rgba(255, 247, 237, 0.88)',
                  }}
                >
                  {nearby.isStaleWhileLoading
                    ? 'UPDATING NEAREST RESOURCES'
                    : 'EXPANDING SEARCH AREA'}
                  {!nearby.isStaleWhileLoading && nearby.loadedRadiusMiles
                    ? ` - ${nearby.loadedRadiusMiles} MI LOADED`
                    : ''}
                </div>
              )}
              {pagedResources.map((resource, index, arr) => {
                const address = formatAddress(resource);
                const hasCoords =
                  typeof resource.latitude === 'number' &&
                  typeof resource.longitude === 'number';
                return (
                  <button
                    key={`${resourceMarkerKey(resource)}:${index}`}
                    type="button"
                    onClick={() => focusResource(resource)}
                    disabled={!hasCoords}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.85rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      borderBottom:
                        index === arr.length - 1
                          ? 'none'
                          : `1px solid ${theme === 'dark' ? '#242424' : '#ededed'}`,
                      color: 'var(--color-text)',
                      cursor: hasCoords ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                    }}
                  >
                    <MapPin
                      size={15}
                      color={CATEGORY_COLORS[resource.category]}
                      style={{ flexShrink: 0, marginTop: 2 }}
                    />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          display: 'block',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          lineHeight: 1.35,
                        }}
                      >
                        {resource.name}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '0.66rem',
                          color: theme === 'dark' ? '#a3a3a3' : '#555',
                          marginTop: '0.16rem',
                          lineHeight: 1.45,
                        }}
                      >
                        {CATEGORY_LABELS[resource.category]}
                        {resource.distanceMiles !== undefined
                          ? ` · ${formatDist(resource.distanceMiles)}`
                          : ''}
                      </span>
                      {address && (
                        <span
                          style={{
                            display: 'block',
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.66rem',
                            color: theme === 'dark' ? '#c7c7c7' : '#333',
                            marginTop: '0.18rem',
                            lineHeight: 1.45,
                          }}
                        >
                          {address}
                        </span>
                      )}
                      {resource.phone && (
                        <span
                          style={{
                            display: 'block',
                            fontFamily: "'Poppins', sans-serif",
                            fontSize: '0.66rem',
                            color: theme === 'dark' ? '#c7c7c7' : '#333',
                            marginTop: '0.18rem',
                            lineHeight: 1.45,
                          }}
                        >
                          {resource.phone}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </motion.aside>

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
