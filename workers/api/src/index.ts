import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRouteHandler } from "uploadthing/server";
import { createAuth, type Env } from "./auth";
import { profileRouter } from "./routes/profile";
import { settingsRouter } from "./routes/settings";
import { opportunitiesRouter } from "./opportunities/routes";
import { buildFileRouter } from "./lib/uploadthing";
import { runDiscoveryJob } from "./workers/discovery";
import { runRefreshJob } from "./workers/refresh";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", async (c, next) => {
  const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  // APP_URL is the primary production frontend origin (Vercel).
  if (c.env.APP_URL) allowedOrigins.push(c.env.APP_URL);
  // ADDITIONAL_ORIGINS is a comma-separated list of extra allowed origins
  // (e.g. the legacy Cloudflare frontend used during development/testing).
  if (c.env.ADDITIONAL_ORIGINS) {
    for (const origin of c.env.ADDITIONAL_ORIGINS.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) allowedOrigins.push(trimmed);
    }
  }

  return cors({
    origin: allowedOrigins,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "X-Internal-Secret"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })(c, next);
});

app.all("/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.route("/api/profile", profileRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/opportunities", opportunitiesRouter);

/**
 * POST /api/test-discovery
 *
 * Manually triggers a single discovery run on the production Worker.
 *
 * Authorization: X-Internal-Secret header must match the INTERNAL_ENGINE_SECRET
 * environment secret. In local development (no secret configured) only
 * localhost callers are allowed — this is enforced by isInternalAuthorized().
 *
 * Concurrency guard: if a run is already in progress (status = 'running' and
 * started within the last 30 minutes) the request is rejected with 409. This
 * prevents overlapping runs and accidental quota exhaustion from repeated calls.
 *
 * State-changing, so POST only.
 */
app.post("/api/test-discovery", async (c) => {
  // Authorization — must come before any side effects.
  // Mirrors isInternalAuthorized() in routes.ts to avoid a circular import.
  const secret = c.req.header("X-Internal-Secret");
  const envSecret = (c.env as unknown as Record<string, string>).INTERNAL_ENGINE_SECRET;
  if (envSecret) {
    if (secret !== envSecret) {
      return c.json({ error: { code: "FORBIDDEN", message: "Not authorized" } }, 403);
    }
  } else {
    // No secret configured — allow localhost callers only (local dev).
    const origin = c.req.header("origin") ?? c.req.header("referer") ?? "";
    if (!origin.startsWith("http://localhost") && !origin.startsWith("http://127.0.0.1")) {
      return c.json({ error: { code: "FORBIDDEN", message: "Not authorized" } }, 403);
    }
  }

  // Concurrency guard: reject if a run is already active.
  try {
    const active = await c.env.arch_db
      .prepare(
        `SELECT id FROM discovery_runs
         WHERE status = 'running'
           AND started_at >= datetime('now', '-30 minutes')
         LIMIT 1`
      )
      .first<{ id: string }>();

    if (active) {
      return c.json(
        {
          error: {
            code: "CONFLICT",
            message: `A discovery run is already in progress (id: ${active.id}). Wait for it to complete or time out.`,
          },
        },
        409
      );
    }
  } catch {
    // If the discovery_runs table does not yet exist, proceed — the pipeline
    // will create the row itself.
  }

  const summary = await runDiscoveryJob(
    c.env.arch_db,
    c.env as unknown as Record<string, unknown>
  );
  return c.json(summary);
});

/**
 * UploadThing route handler — GET and POST to /api/uploadthing.
 *
 * The route handler is built per-request so it has access to the
 * Cloudflare Worker env (UPLOADTHING_TOKEN is not on process.env).
 *
 * Docs: https://docs.uploadthing.com/backend-adapters/fetch#cloudflare-workers
 */
app.all("/api/uploadthing", async (c) => {
  const handlers = createRouteHandler({
    router: buildFileRouter(c.env),
    config: {
      token: c.env.UPLOADTHING_TOKEN,
      isDev: c.env.ENVIRONMENT !== "production",
      // CF Workers don't support the `cache` property on fetch init.
      fetch: (url, init) => {
        if (init && "cache" in init) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (init as any).cache;
        }
        return fetch(url, init);
      },
    },
  });

  const method = c.req.method.toUpperCase();
  if (method !== "GET" && method !== "POST") {
    return c.text("Method not allowed", 405);
  }
  return handlers(c.req.raw);
});

app.get("/", (c) => {
  return c.text("Arch API");
});

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runDiscoveryJob(env.arch_db, env as unknown as Record<string, unknown>));
    ctx.waitUntil(runRefreshJob(env.arch_db, env as unknown as Record<string, unknown>));
  },
};
