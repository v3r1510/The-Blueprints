"use client";

import { useEffect, useState, useCallback } from "react";
import { IVehicle } from "@/models/Vehicle";
import { getStrategyForVehicle } from "@/lib/pricing";
import Link from "next/link";
import MobilityMap from "./MobilityMap";
import ReservationModal from "./ReservationModal";

interface StationStatus {
  name: string;
  available: number;
  total: number;
}

interface TripReceipt {
  vehicleType: string;
  zone: string;
  durationMinutes: number;
  rate: number;
  unit: string;
  totalFare: number;
  balanceRemaining: number;
}

interface Toast {
  id: number;
  type: "error" | "success" | "warning";
  message: string;
  action?: { label: string; href: string };
}

interface ActiveTrip {
  vehicle: IVehicle;
  startTime: number;
  endTime?: number;
  tripId: string;
  receipt?: TripReceipt;
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
  const [isEndingRental, setIsEndingRental] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [stations, setStations] = useState<StationStatus[]>([]);

  const showToast = useCallback((type: Toast["type"], message: string, action?: Toast["action"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const refreshStations = () => {
    fetch("/api/vehicles/stations", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setStations(data))
      .catch((err) => console.error("Station refresh failed:", err));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles", { credentials: "include" }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch("/api/reservations/active").then((res) => res.json()),
      fetch("/api/vehicles/stations", { credentials: "include" }).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
    ])
      .then(([vehicleData, activeTripData, stationData]) => {
        setVehicles(vehicleData);
        setStations(stationData);
        if (activeTripData.activeTrip?.vehicle) {
          const { tripId, startTime, vehicle } = activeTripData.activeTrip;
          setActiveTrip({
            tripId,
            startTime: new Date(startTime).getTime(),
            vehicle,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Initial data fetch failed:", err);
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

  const getRunningCost = () => {
    if (!activeTrip) return 0;
    const strategy = getStrategyForVehicle(activeTrip.vehicle.type);
    const minutes = Math.max(1, Math.ceil(elapsedTime / 60));
    return strategy.calculateTotal(minutes);
  };

  const refreshVehicles = () => {
    fetch("/api/vehicles", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setVehicles(data))
      .catch((err) => console.error("Vehicle refresh failed:", err));
    refreshStations();
  };

  const endRental = async () => {
    if (!activeTrip || isEndingRental) return;
    setIsEndingRental(true);

    try {
      const res = await fetch("/api/reservations/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId: activeTrip.tripId }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveTrip((prev) =>
          prev ? { ...prev, endTime: Date.now(), receipt: data.receipt } : null,
        );
        refreshStations();
      } else if (res.status === 402) {
        showToast(
          "warning",
          `Insufficient balance. Fare is $${data.fare?.toFixed(2) ?? "?"}, but you only have $${data.balanceRemaining?.toFixed(2) ?? "?"}. Add funds to end your rental.`,
          { label: "Add Funds", href: "/profile" },
        );
      } else {
        showToast("error", data.error || "Failed to end rental");
      }
    } catch {
      showToast("error", "Something went wrong ending the rental.");
    } finally {
      setIsEndingRental(false);
    }
  };

  const displayedVehicles =
    filter === "All" ? vehicles : vehicles.filter((v) => v.type === filter);

  const getPricingStrategy = (type: string) => {
    switch (type) {
      case "Bike": return "PerHour";
      case "Scooter":
      case "Car": return "PerMinute";
      default: return "FlatRate";
    }
  };

  const executeReservation = async () => {
    if (!selectedVehicle) return;
    setIsReserving(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicle._id,
          pricingStrategy: getPricingStrategy(selectedVehicle.type),
        }),
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
        refreshStations();
      } else if (res.status === 402) {
        setShowConfirmModal(false);
        showToast(
          "warning",
          "Insufficient balance. Minimum $10.00 required to reserve.",
          { label: "Add Funds", href: "/profile" },
        );
      } else if (res.status === 409) {
        setShowConfirmModal(false);
        showToast("warning", data.error || "You already have an active rental.");
      } else {
        showToast("error", data.error || "Reservation failed");
      }
    } catch {
      showToast("error", "Something went wrong with the reservation.");
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
        {activeTrip && (
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

            {!activeTrip.endTime && (
              <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5 flex flex-col items-center justify-center gap-2">
                <span className="text-white/50 text-[10px] uppercase tracking-widest">
                  Elapsed Time
                </span>
                <span className="text-3xl font-mono text-white tracking-wider">
                  {formatTime(elapsedTime)}
                </span>
                <span className="text-emerald-400 font-mono text-lg font-bold">
                  ${getRunningCost().toFixed(2)}
                </span>
              </div>
            )}

            {activeTrip.receipt && (
              <div className="bg-black/40 rounded-lg p-4 mb-6 border border-emerald-500/20 space-y-3">
                <p className="text-emerald-400 text-[10px] uppercase font-bold tracking-widest text-center mb-2">
                  Trip Receipt
                </p>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/50">Duration</span>
                  <span className="text-white font-mono">
                    {activeTrip.receipt.durationMinutes} min
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/50">Rate</span>
                  <span className="text-white font-mono">
                    ${activeTrip.receipt.rate.toFixed(2)} / {activeTrip.receipt.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-white/70 font-bold">Total Charged</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ${activeTrip.receipt.totalFare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span className="text-white/40">Balance Remaining</span>
                  <span className="text-white/60 font-mono">
                    ${activeTrip.receipt.balanceRemaining.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {activeTrip.endTime ? (
              <button
                onClick={() => {
                  refreshVehicles();
                  setActiveTrip(null);
                }}
                className="w-full py-3 rounded-lg border border-white/10 text-white/70 text-[11px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest"
              >
                Dismiss
              </button>
            ) : (
              <button
                onClick={endRental}
                disabled={isEndingRental}
                className="w-full py-3 rounded-lg border bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white text-[11px] font-bold transition-all shadow-lg uppercase tracking-widest disabled:opacity-50"
              >
                {isEndingRental ? "Processing..." : "End Rental"}
              </button>
            )}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-white/70 text-[10px] uppercase tracking-widest mb-6">
            Station Status
          </h2>
          <div className="space-y-6">
            {stations.map((s) => (
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

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const styles = {
            error: "border-red-500/40 bg-red-500/10 text-red-400",
            warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
            success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
          };
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-xl border backdrop-blur-md px-5 py-4 shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300 max-w-sm ${styles[toast.type]}`}
            >
              <p className="text-sm font-semibold">{toast.message}</p>
              {toast.action && (
                <Link
                  href={toast.action.href}
                  className="mt-2 inline-block text-xs font-bold underline underline-offset-2 hover:no-underline transition-all"
                >
                  {toast.action.label} &rarr;
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
