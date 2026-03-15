'use client';

import { FC, useEffect, useState, useRef, createContext, useContext, ReactNode, useCallback } from 'react';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { Marker, Popup } from 'react-leaflet';
import { Crosshair, Search } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { lookupLocation, ZipCodeLocation } from '@/lib/location/locationLookup';

// Dynamic imports to prevent SSR issues with leaflet
const DynamicMapContainer = async () => {
  const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
  return { MapContainer, TileLayer, Marker, Popup };
};

// Type for the map context value
interface MapContextValue {
  setZoomTarget: (lat: number, lng: number, zoom?: number) => void;
  mapInstance: L.Map | null;
  setMapInstance: (map: L.Map | null) => void;
}

// Create the context
const MapContext = createContext<MapContextValue | undefined>(undefined);

// Context Provider Component
const MapProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [zoomTarget, setZoomTargetState] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  const setMapInstanceRef = useCallback((map: L.Map | null) => {
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

// Internal component that uses the map instance and sets it in context
const MapInstanceHandler: FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
};

// Context consumer component to set map instance in provider
const MapInstanceSetter: FC<{ onMapReady: (map: L.Map) => void }> = ({ onMapReady }) => {
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

// Internal component that consumes the map context
const MapContent: FC<{ 
  zip: string;
  setZip: (zip: string) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  mapLoaded: boolean;
  setMapLoaded: (mapLoaded: boolean) => void;
  mapInstanceRef: React.RefObject<L.Map | null>;
  MapContainer: React.ElementType;
  TileLayer: React.ElementType;
}> = ({ zip, setZip, isSearching, setIsSearching, mapLoaded, setMapLoaded, mapInstanceRef, MapContainer, TileLayer }) => {
  const { setZoomTarget, mapInstance } = useMapContext();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pendingZoomTarget, setPendingZoomTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchResultMessage, setSearchResultMessage] = useState<string | null>(null);

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

  // ZIP search input floating above the map panel
  const zipSearchAbovePanelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '260px', // 10px below the top of the panel
    right: '85px', // 10px left from the right border of the panel
    backgroundColor: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'row', // inline layout
    alignItems: 'center',
    gap: '8px',
  };

  // Error banner style
  const errorBannerStyle: React.CSSProperties = {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '10px 15px',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
    maxWidth: '300px',
  };

  return (
    <>
      <motion.div
        style={panelStyle}
        initial={{ opacity: 1, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <MapContainer 
          center={[40.7506, -73.9972]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          className="rounded"
          attributionControl={false}
        >
          <MapInstanceSetter onMapReady={(map) => {
            mapInstanceRef.current = map;
            setMapLoaded(true);
          }} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>
          )}
        </MapContainer>
      </motion.div>
      {/* Zip search input floating above the map panel */}
      <motion.div
        style={zipSearchAbovePanelStyle}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, ease: 'easeOut' }}
      >
        {/* Error banner above ZIP input */}
        {searchError && (
          <motion.div
            style={errorBannerStyle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {searchError}
          </motion.div>
        )}
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter ZIP code..."
          disabled={isSearching}
          style={inputStyle}
        />
        <button onClick={handleLocate} disabled={isSearching} style={buttonStyle}>
          <Crosshair size={20} />
        </button>
        <button onClick={handleSearch} disabled={isSearching} style={{ ...buttonStyle, marginLeft: '8px' }}>
          <Search size={20} />
        </button>
      </motion.div>
    </>
  );
};

const MapPanel: FC = () => {
  const [MapContainer, setMapContainer] = useState<React.ElementType | null>(null);
  const [TileLayer, setTileLayer] = useState<React.ElementType | null>(null);
  const [Marker, setMarker] = useState<React.ElementType | null>(null);
  const [Popup, setPopup] = useState<React.ElementType | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [zip, setZip] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    DynamicMapContainer().then(({ MapContainer, TileLayer, Marker, Popup }) => {
      if (mounted) {
        setMapContainer(MapContainer);
        setTileLayer(TileLayer);
        setMarker(Marker);
        setPopup(Popup);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!MapContainer || !TileLayer) {
    return (
      <motion.div
        style={panelStyle}
        initial={{ opacity: 1, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-center h-full w-full">
          Loading map...
        </div>
      </motion.div>
    );
  }

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
        MapContainer={MapContainer}
        TileLayer={TileLayer}
      />
    </MapProvider>
  );
};

const zipSearchStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  backgroundColor: 'white',
  padding: '10px 15px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  display: 'flex',
  gap: '10px',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
  width: '150px',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '4px',
  backgroundColor: '#000',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  outline: 'none',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#edeaea',
  width: 'min(1600px, max(200px, calc(100vw - 150px)))',
  aspectRatio: '21/9',
  border: '2px solid Black',
  boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
  zIndex: 0,
  padding: '0',
  position: 'fixed',
  top: '250px',
  left: '75px',
  right: '75px',
};

export default MapPanel;
export { useMapContext, MapProvider };