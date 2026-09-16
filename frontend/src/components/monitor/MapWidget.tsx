"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

interface MapWidgetProps {
  lat: number;
  lng: number;
}

function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
}

export default function MapWidget({ lat, lng }: MapWidgetProps) {
  const center: LatLngExpression = [lat, lng];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      zoomControl={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.9 }}
      />
      <RecenterMap center={center} />
    </MapContainer>
  );
}