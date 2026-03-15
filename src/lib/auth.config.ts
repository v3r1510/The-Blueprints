import type { NextAuthConfig } from "next-auth";

// Lightweight config used by the proxy (edge-safe — no mongoose/bcrypt)
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
