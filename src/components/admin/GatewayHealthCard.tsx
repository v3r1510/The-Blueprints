"use client";
import { useEffect, useState } from "react";

interface GatewayHealth {
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgLatencyMs: number;
}

interface MiniStat {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

export default function GatewayHealthCard() {
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = () => {
      setLoading(true);
      fetch("/api/analytics/gateway-health")
        .then((r) => r.json())
        .then((data) => setHealth(data))
        .catch(() => setHealth(null))
        .finally(() => setLoading(false));
    };
    fetch_();
    const interval = setInterval(fetch_, 15_000);
    return () => clearInterval(interval);
  }, []);

  const miniStats: MiniStat[] = health
    ? [
        {
          label: "Success Rate",
          value: `${health.successRate}%`,
          sub: `${health.successCount} ok · ${health.failureCount} failed`,
          color:
            health.successRate >= 90
              ? "text-emerald-400"
              : health.successRate >= 70
              ? "text-amber-400"
              : "text-red-400",
        },
        {
          label: "Total Calls",
          value: health.totalCalls,
          sub: "STM API requests",
          color: "text-indigo-400",
        },
        {
          label: "Avg Latency",
          value: `${health.avgLatencyMs}ms`,
          sub:
            health.avgLatencyMs < 500
              ? "fast"
              : health.avgLatencyMs < 1500
              ? "moderate"
              : "slow",
          color:
            health.avgLatencyMs < 500
              ? "text-emerald-400"
              : health.avgLatencyMs < 1500
              ? "text-amber-400"
              : "text-red-400",
        },
      ]
    : [];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">
            Transit Gateway Health
          </p>
          <p className="text-white/30 text-xs">Live STM API call statistics</p>
        </div>
        {!loading && health && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30 bg-white/5 text-indigo-400">
            live
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : health === null ? (
        <p className="text-red-400 text-xs">Failed to load gateway health data</p>
      ) : health.totalCalls === 0 ? (
        <p className="text-white/30 text-xs">No STM API calls recorded yet — visit the Transit page to generate data.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {miniStats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-white/8 bg-white/5 px-4 py-3"
            >
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-white text-xs font-semibold mt-0.5">{s.label}</p>
              {s.sub && (
                <p className="text-white/35 text-xs mt-0.5">{s.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
