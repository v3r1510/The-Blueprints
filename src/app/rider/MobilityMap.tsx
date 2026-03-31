"use client";

import dynamic from "next/dynamic";
import { IVehicle } from "@/models/Vehicle";

// Dynamically load the Leaflet map to prevent Next.js SSR "window is not defined" errors
const RiderLeafletMap = dynamic(() => import("./LeafleftMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c] text-white/50 text-xs">
      Loading city map...
    </div>
  ),
});

interface MobilityMapProps {
  vehicles: IVehicle[];
  selectedVehicle: IVehicle | null;
  onSelectVehicle: (vehicle: IVehicle | null) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

export default function MobilityMap({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  filter,
  onFilterChange,
}: MobilityMapProps) {
  return (
    <div className="flex-1 min-h-125 rounded-xl border border-white/10 bg-[#0a0a0c] relative overflow-hidden flex flex-col">
      {/* Map Header & Controls (Floating Overlay) */}
      {/* z-[1000] ensures it sits above Leaflet's internal controls */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-[1000] pointer-events-none">
        <h2 className="text-white/70 text-[10px] uppercase tracking-widest pointer-events-auto drop-shadow-md">
          City Mobility Map
        </h2>

        <div className="flex gap-4 pointer-events-auto">
          {/* Filters */}
          <div className="flex gap-2">
            {["All", "Car", "Bike", "Scooter"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  onFilterChange(f);
                  onSelectVehicle(null);
                }}
                className={`px-3 py-1 rounded-full border text-[10px] transition-colors shadow-lg backdrop-blur-md ${
                  filter === f
                    ? "border-violet-500 bg-violet-500/40 text-white"
                    : "border-white/10 bg-black/60 text-white/60 hover:border-violet-500/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Actual Interactive Map */}
      <div className="absolute inset-0 z-0">
        <RiderLeafletMap
          vehicles={vehicles}
          selectedVehicle={selectedVehicle}
          onSelectVehicle={onSelectVehicle}
        />
      </div>
    </div>
  );
}
