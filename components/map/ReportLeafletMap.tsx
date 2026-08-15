"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ReportLeafletMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
  zoom?: number;
  className?: string;
}

export default function ReportLeafletMap({
  latitude,
  longitude,
  title,
  address,
  zoom = 15,
  className = "h-64 w-full"
}: ReportLeafletMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom,
        zoomControl: true
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const marker = L.marker([latitude, longitude]).addTo(map);

      if (title || address) {
        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px;">
            ${title ? `<strong style="font-size: 14px;">${title}</strong><br/>` : ""}
            ${address ? `<span style="font-size: 12px; color: #475569;">${address}</span><br/>` : ""}
            <span style="font-size: 11px; color: #0d9488;">Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}</span>
          </div>
        `;
        marker.bindPopup(popupContent);
      }

      leafletMapRef.current = map;
      markerRef.current = marker;
    } else {
      leafletMapRef.current.setView([latitude, longitude], zoom);
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }
  }, [latitude, longitude, title, address, zoom]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div ref={mapRef} className="h-full w-full z-0" />
    </div>
  );
}
