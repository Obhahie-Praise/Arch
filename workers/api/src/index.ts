import { Hono } from "hono";
import { createAuth, type Env } from "./auth";

const app = new Hono<{ Bindings: Env }>();

app.all("/api/auth/*", (c) => {
  const auth = createAuth(c.env);

  return auth.handler(c.req.raw);
});

app.get("/", (c) => {
  return c.text("Arch API");
});

export default app;