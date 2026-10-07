import { betterAuth } from "better-auth";

export interface Env {
  arch_db: D1Database;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AI?: any;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  /** The primary production frontend URL (e.g. https://arch-eight-orcin.vercel.app). Used by CORS and Better Auth trustedOrigins. */
  APP_URL?: string;
  /** Comma-separated list of additional allowed origins (e.g. legacy Cloudflare frontend, other dev deployments). Not a secret. */
  ADDITIONAL_ORIGINS?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  /** Secret that must be supplied by callers of /api/internal/* endpoints. */
  INTERNAL_ENGINE_SECRET?: string;
  /** Developer account email — grants access to the full matched result set without the weekly quota cap. Evaluated server-side only; never exposed to clients.
   * @deprecated Use DEVELOPER_ACCESS_EMAILS (plural, comma-separated) instead. Both are supported for backward compatibility.
   */
  DEVELOPER_ACCESS_EMAIL?: string;
  /**
   * Comma-separated list of developer account emails. Takes precedence over DEVELOPER_ACCESS_EMAIL
   * when both are set. Evaluated server-side only; never exposed to clients.
   *
   * Example: DEVELOPER_ACCESS_EMAILS=me@example.com,friend@example.com
   */
  DEVELOPER_ACCESS_EMAILS?: string;
  /** Required for web-search discovery via Tavily. */
  TAVILY_API_KEY?: string;
  /** UploadThing API token — used for profile avatar and resume uploads. Never expose to the client. */
  UPLOADTHING_TOKEN?: string;
  /** Set to 'production' in deployed environment. */
  ENVIRONMENT?: string;
}

export const createAuth = (env: Env) =>
  betterAuth({
    database: env.arch_db,

    secret: env.BETTER_AUTH_SECRET,

    // The full origin of the API Worker — e.g. https://api.obhahiepraise.workers.dev
    // Better Auth uses this to construct callback URLs for OAuth providers.
    baseURL: env.BETTER_AUTH_URL,

    // All auth endpoints live under /api/auth (the default).
    // Explicit here so it is clear and cannot drift.
    basePath: "/api/auth",

    // Allow requests from the frontend origin in addition to local dev origins.
    // APP_URL is the primary production origin (Vercel).
    // ADDITIONAL_ORIGINS is a comma-separated list of extra trusted origins
    // (e.g. legacy Cloudflare frontend kept for development/testing).
    trustedOrigins: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...(env.APP_URL ? [env.APP_URL] : []),
      ...(env.ADDITIONAL_ORIGINS
        ? env.ADDITIONAL_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
        : []),
    ],

    emailAndPassword: {
      enabled: true,
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },

      github: {
        clientId: env.GITHUB_CLIENT_ID as string,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
  });
