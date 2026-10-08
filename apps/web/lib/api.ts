/**
 * Centralised API base URL for use across the web application.
 *
 * In local development this defaults to the Wrangler dev server.
 * In production, NEXT_PUBLIC_API_URL must be set to the deployed Worker URL.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

/**
 * Public URL of the web application itself.
 *
 * Used to construct absolute OAuth callbackURLs. Better Auth runs on the
 * API domain (workers.dev) and resolves a relative callbackURL against its
 * own baseURL — which would redirect the user to the API domain rather than
 * back to the frontend. An absolute URL avoids this entirely.
 *
 * In local development this defaults to the Next.js dev server.
 * In production, NEXT_PUBLIC_APP_URL must be set to the deployed frontend URL.
 */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
