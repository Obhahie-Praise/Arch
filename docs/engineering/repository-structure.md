# Repository Structure

Arch is a pnpm/Turborepo monorepo.

```text
arch/
├── apps/
│   └── web/
│
├── workers/
│   └── api/
│
├── packages/
│   ├── ui/
│   ├── eslint-config/
│   ├── typescript-config/
│   ├── types/
│   ├── validation/
│   └── db/
│
├── docs/
│   ├── product/
│   ├── design/
│   └── engineering/
│
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## `apps/web`

The Next.js application.

Contains:

- routes
- pages
- layouts
- UI implementation
- web-specific hooks
- web-specific state

The web application should consume the backend API rather than becoming the backend itself.

## `workers/api`

The Cloudflare Worker responsible for the backend.

Contains:

- API routes
- middleware
- authentication
- authorization
- business logic
- external service integrations
- AI orchestration
- background-job handlers
- scheduled-job handlers

Keep domain logic organized by responsibility rather than creating one enormous Worker file.

## `packages/ui`

Shared UI components.

Only place components here when they genuinely need to be shared.

Do not move every component into the shared package automatically.

## `packages/types`

Shared TypeScript types used across applications when necessary.

Types should represent actual contracts between parts of the system.

## `packages/validation`

Shared Zod schemas where validation needs to be reused across boundaries.

Avoid duplicating schemas between web and backend.

## `packages/db`

Database-related shared code only when useful.

Do not turn this package into a dumping ground for arbitrary backend utilities.

## `packages/eslint-config`

Shared linting configuration.

## `packages/typescript-config`

Shared TypeScript configuration.

## `docs`

Documentation is part of the project.

### Product

Defines:

- what Arch is
- who it serves
- the product journey
- scope
- information architecture

### Design

Defines:

- visual direction
- UI principles
- design system
- motion principles

### Engineering

Defines:

- architecture
- technology decisions
- repository structure
- data model
- API contracts
- progress

## Placement Rules

When adding code, ask:

> Which application or package actually owns this responsibility?

Do not create a new package or directory simply to make the repository look organized.

The repository should grow from real requirements.