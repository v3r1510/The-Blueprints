import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#09090b] flex flex-col items-center justify-center overflow-hidden px-6">

      {/* ── Background orbs ── */}
      <div
        className="animate-float-a pointer-events-none absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />
      <div
        className="animate-float-b pointer-events-none absolute -bottom-40 -right-24 w-150 h-150 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full gap-6">

        {/* Badge */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/75 backdrop-blur-sm">
            <span
              className="h-1.5 w-1.5 rounded-full bg-violet-400 inline-block"
              style={{ boxShadow: "0 0 6px #a78bfa" }}
            />
            Smart Urban Mobility · Montréal
          </span>
        </div>

        {/* Headline */}
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-none">
            <span className="gradient-text">The Blueprints</span>
          </h1>
        </div>

        {/* Subtext */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm font-light">
            Connected mobility intelligence for the Greater Montréal Area.
          </p>
        </div>

        {/* CTA */}
        <div
          className="animate-fade-in-up flex flex-col items-center gap-4 w-full mt-2"
          style={{ animationDelay: "320ms" }}
        >
          <Link
            href="/login"
            className="btn-shimmer relative w-full max-w-xs rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-violet-500/40 active:scale-[0.98]"
          >
            Sign in <span className="ml-1">→</span>
          </Link>

          <p className="text-sm text-white/60">
            New here?{" "}
            <Link
              href="/register"
              className="text-violet-400 hover:text-violet-300 transition-colors duration-200 underline underline-offset-4 decoration-violet-400/40 hover:decoration-violet-300"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
