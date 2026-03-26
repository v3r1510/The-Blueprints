"use client";

import AppShell from "@/components/AppShell";
import ParkingDiscovery from "../rider/ParkingDiscovery";

export default function ParkingPage() {
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

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Parking</p>
        <h1 className="text-2xl font-bold text-white mb-8">Find &amp; reserve a lot</h1>

        <ParkingDiscovery />
      </div>
    </AppShell>
  );
}
