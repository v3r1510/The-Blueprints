import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { authConfig } from "@/lib/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        // Only return standard fields — custom fields like role are NOT
        // reliably passed through by Auth.js v5; we fetch them in jwt callback
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Re-fetch from DB if:
      // 1. First sign-in (user object present), OR
      // 2. Old token that hasn't been verified yet (no roleVerified flag)
      // This corrects stale roles without requiring sign-out
      const needsVerification = !!user || !token.roleVerified;

      if (needsVerification) {
        const userId = user?.id ?? token.sub;
        if (userId) {
          await connectDB();
          const dbUser = await User.findById(userId).lean() as { role?: string } | null;
          token.id = userId;
          token.role = (dbUser?.role ?? "rider") as "rider" | "operator" | "admin";
          token.roleVerified = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "rider" | "operator" | "admin";
      return session;
    },
  },
});
