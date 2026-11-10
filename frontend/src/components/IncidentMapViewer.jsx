import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

export default function IncidentMapViewer({ coordinates, title, severity, className = 'h-56' }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) return;

    const [lon, lat] = coordinates;
    const center = [lat, lon];

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer(
        `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
        {
          attribution:
            'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | &copy; OpenStreetMap',
          maxZoom: 19,
        }
      ).addTo(map);

      const marker = L.marker(center).addTo(map);
      if (title) {
        marker.bindPopup(`<b>${title}</b><br/>Severity: ${severity || 'N/A'}`).openPopup();
      }

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [coordinates, title, severity]);

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return (
      <div className={`w-full ${className} bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs border border-slate-200`}>
        Location map coordinates unavailable
      </div>
    );
  }

  return (
    <div className={`w-full ${className} rounded-lg overflow-hidden border border-slate-300 relative`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
