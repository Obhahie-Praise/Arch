import { NextRequest, NextResponse } from "next/server";

/**
 * Route protection for Arch.
 *
 * The frontend (vercel.app) and API (workers.dev) are on different domains.
 * Better Auth sets the session cookie on the API domain (workers.dev). When the
 * browser navigates to the frontend, it does not include the workers.dev cookie
 * in the request — cookies are scoped to the domain that set them.
 *
 * A server-side cookie check in Next.js middleware therefore always sees an
 * empty cookie jar for authenticated users, which caused every navigation to a
 * protected route to redirect to /signin regardless of actual session state.
 *
 * Session validation is handled client-side in the dashboard layout using
 * authClient.useSession(), which makes a credentialed fetch back to the API
 * (workers.dev) and correctly receives the session cookie. Unauthenticated
 * users are redirected to /signin from there.
 *
 * This middleware still handles:
 * - Redirecting already-authenticated users away from /signin and /auth when
 *   the session is known (this is not yet possible without server-side cookies,
 *   so these routes are simply passed through and the pages handle it).
 * - All other non-protected routes pass through unconditionally.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes except:
   * - _next/static  (Next.js static files)
   * - _next/image   (Next.js image optimisation)
   * - favicon.ico
   * - public files  (images, fonts, etc.)
   *
   * Keeping the matcher narrow avoids running the middleware on every asset
   * request while still covering all application routes if the implementation
   * needs to expand in the future.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf)$).*)",
  ],
};
