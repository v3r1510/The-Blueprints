import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="relative min-h-screen bg-[#09090b] flex items-center justify-center overflow-hidden px-6">

      <div
        className="animate-float-a pointer-events-none absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)" }}
      />
      <div
        className="animate-float-b pointer-events-none absolute -bottom-40 -right-24 w-150 h-150 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />

      <div className="animate-fade-in-up relative z-10 text-center max-w-sm">
        <p className="text-5xl mb-6">🚫</p>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/50 text-sm mb-8">
          You don&apos;t have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="btn-shimmer inline-block rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
