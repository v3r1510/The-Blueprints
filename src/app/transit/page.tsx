"use client";

import AppShell from "@/components/AppShell";

export default function TransitPage() {
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
            <h1 className="text-2xl font-bold text-white mb-10">
              Transit Routes & Schedules
            </h1>

            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-violet-400">
                  <rect x="3" y="3" width="18" height="14" rx="2" />
                  <path d="M3 10h18M7 21l2-4M17 21l-2-4M8 7h0M16 7h0" />
                </svg>
              </div>
              <h2 className="text-white font-semibold text-lg mb-2">Under Construction</h2>
              <p className="text-white/40 text-sm text-center max-w-sm">
                Public transit integration is coming soon. You&apos;ll be able to view routes, schedules, and plan multi-modal trips.
              </p>
            </div>
          </div>
    </AppShell>
  );
}
