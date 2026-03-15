"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

const ROLES = [
  { value: "rider", label: "Rider", description: "Search and reserve mobility services" },
  { value: "operator", label: "Operator", description: "Manage fleet and vehicle status" },
  { value: "admin", label: "Admin", description: "Full platform access and analytics" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "rider" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong");
      return;
    }

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      setError("Registered but could not sign in. Please log in manually.");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="relative min-h-screen bg-[#09090b] flex items-center justify-center overflow-hidden px-6 py-12">

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

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8"
        >
          ← The Blueprints
        </Link>

        <h1 className="text-3xl font-bold text-white mb-1">Create an account</h1>
        <p className="text-white/60 text-sm mb-8">Join the platform to get started.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              required
              maxLength={100}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              maxLength={64}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
              Role
            </label>
            <div className="flex flex-col gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                    form.role === r.value
                      ? "border-violet-500/60 bg-violet-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                      form.role === r.value ? "border-violet-400" : "border-white/30"
                    }`}
                  >
                    {form.role === r.value && (
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 block" />
                    )}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{r.label}</span>
                    <span className="block text-xs text-white/40 mt-0.5">{r.description}</span>
                  </span>
                </button>
              ))}
            </div>
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
            {loading ? "Creating account..." : "Create account →"}
          </button>
        </form>

        <p className="text-sm text-white/50 mt-6 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-4 decoration-violet-400/40">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
