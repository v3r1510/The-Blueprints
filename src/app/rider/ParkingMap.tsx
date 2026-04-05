"use client";

import dynamic from "next/dynamic";
import { IParkingSpot } from "@/models/ParkingSpot";

const LeafletParkingMap = dynamic(() => import("./LeafletParkingMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c] text-white/50 text-xs">
      Loading parking map...
    </div>
  ),
});

interface ParkingMapProps {
  spots: IParkingSpot[];
  selectedSpot: IParkingSpot | null;
  onSelectSpot: (spot: IParkingSpot | null) => void;
}

export default function ParkingMap({
  spots,
  selectedSpot,
  onSelectSpot,
}: ParkingMapProps) {
  return (
    <div className="flex-1 min-h-125 rounded-xl border border-white/10 bg-[#0a0a0c] relative overflow-hidden flex flex-col">
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-[1000] pointer-events-none">
        <h2 className="text-white/70 text-[10px] uppercase tracking-widest pointer-events-auto drop-shadow-md">
          Parking Map
        </h2>
      </div>

      <div className="absolute inset-0 z-0">
        <LeafletParkingMap
          spots={spots}
          selectedSpot={selectedSpot}
          onSelectSpot={onSelectSpot}
        />
      </div>
    </div>
  );
}
