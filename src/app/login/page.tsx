"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-[#09090b] flex items-center justify-center overflow-hidden px-6">

      {/* Background orbs */}
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

      {/* Card */}
      <div className="animate-fade-in-up relative z-10 w-full max-w-sm">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8"
        >
          ← The Blueprints
        </Link>

        <h1 className="text-3xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-white/60 text-sm mb-8">Sign in to your account to continue.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-violet-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <p className="text-sm text-white/50 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-4 decoration-violet-400/40">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
