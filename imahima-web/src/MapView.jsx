import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [points, map]);
  return null;
}

function emojiIcon(emoji, color, size) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:#FFF8ED;border:2.5px solid ${color};font-size:${Math.round(size * 0.55)}px;box-shadow:0 2px 6px rgba(36,27,47,0.25);">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function MapView({ self, friends, onSelectFriend }) {
  const points = useMemo(() => {
    const pts = [];
    if (self) pts.push([self.lat, self.lng]);
    friends.forEach((f) => {
      if (f.lat != null && f.lng != null) pts.push([f.lat, f.lng]);
    });
    return pts;
  }, [self, friends]);

  const center = self ? [self.lat, self.lng] : points[0] || [35.681236, 139.767125];

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {self && (
        <Marker position={[self.lat, self.lng]} icon={emojiIcon("📍", "#FF6B4A", 30)}>
          <Popup>自分</Popup>
        </Marker>
      )}
      {friends
        .filter((f) => f.lat != null && f.lng != null)
        .map((f) => (
          <Marker
            key={f.userId}
            position={[f.lat, f.lng]}
            icon={emojiIcon(f.avatar, f.color, 34)}
            eventHandlers={{ click: () => onSelectFriend(f) }}
          >
            <Popup>{f.name}</Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
