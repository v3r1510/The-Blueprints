"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const FUND_OPTIONS = [
  { label: "$10", priceEnvKey: "STRIPE_PRICE_10", priceId: "" },
  { label: "$25", priceEnvKey: "STRIPE_PRICE_25", priceId: "" },
  { label: "$50", priceEnvKey: "STRIPE_PRICE_50", priceId: "" },
];

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  operator: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rider: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);
  const [priceIds, setPriceIds] = useState<{ p10: string; p25: string; p50: string } | null>(null);

  const success = searchParams.get("success") === "true";
  const cancelled = searchParams.get("cancelled") === "true";

  useEffect(() => {
    fetch("/api/user/balance")
      .then((res) => res.json())
      .then((data) => setBalance(data.balance ?? 0))
      .catch(() => setBalance(0));
  }, [success]);

  useEffect(() => {
    fetch("/api/stripe/prices")
      .then((res) => res.json())
      .then((data) => setPriceIds(data))
      .catch(() => {});
  }, []);

  const handleAddFunds = async (priceId: string) => {
    setLoadingPrice(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: " + (data.error ?? "Could not create checkout session"));
        setLoadingPrice(null);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoadingPrice(null);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-white/40 text-sm">Loading...</p>
      </main>
    );
  }

  const role = session?.user?.role ?? "rider";

  return (
    <AppShell>
        <div
          className="animate-float-a pointer-events-none absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />
        <div
          className="animate-float-b pointer-events-none absolute -bottom-40 -right-24 w-150 h-150 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-xl mx-auto px-6 py-10">
          <div className="mb-10">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
              Account
            </p>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
          </div>

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 animate-in fade-in duration-300">
            <p className="text-emerald-400 text-sm font-semibold">
              Payment successful! Your funds have been added.
            </p>
          </div>
        )}

        {cancelled && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 animate-in fade-in duration-300">
            <p className="text-amber-400 text-sm font-semibold">
              Payment cancelled. No charges were made.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-white/60">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-semibold text-sm">
                  {session?.user?.name}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${ROLE_BADGE[role]}`}
                >
                  {role}
                </span>
              </div>
              <p className="text-white/50 text-xs">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-white/50 text-[10px] uppercase tracking-widest mb-2">
            Account Balance
          </p>
          <p className="text-4xl font-mono font-bold text-white">
            {balance !== null ? (
              <>${balance.toFixed(2)}</>
            ) : (
              <span className="text-white/20">--</span>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-white/50 text-[10px] uppercase tracking-widest mb-4">
            Add Funds
          </p>
          <div className="grid grid-cols-3 gap-3">
            {priceIds && [
              { label: "$10", priceId: priceIds.p10 },
              { label: "$25", priceId: priceIds.p25 },
              { label: "$50", priceId: priceIds.p50 },
            ].map((option) => (
              <button
                key={option.priceId}
                onClick={() => handleAddFunds(option.priceId)}
                disabled={!!loadingPrice}
                className={`py-4 rounded-xl border text-sm font-bold transition-all ${
                  loadingPrice === option.priceId
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-white/5 border-white/10 text-white hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300"
                } disabled:opacity-50`}
              >
                {loadingPrice === option.priceId ? "Redirecting..." : option.label}
              </button>
            ))}
          </div>
          <p className="text-white/30 text-[10px] mt-3 text-center">
            Securely processed by Stripe
          </p>
          </div>
        </div>
    </AppShell>
  );
}
