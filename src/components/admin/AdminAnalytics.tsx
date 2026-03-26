"use client";
import { useEffect, useState } from "react";
import UsageChart from "./UsageChart";

interface StatCard {
  label: string;
  value: number | string | null;
  icon: string;
  accent: string;
  description: string;
  loading: boolean;
}

interface PaymentStats {
  successCount: number;
  failureCount: number;
  successRate: number;
  total: number;
}

interface RevenueStats {
  vehicleTrips: number;
  parkingTrips: number;
  totalRevenue: number;
  tripCount: number;
}

export default function AdminAnalytics() {
  const [activeRentals, setActiveRentals] = useState<number | null>(null);
  const [loadingRentals, setLoadingRentals] = useState(true);

  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  useEffect(() => {
    const fetch_ = () => {
      setLoadingRentals(true);
      fetch("/api/analytics/active-rentals")
        .then((r) => r.json())
        .then((data) => setActiveRentals(data.activeRentals ?? 0))
        .catch(() => setActiveRentals(null))
        .finally(() => setLoadingRentals(false));
    };
    fetch_();
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetch_ = () => {
      setLoadingPayments(true);
      fetch("/api/analytics/payment-stats")
        .then((r) => r.json())
        .then((data) => setPaymentStats(data))
        .catch(() => setPaymentStats(null))
        .finally(() => setLoadingPayments(false));
    };
    fetch_();
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetch_ = () => {
      setLoadingRevenue(true);
      fetch("/api/analytics/revenue-today")
        .then((r) => r.json())
        .then((data) => setRevenueStats(data))
        .catch(() => setRevenueStats(null))
        .finally(() => setLoadingRevenue(false));
    };
    fetch_();
    const interval = setInterval(fetch_, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Add future metrics here -----------
  const stats: StatCard[] = [
    {
      label: "Active Rentals",
      value: activeRentals,
      icon: "🔑",
      accent: "border-emerald-500/30 text-emerald-400",
      description: "Trips currently in Reserved or Active state",
      loading: loadingRentals,
    },
    {
      label: "Payment Success Rate",
      value: paymentStats !== null ? `${paymentStats.successRate}%` : null,
      icon: "💳",
      accent: "border-blue-500/30 text-blue-400",
      description: paymentStats
        ? `${paymentStats.successCount} completed · ${paymentStats.failureCount} rejected`
        : "Completed vs rejected payments",
      loading: loadingPayments,
    },
    {
      label: "Revenue Today",
      value: revenueStats !== null ? `$${revenueStats.totalRevenue.toFixed(2)}` : null,
      icon: "💰",
      accent: "border-amber-500/30 text-amber-400",
      description: revenueStats
        ? `🚲 ${revenueStats.vehicleTrips} rental${revenueStats.vehicleTrips !== 1 ? "s" : ""} · 🅿️ ${revenueStats.parkingTrips} parking`
        : "Vehicle rentals + parking sessions",
      loading: loadingRevenue,
    },
  ];
  // ---------------

  return (
    <div className="mb-8">
      <h2 className="text-white/70 text-xs uppercase tracking-widest mb-4">
        Platform Analytics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <UsageChart />
    </div>
  );
}

function StatCard({ stat }: { stat: StatCard }) {
  return (
    <div
      className={`relative rounded-xl border bg-white/5 p-5 overflow-hidden transition-all hover:bg-white/[0.07] ${stat.accent.split(" ")[0]}`}
    >
      <div
        className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, currentColor 0%, transparent 70%)" }}
      />

      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{stat.icon}</span>
        {!stat.loading && stat.value !== null && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border bg-white/5 ${stat.accent}`}
          >
            live
          </span>
        )}
      </div>
      <div className="mb-1">
        {stat.loading ? (
          <div className="h-8 w-12 rounded-md bg-white/10 animate-pulse" />
        ) : stat.value === null ? (
          <span className="text-red-400 text-xs">Unavailable</span>
        ) : (
          <span className={`text-3xl font-bold tabular-nums ${stat.accent.split(" ")[1]}`}>
            {stat.value}
          </span>
        )}
      </div>

      <p className="text-white font-semibold text-sm mb-0.5">{stat.label}</p>
      <p className="text-white/40 text-xs leading-snug">{stat.description}</p>
    </div>
  );
}