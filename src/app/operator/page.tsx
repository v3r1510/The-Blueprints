"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";

type VehicleType = "Car" | "Bike" | "Scooter";
type VehicleState = "Available" | "Reserved" | "InUse" | "Maintenance";

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

const VEHICLE_TYPES: VehicleType[] = ["Car", "Bike", "Scooter"];
const VEHICLE_STATES: VehicleState[] = [
  "Available",
  "Reserved",
  "InUse",
  "Maintenance",
];

export default function OperatorPage() {
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  const loadVehicles = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/operator/vehicles", { credentials: "include" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load vehicles");
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

  useEffect(() => {
    loadVehicles();
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

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
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
              Fill in the vehicle details below. Coordinates use decimal GPS format.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
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
                <input
                  value={createForm.zone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, zone: e.target.value }))}
                  placeholder="e.g., Downtown"
                  required
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
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
                <span className="text-[10px] uppercase tracking-wider text-white/50">Latitude</span>
                <input
                  value={createForm.lat}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lat: e.target.value }))}
                  placeholder="e.g., 45.5089"
                  required
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wider text-white/50">Longitude</span>
                <input
                  value={createForm.lng}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, lng: e.target.value }))}
                  placeholder="e.g., -73.5617"
                  required
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={savingId === "create"}
                  className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold uppercase tracking-widest px-4 py-2 disabled:opacity-60"
                >
                  {savingId === "create" ? "Adding..." : "Add Vehicle"}
                </button>
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
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                      Loading vehicles...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/40">
                      No vehicles yet.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
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
                      <td className="px-4 py-3 flex gap-2">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
