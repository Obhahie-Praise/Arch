import { betterAuth } from "better-auth";

export interface Env {
  arch_db: D1Database;
  STORAGE_BUCKET?: R2Bucket;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export const createAuth = (env: Env) =>
  betterAuth({
    database: env.arch_db,

    secret: env.BETTER_AUTH_SECRET,

    baseURL: env.BETTER_AUTH_URL,

    trustedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"],

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
