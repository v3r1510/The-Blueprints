"use client";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HourBucket {
  hour: number;
  Car: number;
  Bike: number;
  Scooter: number;
  Parking: number;
}

const VEHICLE_COLORS = {
  Car: "#818cf8",
  Bike: "#34d399",
  Scooter: "#fb923c",
  Parking: "#a78bfa",
};

const formatHour = (hour: number) => {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
};

const tickFormatter = (hour: number) =>
  hour % 3 === 0 ? formatHour(hour) : "";

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
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: p.color }}
          />
          <span className="text-white/70">{p.name}</span>
          <span className="text-white font-semibold ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function UsageChart() {
  const [data, setData] = useState<HourBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch_ = () => {
      fetch("/api/analytics/usage-today")
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

  const hasAnyData = data.some(
    (d) => d.Car > 0 || d.Bike > 0 || d.Scooter > 0 || d.Parking > 0,
  );

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">
            Mobility Usage
          </p>
          <p className="text-white/30 text-xs">
            Trips started today · by vehicle type
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4">
          {Object.entries(VEHICLE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: color }}
              />
              <span className="text-white/50 text-xs">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="h-full w-full rounded-lg bg-white/5 animate-pulse" />
        </div>
      ) : error ? (
        <div className="h-52 flex items-center justify-center">
          <p className="text-red-400 text-xs">Failed to load usage data</p>
        </div>
      ) : !hasAnyData ? (
        <div className="h-52 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">🛴</span>
          <p className="text-white/30 text-xs">No trips started today yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={data}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tickFormatter={tickFormatter}
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
            {Object.entries(VEHICLE_COLORS).map(([type, color]) => (
              <Line
                key={type}
                type="monotone"
                dataKey={type}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}