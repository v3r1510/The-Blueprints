"use client";

import AppShell from "@/components/AppShell";
import { useState, useEffect, useCallback } from "react";

interface Vehicle {
  vehicleId: string;
  label: string;
  routeId: string;
  tripId: string;
  directionId: number;
  nextStopDeparture: number;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  stopSequence: number;
  stopId: string;
  status: string;
  timestamp: number;
  occupancy: string;
}

interface RouteData {
  routeId: string;
  activeBuses: number;
  vehicles: Vehicle[];
}

interface TransitResponse {
  timestamp: number;
  totalVehicles: number;
  totalRoutes: number;
  routes: RouteData[];
}

const STATUS_COLORS: Record<string, string> = {
  IN_TRANSIT_TO: "text-emerald-400",
  STOPPED_AT: "text-amber-400",
  INCOMING_AT: "text-sky-400",
};

const STATUS_DOT: Record<string, string> = {
  IN_TRANSIT_TO: "bg-emerald-400",
  STOPPED_AT: "bg-amber-400",
  INCOMING_AT: "bg-sky-400",
};

const STATUS_LABELS: Record<string, string> = {
  IN_TRANSIT_TO: "In Transit",
  STOPPED_AT: "Stopped",
  INCOMING_AT: "Arriving",
};

const OCCUPANCY_LABELS: Record<string, string> = {
  EMPTY: "Empty",
  MANY_SEATS_AVAILABLE: "Many Seats",
  FEW_SEATS_AVAILABLE: "Few Seats",
  STANDING_ROOM_ONLY: "Standing Only",
  CRUSHED_STANDING_ROOM_ONLY: "Very Crowded",
  FULL: "Full",
  NOT_ACCEPTING_PASSENGERS: "Not Boarding",
};

const OCCUPANCY_COLORS: Record<string, string> = {
  EMPTY: "text-emerald-400",
  MANY_SEATS_AVAILABLE: "text-emerald-400",
  FEW_SEATS_AVAILABLE: "text-amber-400",
  STANDING_ROOM_ONLY: "text-orange-400",
  CRUSHED_STANDING_ROOM_ONLY: "text-red-400",
  FULL: "text-red-500",
  NOT_ACCEPTING_PASSENGERS: "text-red-500",
};

function timeAgo(unix: number): string {
  if (!unix) return "";
  const seconds = Math.floor(Date.now() / 1000 - unix);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function BusIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 21l2-4M17 21l-2-4M8 7h0M16 7h0" />
    </svg>
  );
}

function RouteCard({
  route,
  expanded,
  onToggle,
}: {
  route: RouteData;
  expanded: boolean;
  onToggle: () => void;
}) {
  const inTransit = route.vehicles.filter((v) => v.status === "IN_TRANSIT_TO").length;
  const stopped = route.vehicles.filter((v) => v.status === "STOPPED_AT").length;
  const arriving = route.vehicles.filter((v) => v.status === "INCOMING_AT").length;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <span className="text-violet-300 font-bold text-lg">{route.routeId}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Bus {route.routeId}</span>
            <span className="text-white/20 text-xs">STM Bus</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-white/50 text-xs flex items-center gap-1">
              <BusIcon className="w-3.5 h-3.5" />
              {route.activeBuses} active
            </span>
            {inTransit > 0 && (
              <span className="text-emerald-400/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {inTransit} moving
              </span>
            )}
            {stopped > 0 && (
              <span className="text-amber-400/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                {stopped} stopped
              </span>
            )}
            {arriving > 0 && (
              <span className="text-sky-400/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                {arriving} arriving
              </span>
            )}
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 text-white/30 transition-transform duration-200 shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4">
          <div className="grid grid-cols-1 gap-2 mt-3">
            {route.vehicles
              .sort((a, b) => {
                const statusOrder: Record<string, number> = { IN_TRANSIT_TO: 0, INCOMING_AT: 1, STOPPED_AT: 2 };
                return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
              })
              .map((v) => (
                <div
                  key={v.vehicleId}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[v.status] ?? "bg-white/30"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-xs font-medium">
                        Bus {v.label || v.vehicleId}
                      </span>
                      <span className={`text-[10px] ${STATUS_COLORS[v.status] ?? "text-white/30"}`}>
                        {STATUS_LABELS[v.status] ?? v.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {v.speed > 0 && (
                        <span className="text-white/30 text-[10px]">
                          {Math.round(v.speed * 3.6)} km/h
                        </span>
                      )}
                      {v.stopId && (
                        <span className="text-white/30 text-[10px]">
                          Stop {v.stopId}
                        </span>
                      )}
                      {v.nextStopDeparture > 0 && (
                        <span className="text-white/30 text-[10px]">
                          Dep. {new Date(v.nextStopDeparture * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {v.occupancy && v.occupancy !== "EMPTY" && v.occupancy !== "UNKNOWN" && (
                        <span className={`text-[10px] ${OCCUPANCY_COLORS[v.occupancy] ?? "text-white/30"}`}>
                          {OCCUPANCY_LABELS[v.occupancy] ?? v.occupancy}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-white/20 text-[10px] shrink-0">
                    {timeAgo(v.timestamp)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransitPage() {
  const [data, setData] = useState<TransitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/transit");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TransitResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const toggleRoute = (routeId: string) => {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  };

  const filteredRoutes = data?.routes.filter((r) =>
    r.routeId.includes(search.trim())
  ) ?? [];

  return (
    <AppShell>
      <div
        className="animate-float-a pointer-events-none absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />
      <div
        className="animate-float-b pointer-events-none absolute -bottom-40 -right-24 w-150 h-150 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
          Public Transit
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">
          STM Bus Schedules
        </h1>
        <p className="text-white/40 text-sm mb-8">
          Real-time bus positions and schedules from the Soci&eacute;t&eacute; de transport de Montr&eacute;al
        </p>

        {/* Stats Bar */}
        {data && !loading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <p className="text-white/30 text-[10px] uppercase tracking-wider">Active Buses</p>
              <p className="text-white font-bold text-xl mt-0.5">{data.totalVehicles}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <p className="text-white/30 text-[10px] uppercase tracking-wider">Bus Lines</p>
              <p className="text-white font-bold text-xl mt-0.5">{data.totalRoutes}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <p className="text-white/30 text-[10px] uppercase tracking-wider">Last Updated</p>
              <p className="text-white font-bold text-sm mt-1">
                {lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "—"}
              </p>
            </div>
          </div>
        )}

        {/* Search + Controls */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by bus number (e.g. 24, 55, 80)"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
            className={`p-2.5 rounded-lg border transition-all ${
              autoRefresh
                ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                : "bg-white/[0.03] border-white/[0.08] text-white/40"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              {autoRefresh ? (
                <>
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </>
              ) : (
                <>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </>
              )}
            </svg>
          </button>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            disabled={loading}
            className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/15 transition-all disabled:opacity-40"
            title="Refresh now"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}>
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>

        {/* Loading State */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mb-4" />
            <p className="text-white/40 text-sm">Loading STM bus data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !data && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">Unable to load transit data</p>
            <p className="text-white/40 text-sm mb-4">{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); fetchData(); }}
              className="px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-300 text-sm hover:bg-violet-500/25 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Route List */}
        {data && (
          <>
            {filteredRoutes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <BusIcon className="w-10 h-10 text-white/15 mb-3" />
                <p className="text-white/40 text-sm">
                  {search ? `No bus numbers matching "${search}"` : "No active buses at the moment"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {search === "" && (
                  <p className="text-white/25 text-xs mb-3">
                    Showing all {filteredRoutes.length} active bus lines &middot; Click a bus number to see individual buses
                  </p>
                )}
                {filteredRoutes.map((route) => (
                  <RouteCard
                    key={route.routeId}
                    route={route}
                    expanded={expandedRoutes.has(route.routeId)}
                    onToggle={() => toggleRoute(route.routeId)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
