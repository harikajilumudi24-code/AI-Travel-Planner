import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createIcon(color, emoji = null) {
  if (emoji) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="font-size:24px; line-height:1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${emoji}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pulse" style="width:14px; height:14px; border-radius:50%; background:${color}; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

const markerColors = {
  attraction: '#33a4ff',
  restaurant: '#f59e0b',
  hotel: '#22c55e',
  destination: '#ef4444',
  default: '#6b7280',
};

const markerEmojis = {
  attraction: '📍',
  restaurant: '🍽️',
  hotel: '🏨',
  destination: '🎯',
};

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [markers, map]);
  return null;
}

export function MapView({ markers = [], height = '400px', zoom = 13, center = null, className }) {
  const validMarkers = markers.filter((m) => m.lat != null && m.lng != null);
  const initialCenter = center
    ? [center.lat, center.lng]
    : validMarkers[0]
      ? [validMarkers[0].lat, validMarkers[0].lng]
      : [20, 0];

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={initialCenter} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validMarkers.map((m, i) => {
          const type = m.type || 'default';
          const icon = createIcon(markerColors[type], markerEmojis[type]);
          return (
            <Marker key={i} position={[m.lat, m.lng]} icon={icon}>
              {m.popup && (
                <Popup>
                  <div className="min-w-[180px]">
                    {m.popup.title && <p className="font-bold text-sm mb-1">{m.popup.title}</p>}
                    {m.popup.subtitle && <p className="text-xs text-gray-500 mb-1">{m.popup.subtitle}</p>}
                    {m.popup.description && <p className="text-xs">{m.popup.description}</p>}
                    {m.popup.rating && <p className="text-xs mt-1">★ {m.popup.rating}</p>}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
        <FitBounds markers={validMarkers} />
      </MapContainer>
    </div>
  );
}

export default MapView;
