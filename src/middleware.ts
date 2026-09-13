import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Skip the auth API routes themselves, Next internals and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
