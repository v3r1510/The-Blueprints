"use client";

import React from "react";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type VehicleType = "Car" | "Bike" | "Scooter";
type VehicleState = "Available" | "Reserved" | "InUse" | "Maintenance";

interface VehicleRating {
  vehicleId: string;
  type: string;
  zone: string;
  average: number;
  count: number;
  latestComment: string | null;
  latestStars: number | null;
  latestDate: string | null;
}

interface VehicleRow {
  _id: string;
  type: VehicleType;
  state: VehicleState;
  batteryLevel?: number;
  zone: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface StationSummary {
  name: string;
  total: number;
  available: number;
  creatableTypes: VehicleType[];
  byType: Array<{
    type: VehicleType;
    total: number;
    available: number;
  }>;
}

const VEHICLE_TYPES: VehicleType[] = ["Car", "Bike", "Scooter"];
const VEHICLE_STATES: VehicleState[] = [
  "Available",
  "Reserved",
  "InUse",
  "Maintenance",
];

const LeafletLocationPicker = dynamic(() => import("./LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-sm text-white/50 bg-black/40">
      Loading map...
    </div>
  ),
});

const LeafletVehicleLocator = dynamic(() => import("./LeafletVehicleLocator"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-sm text-white/50 bg-black/40">
      Loading map...
    </div>
  ),
});

export default function OperatorPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<VehicleRating[]>([]);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<
    { stars: number; comment?: string; createdAt: string }[]
  >([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [locatedVehicle, setLocatedVehicle] = useState<VehicleRow | null>(null);

  const [createForm, setCreateForm] = useState({
    type: "Scooter" as VehicleType,
    zone: "Downtown",
    batteryLevel: "100",
    lat: "45.5089",
    lng: "-73.5617",
    state: "Available" as VehicleState,
  });

  const [drafts, setDrafts] = useState<
    Record<string, { zone: string; batteryLevel: string; state: VehicleState }>
  >({});

  const currentLat = Number(createForm.lat);
  const currentLng = Number(createForm.lng);
  const markerLat = Number.isFinite(currentLat) ? currentLat : 45.5089;
  const markerLng = Number.isFinite(currentLng) ? currentLng : -73.5617;

  const handleMapSelect = (lat: number, lng: number) => {
    setCreateForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  };

  const loadVehicles = async () => {
    setLoading(true);
    setError("");

    try {
      const [vehiclesRes, stationsRes] = await Promise.all([
        fetch("/api/operator/vehicles", { credentials: "include" }),
        fetch("/api/vehicles/stations", { credentials: "include" }),
      ]);

      const data = await vehiclesRes.json();
      const stationsData = await stationsRes.json();

      if (!vehiclesRes.ok) {
        throw new Error(data.error || "Failed to load vehicles");
      }

      if (stationsRes.ok) {
        const nextStations = stationsData ?? [];
        setStations(nextStations);

        if (nextStations.length > 0) {
          setCreateForm((prev) => {
            if (nextStations.some((station: StationSummary) => station.name === prev.zone)) {
              return prev;
            }
            return { ...prev, zone: nextStations[0].name };
          });
        }
      }

      setVehicles(data.vehicles ?? []);

      const nextDrafts: Record<string, { zone: string; batteryLevel: string; state: VehicleState }> = {};
      for (const vehicle of data.vehicles ?? []) {
        nextDrafts[vehicle._id] = {
          zone: vehicle.zone,
          batteryLevel: String(vehicle.batteryLevel ?? ""),
          state: vehicle.state,
        };
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const toggleVehicleReviews = async (vehicleId: string) => {
    if (expandedVehicle === vehicleId) {
      setExpandedVehicle(null);
      setExpandedReviews([]);
      return;
    }
    setExpandedVehicle(vehicleId);
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/ratings/vehicle/${vehicleId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setExpandedReviews(data.recent ?? []);
      } else {
        setExpandedReviews([]);
      }
    } catch {
      setExpandedReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const getRatingForVehicle = (vehicleId: string) =>
    ratings.find((r) => r.vehicleId === vehicleId);

  const loadRatings = () => {
    fetch("/api/operator/ratings", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRatings(data))
      .catch(() => setRatings([]));
  };

  useEffect(() => {
    loadVehicles();
    loadRatings();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSavingId("create");
    setError("");

    try {
      const res = await fetch("/api/operator/vehicles", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: createForm.type,
          zone: createForm.zone,
          batteryLevel:
            createForm.batteryLevel.trim() === ""
              ? undefined
              : Number(createForm.batteryLevel),
          lat: Number(createForm.lat),
          lng: Number(createForm.lng),
          state: createForm.state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add vehicle");
      }

      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vehicle");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpdate = async (vehicleId: string) => {
    const draft = drafts[vehicleId];
    if (!draft) return;

    setSavingId(vehicleId);
    setError("");

    try {
      const res = await fetch(`/api/operator/vehicles/${vehicleId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: draft.zone,
          batteryLevel: draft.batteryLevel.trim() === "" ? undefined : Number(draft.batteryLevel),
          state: draft.state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update vehicle");
      }

      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vehicle");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    setSavingId(vehicleId);
    setError("");

    try {
      const res = await fetch(`/api/operator/vehicles/${vehicleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove vehicle");
      }

      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove vehicle");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AppShell>
      <div className="relative min-h-screen bg-[#09090b] overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-[1800px] mx-auto px-6 py-10">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Operator</p>
          <h1 className="text-white text-2xl font-bold mb-8">Vehicle Management</h1>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-[11px] text-white/50 mb-4">
              Fill in the vehicle details below. You can click on the map to auto-fill latitude and longitude.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">Vehicle Type</span>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value as VehicleType }))}
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    >
                      {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">Zone Name</span>
                    <select
                      value={createForm.zone}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, zone: e.target.value }))}
                      required
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    >
                      {stations.length === 0 ? (
                        <option value="">No stations available</option>
                      ) : (
                        stations.map((station) => (
                          <option key={station.name} value={station.name}>{station.name}</option>
                        ))
                      )}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">Battery (%)</span>
                    <input
                      value={createForm.batteryLevel}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, batteryLevel: e.target.value }))}
                      placeholder="0 to 100"
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">State</span>
                    <select
                      value={createForm.state}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value as VehicleState }))}
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    >
                      {VEHICLE_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">Latitude</span>
                    <input
                      value={createForm.lat}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, lat: e.target.value }))}
                      placeholder="e.g., 45.508900"
                      required
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/50">Longitude</span>
                    <input
                      value={createForm.lng}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, lng: e.target.value }))}
                      placeholder="e.g., -73.561700"
                      required
                      className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <div className="md:col-span-2 flex justify-center pt-1">
                    <button
                      type="submit"
                      disabled={savingId === "create"}
                      className="w-full md:w-64 h-11 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold uppercase tracking-wider px-8 disabled:opacity-60"
                    >
                      {savingId === "create" ? "Adding..." : "Add Vehicle"}
                    </button>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Location Picker</p>
                    <div className="relative h-84 rounded-lg border border-white/10 bg-[#0a0a0c] overflow-hidden">
                      <LeafletLocationPicker
                        lat={markerLat}
                        lng={markerLng}
                        onSelect={handleMapSelect}
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-white/50">
                      Selected: {createForm.lat}, {createForm.lng}
                    </p>
                    <p className="text-[11px] text-white/40">
                      Tip: drag and zoom naturally on the map, then click any point to set coordinates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="h-full rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-white/50 mb-2">
                    Available Stations
                  </p>

                  {stations.length === 0 ? (
                    <p className="text-[11px] text-white/45">No stations found yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {stations.map((station) => (
                        <div key={station.name} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-white">{station.name}</p>
                            <p className="text-xs text-white/55">
                              {station.available}/{station.total} available
                            </p>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-1">
                            {station.byType.map((entry) => (
                              <span
                                key={`${station.name}-${entry.type}`}
                                className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/75"
                              >
                                {entry.type}: {entry.available}/{entry.total}
                              </span>
                            ))}
                          </div>

                          <p className="mt-1 text-xs text-emerald-300/85">
                            Creatable here: {station.creatableTypes.join(", ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Zone</th>
                  <th className="px-4 py-3 text-left">Battery</th>
                  <th className="px-4 py-3 text-left">State</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                      Loading vehicles...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-white/40">
                      No vehicles yet.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => {
                    const vRating = getRatingForVehicle(vehicle._id);
                    const isExpanded = expandedVehicle === vehicle._id;

                    return (
                      <React.Fragment key={vehicle._id}>
                        <tr className={isExpanded ? "bg-white/[0.02]" : ""}>
                          <td className="px-4 py-3 text-white">{vehicle.type}</td>
                          <td className="px-4 py-3">
                            <input
                              value={drafts[vehicle._id]?.zone ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [vehicle._id]: {
                                    zone: e.target.value,
                                    batteryLevel: prev[vehicle._id]?.batteryLevel ?? "",
                                    state: prev[vehicle._id]?.state ?? vehicle.state,
                                  },
                                }))
                              }
                              className="w-full rounded-md border border-white/10 bg-black/25 px-2 py-1 text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              value={drafts[vehicle._id]?.batteryLevel ?? ""}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [vehicle._id]: {
                                    zone: prev[vehicle._id]?.zone ?? vehicle.zone,
                                    batteryLevel: e.target.value,
                                    state: prev[vehicle._id]?.state ?? vehicle.state,
                                  },
                                }))
                              }
                              className="w-24 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-white"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={drafts[vehicle._id]?.state ?? vehicle.state}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [vehicle._id]: {
                                    zone: prev[vehicle._id]?.zone ?? vehicle.zone,
                                    batteryLevel: prev[vehicle._id]?.batteryLevel ?? String(vehicle.batteryLevel ?? ""),
                                    state: e.target.value as VehicleState,
                                  },
                                }))
                              }
                              className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-white"
                            >
                              {VEHICLE_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleVehicleReviews(vehicle._id)}
                              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/25 px-2.5 py-1 text-xs hover:bg-white/5 transition-colors"
                            >
                              {vRating && vRating.count > 0 ? (
                                <>
                                  <span className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                      <span key={i} className={`text-[10px] ${i <= Math.round(vRating.average) ? "text-amber-400" : "text-white/10"}`}>★</span>
                                    ))}
                                  </span>
                                  <span className="text-white/50 font-mono">{vRating.average}</span>
                                  <span className="text-white/30">({vRating.count})</span>
                                </>
                              ) : (
                                <span className="text-white/30">No reviews</span>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => setLocatedVehicle(vehicle)}
                              className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 hover:bg-violet-500/20"
                            >
                              Locate
                            </button>
                            <button
                              onClick={() => handleUpdate(vehicle._id)}
                              disabled={savingId === vehicle._id}
                              className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => handleDelete(vehicle._id)}
                              disabled={savingId === vehicle._id}
                              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 bg-white/[0.02] border-t border-white/5">
                              {loadingReviews ? (
                                <p className="text-white/30 text-xs">Loading reviews...</p>
                              ) : expandedReviews.length === 0 ? (
                                <p className="text-white/30 text-xs">No reviews yet for this vehicle.</p>
                              ) : (
                                <div className="space-y-3 max-w-xl">
                                  <p className="text-white/50 text-[10px] uppercase tracking-widest">
                                    Reviews ({expandedReviews.length} most recent)
                                  </p>
                                  {expandedReviews.map((review, idx) => (
                                    <div key={idx} className="rounded-md bg-black/30 border border-white/5 px-3 py-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="flex gap-0.5">
                                          {[1, 2, 3, 4, 5].map((i) => (
                                            <span key={i} className={`text-xs ${i <= review.stars ? "text-amber-400" : "text-white/10"}`}>★</span>
                                          ))}
                                        </span>
                                        <span className="text-white/30 text-[10px]">
                                          {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {review.comment && (
                                        <p className="text-white/60 text-xs italic">&ldquo;{review.comment}&rdquo;</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {locatedVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLocatedVehicle(null)}
        >
          <div
            className="w-full max-w-2xl mx-4 rounded-xl border border-white/10 bg-[#0a0a0c] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-white font-semibold text-sm">
                  {locatedVehicle.type} — {locatedVehicle.zone}
                </p>
                <p className="text-white/40 text-[11px] font-mono">
                  {locatedVehicle.location.coordinates[1].toFixed(6)}, {locatedVehicle.location.coordinates[0].toFixed(6)}
                </p>
              </div>
              <button
                onClick={() => setLocatedVehicle(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="h-96">
              <LeafletVehicleLocator
                lat={locatedVehicle.location.coordinates[1]}
                lng={locatedVehicle.location.coordinates[0]}
                vehicleType={locatedVehicle.type}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
