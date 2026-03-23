"use client";

import { useEffect, useState } from "react";
import { IVehicle } from "@/models/Vehicle";

interface StationStatus {
  name: string;
  available: number;
  total: number;
}

export default function VehicleDiscovery() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/vehicles", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Vehicles fetch failed:", err);
        setLoading(false);
      });
  }, []);

  // Aggregating data for Station Status [cite: 92]
  const stations = vehicles.reduce<Record<string, StationStatus>>(
    (acc, vehicle) => {
      const zone = vehicle.zone || "Unknown";
      if (!acc[zone]) acc[zone] = { name: zone, available: 0, total: 0 };
      acc[zone].total++;
      if (vehicle.state === "Available") acc[zone].available++;
      return acc;
    },
    {},
  );

  const displayedVehicles = filter === "All" ? vehicles : vehicles.filter((v) => v.type === filter);

  if (loading)
    return (
      <div className="text-white/20 text-xs py-10">
        Syncing with Mobility Service...
      </div>
    );

  

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700">
      {/* LEFT: Map (The Observer) [cite: 44] */}
      <div className="flex-1 min-h-125 rounded-xl border border-white/10 bg-white/5 relative p-6 overflow-hidden">
        {/* ADDED: The Header with Filter Chips */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h2 className="text-white/70 text-[10px] uppercase tracking-widest">
            City Mobility Map
          </h2>
          <div className="flex gap-2">
            {["All", "Car", "Bike", "Scooter"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setSelectedVehicle(null); // Clear selection when filtering
                }}
                className={`px-3 py-1 rounded-full border text-[10px] transition-colors ${
                  filter === f
                    ? "border-violet-500 bg-violet-500/20 text-white"
                    : "border-white/10 text-white/60 hover:border-violet-500/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div
          className="absolute inset-0 top-16 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* UPDATED: Map over 'displayedVehicles' instead of 'vehicles' */}
        {displayedVehicles.map((v, i) => (
          <button
            key={v._id.toString()}
            onClick={() => setSelectedVehicle(v)}
            className={`absolute w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 z-20 ${
              selectedVehicle?._id === v._id
                ? "ring-2 ring-violet-500 bg-white/10"
                : ""
            }`}
            style={{ top: `${25 + i * 12}%`, left: `${15 + i * 18}%` }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-xl ${v.state === "Available" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500/50"}`}
            >
              {v.type === "Car" ? "🚗" : v.type === "Bike" ? "🚲" : "🛴"}
            </div>
          </button>
        ))}
      </div>

      {/* RIGHT: Status & Details */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {/* Station List */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-white/70 text-[10px] uppercase tracking-widest mb-6">
            Station Status
          </h2>
          <div className="space-y-6">
            {Object.values(stations).map((s) => (
              <div key={s.name} className="group">
                <div className="flex justify-between text-[11px] mb-2">
                  <span className="text-white/50 group-hover:text-white transition-colors">
                    {s.name}
                  </span>
                  <span className="text-emerald-400 font-mono">
                    {s.available}/{s.total}
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-1000"
                    style={{ width: `${(s.available / s.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Ride Detail [cite: 196] */}
        {selectedVehicle && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 animate-in slide-in-from-right-4 duration-500">
            <p className="text-violet-300 text-[10px] uppercase font-bold mb-2 tracking-tighter">
              Selected Ride
            </p>
            <h3 className="text-white font-bold text-lg mb-1">
              {selectedVehicle.type}
            </h3>
            <p className="text-white/40 text-[11px] mb-4">
              {selectedVehicle.zone}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${selectedVehicle.batteryLevel && selectedVehicle.batteryLevel < 20 ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${selectedVehicle.batteryLevel}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-white/60">
                {selectedVehicle.batteryLevel}%
              </span>
            </div>

            <button className="w-full py-3 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20 uppercase tracking-widest">
              Reserve Vehicle →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
