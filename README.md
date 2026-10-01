# Arch

> **Find the opportunities worth going after.**

Arch is an opportunity intelligence and application platform that helps people discover relevant opportunities, understand what they involve, and pursue them with clarity.

The core journey is:

**DISCOVER → UNDERSTAND → PURSUE**

Arch starts with:

- Jobs
- Grants
- Hackathons

Over time, it can expand into more opportunity categories without losing its core purpose.

## What Arch Does

Arch helps users:

- discover opportunities
- understand requirements and eligibility
- see why an opportunity may fit their profile
- save opportunities
- decide what to pursue
- prepare for applications
- track application progress

Arch does **not** aim to be:

- a generic AI chatbot
- a traditional job board
- an autonomous application bot
- a replacement for application portals
- an analytics-heavy dashboard

When an opportunity requires an external application, Arch helps the user prepare and then sends them to the original provider to complete the submission.

## Product Flow

```text
SIGN UP
   ↓
CREATE PROFILE
   ↓
DISCOVER
   ↓
UNDERSTAND
   ↓
SAVE / PURSUE
   ↓
PREPARE
   ↓
EXTERNAL APPLICATION
   ↓
TRACK
```

The user's profile is central to the experience because it provides the information Arch uses to understand relevance and improve recommendations.

## Architecture

Arch uses a pnpm/Turborepo monorepo.

```text
arch/
├── apps/
│   └── web/              # Next.js web application
│
├── workers/
│   └── api/              # Cloudflare Worker backend
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── db/
│   ├── eslint-config/
│   └── typescript-config/
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

### Core stack

- **TypeScript**
- **pnpm**
- **Turborepo**
- **Next.js**
- **Cloudflare Workers**
- **Hono**
- **Cloudflare D1**
- **Cloudflare Queues**
- **Cloudflare Cron**
- **Zod**
- **Gemini**
- **Tailwind CSS**

The architecture deliberately avoids unnecessary infrastructure. Platform capabilities should be preferred before introducing additional services or dependencies.

## Documentation

The repository documentation is organized by responsibility.

### Product

`docs/product/`

Defines what Arch is and what it should do.

- Vision
- Product definition
- Core journey
- Information architecture
- V1 scope

### Design

`docs/design/`

Defines how Arch should feel and behave visually.

- Design direction
- UI principles
- Design system
- Motion principles

The visual implementation is intentionally owned by the project author. Agents should study the existing application before implementing or modifying UI.

### Engineering

`docs/engineering/`

Defines how Arch is built.

- Architecture
- Tech stack
- Repository structure
- Data model
- API
- Progress

## Development Principles

Arch follows a few simple rules:

1. **Understand before coding.**
2. **Read the relevant documentation before changing the system.**
3. **Inspect existing code before creating new patterns.**
4. **Prefer the smallest correct solution.**
5. **Do not introduce unnecessary dependencies or abstractions.**
6. **Keep business logic in the backend.**
7. **Keep the web application focused on the experience.**
8. **Treat AI as an intelligence layer, not the product itself.**
9. **Do not silently change product or architectural decisions.**
10. **Keep documentation and implementation aligned.**

For detailed implementation rules, read [`AGENTS.md`](./AGENTS.md).

## Status

Arch is currently in its foundation and implementation phase.

The repository is being built