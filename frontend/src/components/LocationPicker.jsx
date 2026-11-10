import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import api from '../services/api.js';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

// Fix Leaflet default marker icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LocationPicker({ value, onChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Default center (e.g. New York or user coordinates if present)
  // GeoJSON coordinates format: [longitude, latitude]
  const defaultCoords = value?.coordinates?.length === 2
    ? [value.coordinates[1], value.coordinates[0]] // Leaflet takes [lat, lon]
    : [40.7128, -74.006]; // default lat, lon

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCoords,
        zoom: value?.coordinates ? 14 : 11,
      });

      // Geoapify Tile Layer
      L.tileLayer(
        `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
        {
          attribution:
            'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(map);

      // Add marker if coordinates exist
      if (value?.coordinates) {
        const marker = L.marker(defaultCoords).addTo(map);
        markerRef.current = marker;
      }

      // Map Click event
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        // Lon, Lat for GeoJSON
        const lon = Number(lng.toFixed(6));
        const latitude = Number(lat.toFixed(6));

        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, lon]);
        } else {
          markerRef.current = L.marker([latitude, lon]).addTo(map);
        }

        setLocationError('');
        // Reverse geocode to get address
        try {
          const res = await api.reverseGeo(latitude, lon);
          const results = res?.data?.results || [];
          const best = results[0];
          const address = best?.formatted || best?.address_line1 || `Location at ${latitude}, ${lon}`;
          onChange({
            coordinates: [lon, latitude],
            address,
            source: 'MAP_PIN',
          });
        } catch {
          onChange({
            coordinates: [lon, latitude],
            address: `Coordinates: ${latitude}, ${lon}`,
            source: 'MAP_PIN',
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position if value changes externally
  useEffect(() => {
    if (mapInstanceRef.current && value?.coordinates) {
      const lat = value.coordinates[1];
      const lon = value.coordinates[0];
      const target = [lat, lon];
      if (markerRef.current) {
        markerRef.current.setLatLng(target);
      } else {
        markerRef.current = L.marker(target).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView(target, 14);
    }
  }, [value?.coordinates]);

  // Handle GPS location capture
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const lon = Number(longitude.toFixed(6));
        const lat = Number(latitude.toFixed(6));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lon]);
          } else {
            markerRef.current = L.marker([lat, lon]).addTo(mapInstanceRef.current);
          }
        }

        try {
          const res = await api.reverseGeo(lat, lon);
          const results = res?.data?.results || [];
          const best = results[0];
          const address = best?.formatted || best?.address_line1 || `Current GPS Location`;
          onChange({
            coordinates: [lon, lat],
            address,
            accuracyMeters: Math.round(accuracy) || 10,
            source: 'GPS',
          });
        } catch {
          onChange({
            coordinates: [lon, lat],
            address: `GPS Location (${lat}, ${lon})`,
            accuracyMeters: Math.round(accuracy) || 10,
            source: 'GPS',
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setLocationError(`GPS permission or signal unavailable: ${err.message}. Please select on the map or search.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search Address
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setLocationError('');
    try {
      const res = await api.searchGeo(searchQuery.trim());
      setSearchResults(res?.data?.results || []);
    } catch (err) {
      setLocationError(err.message || 'Address search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    const lat = result.lat;
    const lon = result.lon;
    const address = result.formatted || result.address_line1 || searchQuery;

    setSearchResults([]);
    setSearchQuery('');

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        markerRef.current = L.marker([lat, lon]).addTo(mapInstanceRef.current);
      }
    }

    onChange({
      coordinates: [lon, lat],
      address,
      source: 'ADDRESS_SEARCH',
    });
  };

  return (
    <div className="space-y-3">
      {/* Top controls: GPS button & Address Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleUseGps}
          disabled={gpsLoading}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span>Use GPS Location</span>
        </button>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2 relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, landmark or area..."
              className="w-full px-3 py-2 pl-9 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>

          {/* Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 border-b border-slate-100 last:border-0"
                >
                  <p className="font-medium text-slate-800">{r.formatted}</p>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {locationError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {locationError}
        </div>
      )}

      {/* Map view */}
      <div className="relative border border-slate-300 rounded-lg overflow-hidden h-64 sm:h-72">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-medium text-slate-600 shadow-sm pointer-events-none z-[1000]">
          Click map to adjust pin
        </div>
      </div>

      {/* Selected location display */}
      <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs flex-1">
          <span className="font-semibold text-slate-700">Selected Location: </span>
          <span className="text-slate-800">
            {value?.address || (value?.coordinates ? `Coordinates: ${value.coordinates[1]}, ${value.coordinates[0]}` : 'No location selected yet')}
          </span>
          {value?.source && (
            <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-medium uppercase">
              {value.source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
