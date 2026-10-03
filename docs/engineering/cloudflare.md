# Cloudflare Architecture & Development

This document explains how Arch uses Cloudflare, how the backend runs, how local development works, and how Cloudflare resources connect to the application.

The goal is to understand the infrastructure rather than treat Cloudflare as a black box.

---

## 1. Why Arch Uses Cloudflare

Arch needs backend capabilities beyond a normal web application:

- API endpoints
- authentication
- database access
- background processing
- scheduled discovery
- queues
- AI processing
- opportunity ingestion

Instead of maintaining a traditional long-running Node.js server, Arch uses Cloudflare Workers and Cloudflare's serverless infrastructure.

The core principle is:

> **Cloudflare runs Arch's backend. Next.js builds Arch's web experience.**

---

## 2. Architecture

```text
                         ARCH
                          │
              ┌───────────┴───────────┐
              │                       │
          Next.js Web          Cloudflare Backend
              │                       │
              │ HTTP                  │
              └──────────────────────►│
                                      │
                              ┌───────┴────────┐
                              │ Cloudflare     │
                              │ Worker         │
                              │                │
                              │ Hono           │
                              │ Better Auth    │
                              │ API Logic      │
                              └───────┬────────┘
                                      │
               ┌──────────────────────┼──────────────────────┐
               │                      │                      │
              D1                   Queues                  Cron
               │                      │                      │
          Application             Background              Scheduled
             Data                  Jobs                   Processing
                                      │
                                      ▼
                                    Gemini
```

---

## 3. Cloudflare Worker

The Worker is Arch's backend runtime.

Location in the repository:

```text
workers/api/
```

The Worker is responsible for:

- HTTP API routes
- authentication
- authorization
- business logic
- database access
- AI orchestration
- opportunity processing
- background job coordination
- scheduled tasks

The Worker does not render the main Arch web interface.

That belongs to the Next.js application.

---

## 4. Hono

Hono is the HTTP framework running inside the Worker.

It gives Arch a structured way to define API routes and middleware.

Example:

```ts
import { Hono } from "hono";

const app = new Hono();

app.get("/opportunities", async (c) => {
  return c.json({
    opportunities: [],
  });
});

export default app;
```

Hono uses standard Web Request and Response APIs, which makes it a natural fit for Cloudflare Workers.

---

## 5. Wrangler

Wrangler is Cloudflare's command-line tool for developing and deploying Workers.

Arch uses Wrangler to:

- run the Worker locally
- create Cloudflare resources
- manage bindings
- run D1 commands
- deploy Workers
- manage secrets
- generate Worker types

Common commands:

```powershell
pnpm wrangler dev
```

Run the Worker locally.

```powershell
pnpm wrangler deploy
```

Deploy the Worker to Cloudflare.

```powershell
pnpm wrangler d1 create arch-db
```

Create a D1 database.

```powershell
pnpm wrangler d1 migrations apply arch-db --local
```

Apply D1 migrations locally.

```powershell
pnpm wrangler d1 migrations apply arch-db --remote
```

Apply migrations to the remote database.

---

## 6. `wrangler.jsonc`

The Worker configuration lives here:

```text
workers/api/wrangler.jsonc
```

This file describes how the Worker is deployed and which Cloudflare resources are available to it.

Example D1 configuration:

```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "arch-db",
      "database_id": "..."
    }
  ]
}
```

The important part is:

```text
binding: DB
```

This means Worker code accesses the database through:

```ts
env.DB
```

The binding is an interface between Worker code and a Cloudflare resource.

---

# 7. Bindings

Cloudflare bindings connect Worker code to Cloudflare resources.

Instead of making HTTP requests to Cloudflare services, the Worker receives the resources directly through its environment.

For example:

```ts
env.DB
```

can represent the D1 database.

Other future bindings may include:

```text
env.DB
env.QUEUE
env.AI
```

Bindings are available locally and in production using the same application code.

Cloudflare's local runtime normally provides local simulations of bound resources during `wrangler dev`.

---

# 8. D1

D1 is Arch's SQLite-compatible database hosted by Cloudflare.

Arch uses D1 for application data such as:

- users
- profiles
- opportunities
- requirements
- saved opportunities
- pursuits
- applications

Authentication also uses D1.

Better Auth has native D1 support, so Arch does not need Prisma or Drizzle simply to connect authentication to D1.

---

# 9. Local D1 vs Remote D1

This distinction is important.

When running:

```powershell
pnpm wrangler dev
```

Cloudflare normally runs the Worker locally and connects bindings to local simulated resources.

Therefore:

```text
LOCAL DEVELOPMENT

Worker
  ↓
Local D1
```

while production uses:

```text
PRODUCTION

Worker on Cloudflare
  ↓
Remote D1
```

The local database is separate from the production database.

This protects production data while developing.

Cloudflare also supports remote bindings when local code needs to interact with an actual Cloudflare resource, but this should be intentional.

---

# 10. Local Environment Variables and Secrets

Arch uses:

```text
workers/api/.dev.vars
```

for local Worker secrets.

Example:

```env
BETTER_AUTH_SECRET="..."
```

Cloudflare supports both `.dev.vars` and `.env`, but a Worker should use one or the other rather than both.

For Arch, `.dev.vars` is the project convention.

These files must never be committed.

The `.gitignore` should include:

```gitignore
.dev.vars*
.env*
```

---

# 11. Secrets vs Variables

Not every environment value is a secret.

### Secret

Use a secret for sensitive values:

```text
BETTER_AUTH_SECRET
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_SECRET
X_CLIENT_SECRET
GEMINI_API_KEY
```

### Variable

Use a normal Worker variable for non-sensitive configuration.

Never put passwords, API keys, OAuth secrets, or signing secrets into normal Wrangler `vars`.

Cloudflare specifically recommends using secrets for sensitive information.

---

# 12. Production Secrets

Local secrets live in:

```text
workers/api/.dev.vars
```

Production secrets are stored in Cloudflare's secret system rather than committed to the repository.

The application code should access both through the Worker environment.

Conceptually:

```ts
env.BETTER_AUTH_SECRET
```

works regardless of whether the Worker is running locally or in production.

---

# 13. Cron

Arch needs scheduled processing because opportunity discovery should not depend entirely on a user opening the application.

Cron Triggers will eventually be used for jobs such as:

```text
scheduled opportunity discovery
scheduled opportunity refresh
deadline checks
stale opportunity cleanup
matching refreshes
```

Conceptually:

```text
Cloudflare Cron
      ↓
Worker
      ↓
Queue / processing
      ↓
D1
```

Cron should coordinate work rather than contain a giant processing operation.

---

# 14. Queues

Cloudflare Queues provide durable background job processing.

Arch can use queues for work such as:

```text
discover opportunities
        ↓
queue
        ↓
process opportunity
        ↓
AI extraction
        ↓
store in D1
```

This keeps expensive or time-consuming work away from normal HTTP requests.

A user should not have to wait for a large discovery operation to finish before the API responds.

---

# 15. AI

AI calls should normally happen from the backend.

The browser should not directly contain sensitive AI credentials.

The architecture is:

```text
Browser
   ↓
Next.js
   ↓
Arch Worker
   ↓
Gemini
   ↓
Arch Worker
   ↓
Next.js
```

Background AI processing follows:

```text
Cron / Queue
      ↓
Worker
      ↓
Gemini
      ↓
D1
```

---

# 16. Local Development

Start the Worker from:

```powershell
cd workers/api
pnpm dev
```

Wrangler runs the Worker locally.

The local Worker normally uses local versions of its bindings.

This allows development without modifying production resources.

---

# 17. Repository Relationship

Cloudflare is infrastructure.

The repository is still the source of truth for Arch's backend code.

```text
arch/
│
├── apps/
│   └── web/
│
├── workers/
│   └── api/
│
├── packages/
│
└── docs/
```

Cloudflare does not replace the monorepo.

It executes and provides infrastructure for the code inside it.

---

# 18. Rules

When working on Arch:

1. Do not create unnecessary Cloudflare services.
2. Do not introduce a traditional backend server unless the architecture genuinely requires one.
3. Do not put secrets in `wrangler.jsonc`.
4. Do not commit `.dev.vars` or `.env`.
5. Understand whether a resource is local or remote before modifying it.
6. Prefer bindings over unnecessary REST calls to Cloudflare resources.
7. Keep background work out of normal request handlers when it can be queued.
8. Keep Cloudflare-specific infrastructure documented.
9. Do not add an ORM merely because the application uses a database.
10. Keep the backend small and explicit.

---

## 19. Mental Model

The most useful way to think about Arch on Cloudflare is:

```text
Worker
= backend runtime

Hono
= HTTP/API framework

D1
= database

Bindings
= connection between Worker and Cloudflare resources

Wrangler
= development/deployment CLI

Secrets
= sensitive configuration

Cron
= scheduled execution

Queues
= background work

Next.js
= web experience
```

Cloudflare is therefore not just where Arch is hosted.

It is the infrastructure layer that runs the backend.