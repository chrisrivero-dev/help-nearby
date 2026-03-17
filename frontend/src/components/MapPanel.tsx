'use client';

import { FC, useEffect, useState, useRef, createContext, useContext, ReactNode, useCallback } from 'react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';
import { Crosshair, Search } from 'lucide-react';
import { useTheme } from './useTheme';
import dynamic from 'next/dynamic';
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
import { lookupLocation, ZipCodeLocation } from '@/lib/location/locationLookup';

// Type for the map context value
interface MapContextValue {
  setZoomTarget: (lat: number, lng: number, zoom?: number) => void;
  mapInstance: import('leaflet').Map | null;
  setMapInstance: (map: import('leaflet').Map | null) => void;
}

// Create the context
const MapContext = createContext<MapContextValue | undefined>(undefined);

// Context Provider Component
const MapProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null);
  const [zoomTarget, setZoomTargetState] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const setMapInstanceRef = useCallback((map: import('leaflet').Map | null) => {
    setMapInstance(map);
  }, []);

  const setZoomTarget = useCallback((lat: number, lng: number, zoom: number = 12) => {
    setZoomTargetState({ lat, lng, zoom });
  }, []);

  // Watch for zoom target changes and apply to map
  useEffect(() => {
    if (zoomTarget && mapInstance) {
      mapInstance.setView([zoomTarget.lat, zoomTarget.lng], zoomTarget.zoom, { animate: false });
    }
  }, [zoomTarget, mapInstance]);

  // Clear zoom target after flyTo completes (using timeout as a simple approach)
  useEffect(() => {
    if (!zoomTarget && mapInstance) {
      // Zoom target was just completed, clear it
      const timer = setTimeout(() => {
        setZoomTargetState(null);
      }, 500); // Wait for fly animation to complete
      return () => clearTimeout(timer);
    }
  }, [zoomTarget, mapInstance]);

  return (
    <MapContext.Provider value={{ setZoomTarget, mapInstance, setMapInstance: setMapInstanceRef }}>
      {children}
    </MapContext.Provider>
  );
};

// Custom hook to use the map context
const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};

// Context consumer component to set map instance in provider
const MapInstanceSetter: FC<{ onMapReady: (map: import('leaflet').Map) => void }> = ({ onMapReady }) => {
  const map = useMap();
  const { setMapInstance } = useMapContext();
  useEffect(() => {
    if (map) {
      setMapInstance(map);
      onMapReady(map);
    }
  }, [map, setMapInstance, onMapReady]);
  return null;
};

const useMapStyles = () => {
  return {
    mapContainerStyle: {
      backgroundColor: '#0f0f0f',
      width: 'calc(100vw - 200px)',
      maxWidth: '1600px',
      height: 'calc(100vw - 200px) * 9 / 21',
      aspectRatio: '21/9',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
      zIndex: 0,
      padding: '0',
      position: 'fixed',
      top: '150px',
      left: '100px',
      right: '100px',
      margin: '0 auto',
      color: '#e8e8e8',
    } as React.CSSProperties,
    buttonStyle: {
      padding: '8px 16px',
      borderRadius: '4px',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      outline: 'none',
    } as React.CSSProperties,
        zipSearchAbovePanelStyle: {
          position: 'fixed',
          left: 'calc(50vw - 200px)',
          top: '160px',
          width: '400px',
          backgroundColor: 'transparent',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-text)',
        } as React.CSSProperties,
    errorBannerStyle: {
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)',
      padding: '12px 16px',
      borderRadius: '6px',
      fontSize: '16px',
      textAlign: 'center',
      maxWidth: '400px',
      border: '1px solid var(--color-border)',
      position: 'fixed',
      left: 'calc(50vw - 200px)',
      top: '300px',
      zIndex: 101,
    } as React.CSSProperties,
  };
};

// Internal component that consumes the map context
const MapContent: FC<{ 
  zip: string;
  setZip: (zip: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  mapLoaded: boolean;
  setMapLoaded: (mapLoaded: boolean) => void;
  mapInstanceRef: React.RefObject<import('leaflet').Map | null>;
}> = ({ zip, setZip, isSearching, setIsSearching, mapLoaded, setMapLoaded, mapInstanceRef }) => {
  const { setZoomTarget, mapInstance } = useMapContext();
  const { theme } = useTheme();
  const { mapContainerStyle, buttonStyle, zipSearchAbovePanelStyle, errorBannerStyle } = useMapStyles();
  const adjustedMapContainerStyle = {
    ...mapContainerStyle,
    boxShadow: theme === 'dark' ? '0 10px 30px rgba(0,0,0,1)' : mapContainerStyle.boxShadow,
    backgroundColor: theme === 'dark' ? 'rgba(0,0,0,1)' : mapContainerStyle.backgroundColor,
  };
  const inputStyle = {
    padding: '12px 16px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '18px',
    width: '250px',
    outline: 'none',
    backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
    color: 'var(--color-text)',
    textAlign: 'center',
  } as React.CSSProperties;
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout | null>(null);
  const [pendingZoomTarget, setPendingZoomTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResultMessage, setSearchResultMessage] = useState<string | null>(null);
  const [leafletModule, setLeafletModule] = useState<typeof import('leaflet') | null>(null);

  // Load leaflet module on client side
  useEffect(() => {
    import('leaflet').then((mod) => {
      setLeafletModule(mod);
    });
  }, []);

  // Update map instance ref when context provides one
  useEffect(() => {
    if (mapInstanceRef.current) {
      setMapLoaded(true);
    }
  }, [mapInstanceRef, setMapLoaded]);

  // Handle pending zoom target when map becomes available
  useEffect(() => {
      if (pendingZoomTarget && mapInstance) {
        mapInstance.setView([pendingZoomTarget.lat, pendingZoomTarget.lng], pendingZoomTarget.zoom, { animate: false });
        setPendingZoomTarget(null);
      }
  }, [pendingZoomTarget, mapInstance]);

  // Auto-dismiss error banner after 3 seconds
  useEffect(() => {
    if (searchError && !autoDismissTimer) {
      const timer = setTimeout(() => {
        setSearchError(null);
        setAutoDismissTimer(null);
      }, 3000);
      setAutoDismissTimer(timer);
    }
    return () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
        setAutoDismissTimer(null);
      }
    };
  }, [searchError, autoDismissTimer, setSearchError]);

  // Trigger browser geolocation to get current location
  const handleLocate = () => {
    if (!mapInstance) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        mapInstance.setView([latitude, longitude], 13, { animate: false });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearch = async () => {
    setSearchError(null);
    setIsSearching(true);
    try {
      const result: ZipCodeLocation = await lookupLocation(zip);
        if (result.isValid) {
          if (mapInstance) {
            setZoomTarget(result.latitude, result.longitude, 13);
          } else {
            setPendingZoomTarget({ lat: result.latitude, lng: result.longitude, zoom: 13 });
          }
          setSearchLocation({ lat: result.latitude, lng: result.longitude });
          setSearchError(null);
        } else {
        setSearchError('Location not found. Please check your input and try again.');
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
    <>
        <motion.div
          style={adjustedMapContainerStyle}
        initial={{ opacity: 1, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
<MapContainer 
  center={[40.7506, -73.9972]} 
  zoom={13} 
  style={{ height: '100%', width: '100%' }}
  className="leaflet-map"
  attributionControl={false}
>
  <MapInstanceSetter onMapReady={(map) => {
    mapInstanceRef.current = map;
    setMapLoaded(true);
  }} />
          <TileLayer
            url={theme === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>
          )}
          {searchLocation && (
            <Marker position={[searchLocation.lat, searchLocation.lng]} icon={leafletModule?.divIcon({
              html: '<div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 24px solid var(--color-text);"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 24],
              className: "",
            })} />
          )}
        </MapContainer>
      </motion.div>
      {/* Error banner above ZIP input */}
      {searchError && (
        <motion.div
          style={{ ...errorBannerStyle, cursor: 'pointer' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.5, ease: 'easeOut' } }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            setSearchError(null);
            if (autoDismissTimer) {
              clearTimeout(autoDismissTimer);
              setAutoDismissTimer(null);
            }
          }}
        >
          {searchError}
        </motion.div>
      )}
      {/* Zip search input floating above the map panel */}
      <motion.div
        style={zipSearchAbovePanelStyle}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, ease: 'easeOut' }}
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
        <style jsx>{`input::placeholder { color: var(--color-text); }`}</style>
        <button onClick={handleLocate} disabled={isSearching} style={buttonStyle}>
          <Crosshair size={20} fill="none" />
        </button>
        <button onClick={handleSearch} disabled={isSearching} style={{ ...buttonStyle, marginLeft: '8px' }}>
          <Search size={20} fill="none" />
        </button>
      </motion.div>
    </>
  );
};

// Use the dynamic components directly
const MapPanel: FC = () => {
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const [zip, setZip] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  return (
    <MapProvider>
      <MapContent
        zip={zip}
        setZip={setZip}
        isSearching={isSearching}
        setIsSearching={setIsSearching}
        mapLoaded={mapLoaded}
        setMapLoaded={setMapLoaded}
        mapInstanceRef={mapInstanceRef}
      />
    </MapProvider>
  );
};

export default MapPanel;
export { useMapContext, MapProvider };
