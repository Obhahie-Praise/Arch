/**
 * Centralised API base URL for use across the web application.
 *
 * In local development this defaults to the Wrangler dev server.
 * In production, NEXT_PUBLIC_API_URL must be set to the deployed Worker URL.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
