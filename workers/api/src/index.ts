import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./auth";
import { profileRouter } from "./routes/profile";
import { settingsRouter } from "./routes/settings";
import { opportunitiesRouter } from "./opportunities/routes";
import { runDiscoveryJob } from "./workers/discovery";
import { runRefreshJob } from "./workers/refresh";


const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", async (c, next) => {
  const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  if (c.env.APP_URL) allowedOrigins.push(c.env.APP_URL);

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


app.get("/api/uploads/:key{.+$}", async (c) => {
  const key = decodeURIComponent(c.req.param("key"));
  if (c.env.STORAGE_BUCKET) {
    const object = await c.env.STORAGE_BUCKET.get(key);
    if (!object) {
      return c.text("File not found", 404);
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    return new Response(object.body, { headers });
  }
  return c.text("Storage not configured", 404);
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