"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
// CSS imported in globals.css
// import "leaflet/dist/leaflet.css";

import type { Incident } from "../../types/incident";

type Props = {
  incidents: Incident[];
};

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function IncidentMap({ incidents }: Props) {
  const coordinateCounts = new Map<string, number>();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <MapContainer
        center={[26.8467, 80.9462]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[500px] w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {incidents.map((incident) => {
          const key = `${incident.latitude},${incident.longitude}`;

          const occurrence = coordinateCounts.get(key) ?? 0;
          coordinateCounts.set(key, occurrence + 1);

          /*
           * If multiple incidents have exactly the same coordinates,
           * move each subsequent marker slightly.
           */
          const offset = occurrence * 0.001;

          const position: [number, number] = [
            Number(incident.latitude) + offset,
            Number(incident.longitude) + offset,
          ];

          return (
            <Marker
              key={incident.id}
              position={position}
              icon={markerIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {incident.title}
                  </h3>

                  <p>
                    Type: {incident.problem_type}
                  </p>

                  <p>
                    Severity: {incident.severity}
                  </p>

                  <p>
                    Status:{" "}
                    {incident.status.replace("_", " ")}
                  </p>

                  <p>
                    Reports: {incident.report_count}
                  </p>

                  {incident.address && (
                    <p>{incident.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}