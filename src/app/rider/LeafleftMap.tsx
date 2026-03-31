"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { IVehicle } from "@/models/Vehicle";

// This allows us to use your awesome Tailwind styling inside the Leaflet canvas
const createNeonIcon = (vehicle: IVehicle, isSelected: boolean) => {
  const emoji =
    vehicle.type === "Car" ? "🚗" : vehicle.type === "Bike" ? "🚲" : "🛴";
  const bgColor =
    vehicle.state === "Available"
      ? "bg-emerald-500 shadow-emerald-500/50"
      : "bg-red-500/50";
  const ring = isSelected ? "ring-2 ring-violet-500 bg-white/10 scale-125" : "";

  const html = `
    <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${ring}">
      <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-xl ${bgColor}">
        ${emoji}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "bg-transparent", // Removes default white square background
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface Props {
  vehicles: IVehicle[];
  selectedVehicle: IVehicle | null;
  onSelectVehicle: (v: IVehicle) => void;
}

export default function RiderLeafletMap({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
}: Props) {
  return (
    <MapContainer
      center={[45.5089, -73.5617]} // Centered on downtown Montreal
      zoom={13}
      zoomControl={true} // Enable zoom controls
      style={{
        height: "100%",
        width: "100%",
        background: "#0a0a0c",
        zIndex: 0,
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {vehicles.map((v) => (
        <Marker
          key={v._id.toString()}
          position={[v.location.coordinates[1], v.location.coordinates[0]]} // Leaflet uses [Lat, Lng]
          icon={createNeonIcon(v, selectedVehicle?._id === v._id)}
          eventHandlers={{
            click: () => onSelectVehicle(v),
          }}
        />
      ))}
    </MapContainer>
  );
}
