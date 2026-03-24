"use client";

import { useState } from "react";
import { IVehicle } from "@/models/Vehicle";

interface MobilityMapProps {
  vehicles: IVehicle[];
  selectedVehicle: IVehicle | null;
  onSelectVehicle: (vehicle: IVehicle | null) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

// Map GPS to percentages
const getLeftPosition = (lng: number) => {
  const percent = ((lng - -73.6) / (-73.5 - -73.6)) * 100;
  return Math.max(5, Math.min(95, percent));
};

const getTopPosition = (lat: number) => {
  const percent = 100 - ((lat - 45.49) / (45.54 - 45.49)) * 100;
  return Math.max(5, Math.min(95, percent));
};

export default function MobilityMap({
  vehicles,
  selectedVehicle,
  onSelectVehicle,
  filter,
  onFilterChange,
}: MobilityMapProps) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (direction: "in" | "out") => {
    setScale((prev) =>
      Math.min(Math.max(0.5, prev + (direction === "in" ? 0.2 : -0.2)), 3),
    );
  };

  return (
    <div className="flex-1 min-h-125 rounded-xl border border-white/10 bg-[#0a0a0c] relative overflow-hidden flex flex-col">
      {/* Map Header & Controls */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-20 pointer-events-none">
        <h2 className="text-white/70 text-[10px] uppercase tracking-widest pointer-events-auto">
          City Mobility Map
        </h2>

        <div className="flex gap-4 pointer-events-auto">
          {/* Map Zoom Controls */}
          <div className="flex bg-white/5 border border-white/10 rounded-full overflow-hidden">
            <button
              onClick={() => handleZoom("out")}
              className="px-3 py-1 text-white/60 hover:bg-white/10 transition-colors"
            >
              -
            </button>
            <div className="w-px bg-white/10" />
            <button
              onClick={() => handleZoom("in")}
              className="px-3 py-1 text-white/60 hover:bg-white/10 transition-colors"
            >
              +
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {["All", "Car", "Bike", "Scooter"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  onFilterChange(f);
                  onSelectVehicle(null);
                }}
                className={`px-3 py-1 rounded-full border text-[10px] transition-colors ${filter === f ? "border-violet-500 bg-violet-500/20 text-white" : "border-white/10 text-white/60 hover:border-violet-500/50"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Draggable Map Area */}
      <div
        className={`flex-1 relative w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {vehicles.map((v) => (
            <div
              key={v._id.toString()}
              className="absolute z-20 transition-all duration-200"
              style={{
                top: `${getTopPosition(v.location.coordinates[1])}%`,
                left: `${getLeftPosition(v.location.coordinates[0])}%`,
                transform: `translate(-50%, -50%) scale(${1 / scale})`,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVehicle(v);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                  selectedVehicle?._id === v._id
                    ? "ring-2 ring-violet-500 bg-white/10 scale-110"
                    : ""
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-xl ${
                    v.state === "Available"
                      ? "bg-emerald-500 shadow-emerald-500/20"
                      : "bg-red-500/50"
                  }`}
                >
                  {v.type === "Car" ? "🚗" : v.type === "Bike" ? "🚲" : "🛴"}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
