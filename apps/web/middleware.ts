import { NextRequest, NextResponse } from "next/server";

import { API_URL } from "./lib/api";

const PROTECTED_ROUTES = ["/home", "/opportunities", "/saved", "/profile", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Better Auth sets the session cookie as "better-auth.session_token"
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Validate the session token against the API
  try {
    const response = await fetch(`${API_URL}/api/auth/get-session`, {
      headers: {
        cookie: `better-auth.session_token=${sessionToken}`,
      },
    });

    if (!response.ok) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }

    const session = await response.json() as { user?: unknown } | null;

    if (!session?.user) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  } catch {
    // If the session check fails (e.g. API unreachable), block access
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/opportunities/:path*", "/saved/:path*", "/profile/:path*", "/settings/:path*"],
};
