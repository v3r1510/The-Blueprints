import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const ROLE_ROUTES: Record<string, string[]> = {
  "/admin":    ["admin"],
  "/operator": ["admin", "operator"],
  "/rider":    ["admin", "rider"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  // Not logged in — send to login (except auth pages)
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Already logged in — send away from auth pages
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Role-based protection
  if (isLoggedIn && role) {
    for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(prefix) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/operator/:path*",
    "/rider/:path*",
    "/login",
    "/register",
  ],
};
