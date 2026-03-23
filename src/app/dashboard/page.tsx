"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  admin:    "bg-violet-500/20 text-violet-300 border-violet-500/30",
  operator: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rider:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const ROLE_INFO: Record<string, { icon: string; description: string }> = {
  rider:    { icon: "🚲", description: "Search and reserve mobility services across Montréal." },
  operator: { icon: "🚌", description: "Manage your fleet and update vehicle statuses." },
  admin:    { icon: "🛡️", description: "Full platform access — users, analytics, and settings." },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [error, setError] = useState("");

  const role = session?.user?.role ?? "rider";
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else throw new Error("Unexpected response");
      })
      .catch(() => {
        setError("Failed to load users");
        setUsers([]);
      });
  }, [isAdmin]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-white/40 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#09090b] overflow-hidden">

      {/* Background orbs */}
      <div
        className="animate-float-a pointer-events-none absolute -top-32 -left-32 w-125 h-125 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
      />
      <div
        className="animate-float-b pointer-events-none absolute -bottom-40 -right-24 w-150 h-150 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">The Blueprints</p>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/register"
                className="btn-shimmer px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02]"
              >
                + Add User
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white/60 border border-white/10 hover:border-white/20 hover:text-white/90 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Role card */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6 flex items-center gap-5">
          <span className="text-4xl">{ROLE_INFO[role]?.icon}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-semibold text-sm">{session?.user?.name}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[role]}`}>
                {role}
              </span>
            </div>
            <p className="text-white/50 text-sm">{session?.user?.email}</p>
            <p className="text-white/40 text-xs mt-1">{ROLE_INFO[role]?.description}</p>
          </div>
        </div>

        {/* Admin: user management table */}
        {isAdmin && (
          <div>
            <h2 className="text-white/70 text-xs uppercase tracking-widest mb-4">All Users</h2>

            {users === null && !error && <p className="text-white/40 text-sm">Loading users...</p>}
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            {users !== null && !error && users.length === 0 && (
              <p className="text-white/40 text-sm">No users found.</p>
            )}

            {users !== null && users.length > 0 && (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{user.name}</td>
                        <td className="px-6 py-4 text-white/60">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[user.role] ?? ROLE_BADGE.rider}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/40 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-3 border-t border-white/5 bg-white/5 text-xs text-white/30">
                  {users.length} user{users.length !== 1 ? "s" : ""} total
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operator placeholder */}
        {role === "operator" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Manage Fleet", "Update Vehicle Status"].map((action) => (
              <div key={action} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-white font-semibold text-sm mb-1">{action}</p>
                <p className="text-white/40 text-xs">Coming soon</p>
              </div>
            ))}
          </div>
        )}

        {/* Rider placeholder */}
        {role === "rider" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Search Vehicles", "My Trips", "My Wallet", "Reserve a Vehicle"].map((action) => (
              <div key={action} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <p className="text-white font-semibold text-sm mb-1">{action}</p>
                <p className="text-white/40 text-xs">Coming soon</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
