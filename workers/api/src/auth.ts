import { betterAuth } from "better-auth";

export interface Env {
  arch_db: D1Database;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AI?: any;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  /** The public-facing web app URL (e.g. https://arch.inc in prod, http://localhost:3000 locally). */
  APP_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  /** Secret that must be supplied by callers of /api/internal/* endpoints. */
  INTERNAL_ENGINE_SECRET?: string;
  /** Developer account email — grants access to the full matched result set without the weekly quota cap. Evaluated server-side only; never exposed to clients. */
  DEVELOPER_ACCESS_EMAIL?: string;
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
    trustedOrigins: env.APP_URL
      ? [env.APP_URL, "http://localhost:3000", "http://127.0.0.1:3000"]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],

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
