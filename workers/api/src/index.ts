import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./auth";
import { profileRouter } from "./routes/profile";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.all("/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.route("/api/profile", profileRouter);

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

export default app;