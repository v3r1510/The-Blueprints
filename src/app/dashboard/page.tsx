"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else setError("Failed to load users");
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
          <Link
            href="/register"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Add User
          </Link>
        </div>

        {loading && <p className="text-gray-500">Loading users...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && users.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No users yet.</p>
            <Link href="/register" className="text-blue-600 hover:underline mt-2 inline-block">
              Register the first user
            </Link>
          </div>
        )}

        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 border-t">
              {users.length} user{users.length !== 1 ? "s" : ""} total
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
