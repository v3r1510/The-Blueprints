"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HourBucket {
  hour: number;
  success: number;
  failure: number;
}

const COLORS = { success: "#34d399", failure: "#f87171" };

const formatHour = (hour: number) => {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f0f13] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-white/50 text-xs mb-1">{formatHour(label ?? 0)}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-white/70 capitalize">{p.name}</span>
          <span className="text-white font-semibold ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function GatewayVolumeChart() {
  const [data, setData] = useState<HourBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch_ = () => {
      fetch("/api/analytics/gateway-volume")
        .then((r) => r.json())
        .then((res) => {
          if (res.data) setData(res.data);
          else setError(true);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    };
    fetch_();
    const interval = setInterval(fetch_, 30_000);
    return () => clearInterval(interval);
  }, []);

  const hasData = data.some((d) => d.success > 0 || d.failure > 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">
            Gateway Call Volume
          </p>
          <p className="text-white/30 text-xs">
            STM API calls today · success vs failure by hour
          </p>
        </div>
        <div className="flex gap-4">
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-white/50 text-xs capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="h-full w-full rounded-lg bg-white/5 animate-pulse" />
        </div>
      ) : error ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-red-400 text-xs">Failed to load gateway volume data</p>
        </div>
      ) : !hasData ? (
        <div className="h-52 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🌐</span>
          <p className="text-white/30 text-xs">No gateway calls recorded today — visit the Transit page to generate data.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={(h) => (h % 3 === 0 ? formatHour(h) : "")}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
            <Line type="monotone" dataKey="success" stroke={COLORS.success} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Line type="monotone" dataKey="failure" stroke={COLORS.failure} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
