# Tech Stack

## Principle

Use the smallest set of technologies that can reliably support Arch.

Do not introduce a dependency simply because another project uses it.

## Core Stack

| Area | Technology |
|---|---|
| Package manager | pnpm |
| Monorepo | Turborepo |
| Language | TypeScript |
| Web | Next.js |
| Backend runtime | Cloudflare Workers |
| API framework | Hono |
| Database | Cloudflare D1 |
| File storage | UploadThing |
| Validation | Zod |
| AI | Gemini |
| Styling | Tailwind CSS |
| UI | Existing project components / shared UI package |
| Background work | Cloudflare Queues |
| Scheduling | Cloudflare Cron Triggers |

## TypeScript

TypeScript is used throughout the repository.

Rules:

- strict TypeScript
- avoid `any`
- prefer explicit types at system boundaries
- validate external input
- do not duplicate types unnecessarily
- share types through packages when they genuinely belong across applications

Types should describe real contracts, not speculative abstractions.

## Next.js

Next.js is responsible for the web experience.

Use it for:

- routing
- rendering
- forms
- UI interactions
- browser-side state where necessary
- presenting backend data

Do not recreate backend business logic inside Next.js routes simply because they are convenient.

## Cloudflare Workers

Workers are the backend runtime.

Use Workers for:

- HTTP APIs
- authentication handling
- business logic
- AI orchestration
- background processing
- scheduled tasks

Keep Workers code compatible with the runtime instead of assuming a traditional Node.js server environment.

## Hono

Hono provides the HTTP/API layer inside the Worker.

Keep the API structure straightforward:

```text
workers/api
├── routes
├── services
├── middleware
├── lib
└── index.ts
```

Do not create elaborate framework-like abstractions around Hono.

## Database

D1 is the initial database.

Database access should remain behind a small data-access layer where that improves separation and testability.

Do not introduce an ORM unless there is a clear reason to do so.

## Zod

Zod is used for validating untrusted input and important external data.

Validate:

- API request bodies
- query parameters where needed
- authentication-related input
- external opportunity data
- AI output when structured output is expected

Do not add schemas for trivial internal values that TypeScript already guarantees.

## AI

Gemini is used as an intelligence service rather than as the application's core runtime.

AI calls should:

- happen server-side
- have clear inputs and outputs
- be validated
- handle failures
- avoid unnecessary repeated calls
- store useful results when appropriate

Do not call AI merely because a deterministic function can solve the problem more reliably.

## Styling and UI

Tailwind is used for styling.

The UI should follow the existing Arch design direction:

- minimal
- calm
- modern
- restrained
- responsive
- accessible

Agents must study the existing implementation before modifying or creating UI.

The user owns the visual implementation. Engineering work should not silently introduce a competing design language.

## Dependency Rule

Before adding a package:

1. Check whether the repository already solves the problem.
2. Check whether the platform already provides the capability.
3. Check whether the dependency is actually necessary.
4. Prefer the smallest reliable solution.

A dependency should solve a real problem, not merely make an implementation feel more sophisticated.