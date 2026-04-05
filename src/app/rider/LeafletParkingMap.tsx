"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { IParkingSpot } from "@/models/ParkingSpot";

const createParkingIcon = (spot: IParkingSpot, isSelected: boolean) => {
  const available = spot.state === "Available";
  const bgColor = available
    ? "bg-violet-500 shadow-violet-500/50"
    : "bg-red-500/50";
  const ring = isSelected ? "ring-2 ring-white bg-white/10 scale-125" : "";

  const html = `
    <div class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${ring}">
      <div class="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shadow-xl ${bgColor} text-white">
        P
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "bg-transparent",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface Props {
  spots: IParkingSpot[];
  selectedSpot: IParkingSpot | null;
  onSelectSpot: (spot: IParkingSpot) => void;
}

export default function LeafletParkingMap({
  spots,
  selectedSpot,
  onSelectSpot,
}: Props) {
  return (
    <MapContainer
      center={[45.5089, -73.5617]}
      zoom={13}
      zoomControl={true}
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

      {spots.map((s) => (
        <Marker
          key={s._id.toString()}
          position={[s.location.coordinates[1], s.location.coordinates[0]]}
          icon={createParkingIcon(s, selectedSpot?._id === s._id)}
          eventHandlers={{
            click: () => onSelectSpot(s),
          }}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-bold">Lot {s.lotNumber}</p>
              <p className="text-gray-500">{s.zone}</p>
              <p className="font-mono">${s.flatRate.toFixed(2)} flat</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
