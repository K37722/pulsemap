'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { EnrichedIncident } from '@/types/incident';
import { getSeverityColor, getPrecisionColor } from '@/lib/services/classifier';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface IncidentMapProps {
  incidents: EnrichedIncident[];
  center?: [number, number];
  zoom?: number;
  onIncidentClick?: (incident: EnrichedIncident) => void;
}

// Custom marker icon based on severity
function createCustomIcon(incident: EnrichedIncident): L.DivIcon {
  const severityColor = getSeverityColor(incident.severity);
  const precisionColor = getPrecisionColor(incident.precision);

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${severityColor};
        border: 3px solid ${precisionColor};
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// Component to handle map updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

export default function IncidentMap({
  incidents,
  center = [
    parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '59.9139'),
    parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '10.7522'),
  ],
  zoom = parseInt(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM || '12'),
  onIncidentClick,
}: IncidentMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Filter incidents with valid coordinates
  const mappableIncidents = incidents.filter(
    (incident) => incident.coordinates && incident.coordinates.lat && incident.coordinates.lng
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      className="z-0"
    >
      <MapUpdater center={center} />

      {/* OpenStreetMap tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Incident markers */}
      {mappableIncidents.map((incident) => {
        if (!incident.coordinates) return null;

        const position: [number, number] = [
          incident.coordinates.lat,
          incident.coordinates.lng,
        ];

        return (
          <Marker
            key={incident.id}
            position={position}
            icon={createCustomIcon(incident)}
            eventHandlers={{
              click: () => {
                if (onIncidentClick) {
                  onIncidentClick(incident);
                }
              },
            }}
          >
            <Popup>
              <div className="min-w-[250px]">
                <h3 className="font-bold text-sm mb-1">{incident.title}</h3>
                <div className="text-xs text-gray-600 mb-2">
                  {new Date(incident.published).toLocaleString('no-NO')}
                </div>
                <p className="text-sm mb-2">{incident.description}</p>
                <div className="flex gap-2 flex-wrap text-xs">
                  <span
                    className="px-2 py-1 rounded text-white"
                    style={{ backgroundColor: getSeverityColor(incident.severity) }}
                  >
                    {incident.severity}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-white"
                    style={{ backgroundColor: getPrecisionColor(incident.precision) }}
                  >
                    {incident.precision}
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-200 text-gray-700">
                    {incident.category}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  📍 {incident.location}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
