"use client";

import { useEffect, useState } from "react";
import { IVehicle } from "@/models/Vehicle";
import MobilityMap from "./MobilityMap";
import ReservationModal from "./ReservationModal";

interface StationStatus {
  name: string;
  available: number;
  total: number;
}

interface ActiveTrip {
  vehicle: IVehicle;
  startTime: number;
  endTime?: number;
  tripId: string;
}

export default function VehicleDiscovery() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<IVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);


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

  //Active Trip Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrip && !activeTrip.endTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - activeTrip.startTime) / 1000);
        setElapsedTime(seconds);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTrip]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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

  const displayedVehicles =
    filter === "All" ? vehicles : vehicles.filter((v) => v.type === filter);

  //reservation handler
  const executeReservation = async () => {
    if (!selectedVehicle) return;
    setIsReserving(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: selectedVehicle._id }),
      });

      const data = await res.json();

      if (res.ok) {
        setVehicles((prev) =>
          prev.filter((v) => v._id !== selectedVehicle._id),
        );
        setActiveTrip({
          vehicle: selectedVehicle,
          startTime: Date.now(),
          tripId: data.trip._id,
        });
        setSelectedVehicle(null);
        setShowConfirmModal(false);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Something went wrong with the reservation.");
    } finally {
      setIsReserving(false);
    }
  };

  if (loading)
    return (
      <div className="text-white/20 text-xs py-10">
        Syncing with Mobility Service...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700">
      {/* LEFT: Render the Map Component */}
      <MobilityMap
        vehicles={displayedVehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* RIGHT: Status & Details Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        {activeTrip ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 animate-in slide-in-from-right-4 duration-500 relative overflow-hidden">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                In Transit
              </span>
            </div>

            <p className="text-emerald-300 text-[10px] uppercase font-bold mb-2 tracking-tighter">
              Current Rental
            </p>
            <h3 className="text-white font-bold text-xl mb-1">
              {activeTrip.vehicle.type}
            </h3>
            <p className="text-white/40 text-[11px] mb-6">
              {activeTrip.vehicle.zone}
            </p>

            <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5 flex flex-col items-center justify-center">
              <span className="text-white/50 text-[10px] uppercase tracking-widest mb-1">
                Elapsed Time
              </span>
              <span className="text-3xl font-mono text-white tracking-wider">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <button
              onClick={() => {
                setActiveTrip((prev) =>
                  prev ? { ...prev, endTime: Date.now() } : null,
                );
                alert("need to implement rental completion API call here");
              }}
              disabled={!!activeTrip.endTime}
              className={`w-full py-3 rounded-lg border text-[11px] font-bold transition-all shadow-lg uppercase tracking-widest ${
                activeTrip.endTime
                  ? "bg-gray-500/10 border-gray-500/50 text-gray-400 cursor-not-allowed"
                  : "bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white"
              }`}
            >
              {activeTrip.endTime ? "Rental Ended" : "End Rental"}
            </button>
          </div>
        ) : (
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
        )}

        {selectedVehicle && !activeTrip && (
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

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isReserving}
              className="w-full py-3 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20 uppercase tracking-widest"
            >
              Reserve Vehicle →
            </button>
          </div>
        )}
      </div>

      {/* Render the Modal Component */}
      <ReservationModal
        isOpen={showConfirmModal}
        vehicle={selectedVehicle}
        isReserving={isReserving}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeReservation}
      />
    </div>
  );
}
