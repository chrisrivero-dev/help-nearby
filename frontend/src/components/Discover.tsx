'use client';

import { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Search } from 'lucide-react';
import { useTheme } from './useTheme';
import { useRouter } from 'next/navigation';
import Clock from './Clock';
import { lookupLocation, ZipCodeLocation } from '@/lib/location/locationLookup';

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
}

const MapInstanceSetter: FC<{
  onMapReady: (map: import('leaflet').Map) => void;
}> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  return null;
};

const Discover: FC<DiscoverProps> = ({ centerLat, centerLng }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const [zip, setZip] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(
    null,
  );
  const [zoomTarget, setZoomTargetState] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  const [leafletModule, setLeafletModule] = useState<
    typeof import('leaflet') | null
  >(null);

  // Load leaflet module on client side
  useEffect(() => {
    import('leaflet').then((mod) => {
      setLeafletModule(mod);
    });
  }, []);

  // Watch for zoom target changes and apply to map
  useEffect(() => {
    if (zoomTarget && mapInstance) {
      mapInstance.setView([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom, {
        animate: false,
      });
    }
  }, [zoomTarget, mapInstance]);

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
    width: '36px',
    height: '36px',
    borderRadius: '4px',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: '600',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  };

  const inputStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '18px',
    width: '250px',
    outline: 'none',
    backgroundColor:
      theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
    color: 'var(--color-text)',
    textAlign: 'center',
  };

  const handleLocate = () => {
    if (!mapInstance) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setZoomTargetState({ lat: latitude, lng: longitude, zoom: 13 });
        setSearchLocation({ lat: latitude, lng: longitude });
      },
      () => {
        console.warn('Geolocation error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleSearch = async () => {
    setSearchError(null);
    setIsSearching(true);
    try {
      const result: ZipCodeLocation = await lookupLocation(zip);
      if (result.isValid) {
        setZoomTargetState({
          lat: result.latitude,
          lng: result.longitude,
          zoom: 13,
        });
        setSearchLocation({ lat: result.latitude, lng: result.longitude });
        setSearchError(null);
      } else {
        setSearchError('Location not found. Please check your input.');
      }
    } catch (error) {
      console.error('Error looking up location:', error);
      setSearchError('Failed to lookup location. Please try again later.');
    } finally {
      setIsSearching(false);
    }
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
      {/* Top bar — flexbox with back left, search centered, zoom right */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 0 20px',
          zIndex: 1000,
          backgroundColor: 'transparent',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Left: Back button */}
        <div
          style={{
            width: '90px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
        >
          <button onClick={() => router.push('/')} style={buttonStyle}>
            <svg
              width="20"
              height="20"
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
            Back
          </button>
        </div>

        {/* Center: Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            backgroundColor:
              theme === 'dark'
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.3)',
            alignSelf: 'flex-start',
            marginTop: '10px',
          }}
        >
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for a Location"
            disabled={isSearching}
            style={inputStyle}
          />
          <button
            onClick={handleLocate}
            disabled={isSearching}
            style={buttonStyle}
            title="Use my location"
          >
            <Crosshair size={20} fill="none" />
          </button>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={buttonStyle}
            title="Search"
          >
            <Search size={20} fill="none" />
          </button>
        </div>

        {/* Right: Zoom controls */}
        <div
          style={{
            width: '90px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
            alignSelf: 'flex-start',
            marginTop: '10px',
          }}
        >
          <button onClick={() => mapInstance?.zoomIn()} style={zoomButtonStyle}>
            +
          </button>
          <button
            onClick={() => mapInstance?.zoomOut()}
            style={zoomButtonStyle}
          >
            -
          </button>
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
        <MapContainer
          center={[centerLat, centerLng]}
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
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {searchLocation && (
            <Marker
              position={[searchLocation.lat, searchLocation.lng]}
              icon={leafletModule?.divIcon({
                html: '<div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 24px solid var(--color-text);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 24],
                className: '',
              })}
            >
              <Popup>{zip || 'Searched Location'}</Popup>
            </Marker>
          )}
        </MapContainer>
      </motion.div>

      {/* Clock — bottom right, above the map, below top bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '50px',
          right: '50px',
          zIndex: 1000,
          marginTop: '64px',
        }}
      >
        <Clock />
      </div>

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
    </div>
  );
};

export default Discover;
