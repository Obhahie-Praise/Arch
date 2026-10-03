import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth, type Env } from "./auth";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/auth/*",
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

app.get("/", (c) => {
  return c.text("Arch API");
});

export default app;