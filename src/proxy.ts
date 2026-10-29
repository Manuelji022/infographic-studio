import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/s" ||
    pathname.startsWith("/s/") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/file.svg" ||
    pathname === "/globe.svg" ||
    pathname === "/next.svg" ||
    pathname === "/vercel.svg" ||
    pathname === "/window.svg" ||
    pathname.startsWith("/fonts/");

  if (isPublic || getSessionCookie(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/", "/:path*"] };
