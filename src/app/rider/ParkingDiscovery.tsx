"use client";

import { useEffect, useState, useCallback } from "react";
import { IParkingSpot } from "@/models/ParkingSpot";
import Link from "next/link";
import ParkingMap from "./ParkingMap";
import ParkingReservationModal from "./ParkingReservationModal";

interface ParkingTripReceipt {
  resourceType?: "parking";
  lotNumber?: string;
  zone?: string;
  vehicleType?: string;
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

interface ActiveParkingTrip {
  spot: IParkingSpot;
  startTime: number;
  endTime?: number;
  tripId: string;
  receipt?: ParkingTripReceipt;
}

type LoadIssue = "none" | "unauthorized" | "failed";

export default function ParkingDiscovery() {
  const [spots, setSpots] = useState<IParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<IParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadIssue, setLoadIssue] = useState<LoadIssue>("none");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [activeTrip, setActiveTrip] = useState<ActiveParkingTrip | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast["type"], message: string, action?: Toast["action"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message, action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const spotsRes = await fetch("/api/parking-spots", { credentials: "include" });
        if (spotsRes.status === 401) {
          if (!cancelled) {
            setLoadIssue("unauthorized");
            setSpots([]);
          }
        } else if (!spotsRes.ok) {
          if (!cancelled) setLoadIssue("failed");
        } else {
          const spotData: IParkingSpot[] = await spotsRes.json();
          if (!cancelled) setSpots(spotData);
        }

        const activeRes = await fetch("/api/reservations/active");
        const activeTripData = await activeRes.json();
        if (
          !cancelled &&
          activeTripData.activeTrip?.parkingSpot
        ) {
          const { tripId, startTime, parkingSpot } = activeTripData.activeTrip;
          setActiveTrip({
            tripId,
            startTime: new Date(startTime).getTime(),
            spot: parkingSpot as IParkingSpot,
          });
        }
      } catch (err) {
        console.error("Parking data fetch failed:", err);
        if (!cancelled) setLoadIssue("failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const getSessionTotal = () => {
    if (!activeTrip) return 0;
    return activeTrip.spot.flatRate;
  };

  const refreshSpots = () => {
    fetch("/api/parking-spots", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setSpots(data))
      .catch((err) => console.error("Parking refresh failed:", err));
  };

  const endSession = async () => {
    if (!activeTrip || isEndingSession) return;
    setIsEndingSession(true);

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
      } else if (res.status === 402) {
        showToast(
          "warning",
          `Insufficient balance. Fare is $${data.fare?.toFixed(2) ?? "?"}, but you only have $${data.balanceRemaining?.toFixed(2) ?? "?"}. Add funds to end your session.`,
          { label: "Add Funds", href: "/profile" },
        );
      } else {
        showToast("error", data.error || "Failed to end session");
      }
    } catch {
      showToast("error", "Something went wrong ending the session.");
    } finally {
      setIsEndingSession(false);
    }
  };

  const executeReservation = async () => {
    if (!selectedSpot) return;
    setIsReserving(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parkingSpotId: selectedSpot._id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSpots((prev) => prev.filter((s) => s._id !== selectedSpot._id));
        setActiveTrip({
          spot: selectedSpot,
          startTime: Date.now(),
          tripId: data.trip._id,
        });
        setSelectedSpot(null);
        setShowConfirmModal(false);
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

  const displayedSpots = spots;

  if (loading) {
    return (
      <div className="text-white/20 text-xs py-10">Loading parking availability…</div>
    );
  }

  if (loadIssue === "unauthorized") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-8 text-center max-w-md">
        <p className="text-white font-semibold mb-2">Sign in required</p>
        <p className="text-white/50 text-sm mb-6">
          Parking spots are only loaded for signed-in riders (same as the vehicle map).
        </p>
        <Link
          href="/login"
          className="inline-block py-2.5 px-5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-500"
        >
          Go to login
        </Link>
      </div>
    );
  }

  const showSeedHint =
    loadIssue === "none" && spots.length === 0 && !activeTrip;

  return (
    <div className="flex flex-col gap-4 w-full animate-in fade-in duration-700">
      {loadIssue === "failed" && (
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-300 text-sm">
          Could not load parking spots. Check the server console and try again.
        </div>
      )}

      {showSeedHint && (
        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-white/80 text-sm font-medium mb-1">No parking lots in the database</p>
          <p className="text-white/45 text-xs leading-relaxed">
            That usually means sample data was never loaded. In development, run the seed once: open{" "}
            <code className="text-violet-300/90">/api/seed</code> in the browser or call it with curl.
            That creates vehicles and parking spots (only <span className="text-white/60">Available</span>{" "}
            lots appear on the map—one seeded lot is reserved on purpose).
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
      <ParkingMap
        spots={displayedSpots}
        selectedSpot={selectedSpot}
        onSelectSpot={setSelectedSpot}
      />

      <div className="w-full lg:w-80 flex flex-col gap-6">
        {activeTrip && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 animate-in slide-in-from-right-4 duration-500 relative overflow-hidden">
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-violet-400 font-bold">
                Parked
              </span>
            </div>

            <p className="text-violet-300 text-[10px] uppercase font-bold mb-2 tracking-tighter">
              Active session
            </p>
            <h3 className="text-white font-bold text-xl mb-1">Lot {activeTrip.spot.lotNumber}</h3>
            <p className="text-white/40 text-[11px] mb-6">{activeTrip.spot.zone}</p>

            {!activeTrip.endTime && (
              <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5 flex flex-col items-center justify-center gap-2">
                <span className="text-white/50 text-[10px] uppercase tracking-widest">
                  Elapsed
                </span>
                <span className="text-3xl font-mono text-white tracking-wider">
                  {formatTime(elapsedTime)}
                </span>
                <span className="text-violet-400 font-mono text-lg font-bold">
                  ${getSessionTotal().toFixed(2)} flat
                </span>
              </div>
            )}

            {activeTrip.receipt && (
              <div className="bg-black/40 rounded-lg p-4 mb-6 border border-violet-500/20 space-y-3">
                <p className="text-violet-400 text-[10px] uppercase font-bold tracking-widest text-center mb-2">
                  Receipt
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
                  <span className="text-white/70 font-bold">Total charged</span>
                  <span className="text-violet-400 font-mono font-bold">
                    ${activeTrip.receipt.totalFare.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] pt-1">
                  <span className="text-white/40">Balance remaining</span>
                  <span className="text-white/60 font-mono">
                    ${activeTrip.receipt.balanceRemaining.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {activeTrip.endTime ? (
              <button
                onClick={() => {
                  refreshSpots();
                  setActiveTrip(null);
                }}
                className="w-full py-3 rounded-lg border border-white/10 text-white/70 text-[11px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest"
              >
                Dismiss
              </button>
            ) : (
              <button
                onClick={endSession}
                disabled={isEndingSession}
                className="w-full py-3 rounded-lg border bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white text-[11px] font-bold transition-all shadow-lg uppercase tracking-widest disabled:opacity-50"
              >
                {isEndingSession ? "Processing..." : "End session & pay"}
              </button>
            )}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-white/70 text-[10px] uppercase tracking-widest mb-2">
            How it works
          </h2>
          <p className="text-white/40 text-xs leading-relaxed">
            Pick an available lot on the map. You pay a flat fee per session when you end parking—
            shown on the lot and on your receipt.
          </p>
        </div>

        {selectedSpot && !activeTrip && (
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 animate-in slide-in-from-right-4 duration-500">
            <p className="text-violet-300 text-[10px] uppercase font-bold mb-2 tracking-tighter">
              Selected lot
            </p>
            <h3 className="text-white font-bold text-lg mb-1">{selectedSpot.lotNumber}</h3>
            <p className="text-white/40 text-[11px] mb-4">{selectedSpot.zone}</p>
            <p className="text-violet-400 font-mono text-sm mb-6">
              ${selectedSpot.flatRate.toFixed(2)} flat
            </p>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isReserving}
              className="w-full py-3 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20 uppercase tracking-widest"
            >
              Reserve lot →
            </button>
          </div>
        )}
      </div>
      </div>

      <ParkingReservationModal
        isOpen={showConfirmModal}
        spot={selectedSpot}
        isReserving={isReserving}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeReservation}
      />

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
