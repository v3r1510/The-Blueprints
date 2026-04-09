"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface Props {
  lat: number;
  lng: number;
  vehicleType: string;
}

const EMOJI: Record<string, string> = {
  Car: "🚗",
  Bike: "🚲",
  Scooter: "🛴",
};

export default function LeafletVehicleLocator({ lat, lng, vehicleType }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: [lat, lng],
      zoom: 14,
      scrollWheelZoom: true,
      dragging: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const emoji = EMOJI[vehicleType] ?? "📍";
    const icon = L.divIcon({
      html: `
        <div style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:rgba(139,92,246,0.25);border:2px solid #8b5cf6;">
          <span style="font-size:18px;">${emoji}</span>
        </div>
      `,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    L.marker([lat, lng], { icon }).addTo(map);

    mapRef.current = map;

    requestAnimationFrame(() => map.invalidateSize({ animate: false }));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, vehicleType]);

  return <div ref={containerRef} className="h-full w-full" />;
}
