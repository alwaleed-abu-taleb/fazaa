import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Edge-safe Auth.js config — imported by middleware.ts.
 * Must NOT import anything that pulls in Prisma or bcrypt (no DB on the edge).
 * The Credentials provider is added in src/server/auth.ts.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/profile"];
const PROTECTED_EXACT = ["/events/new", "/verify"];
const AUTH_PAGES = ["/login", "/register"];

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  // Real providers (Credentials + bcrypt + Prisma) are added in src/server/auth.ts —
  // they must never load on the edge where this config runs.
  providers: [],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      if (AUTH_PAGES.includes(pathname)) {
        return isLoggedIn
          ? NextResponse.redirect(new URL("/dashboard", request.nextUrl))
          : true;
      }

      const isProtected =
        PROTECTED_EXACT.includes(pathname) ||
        PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
      if (isProtected) return isLoggedIn; // false → redirect to /login?callbackUrl=…

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
