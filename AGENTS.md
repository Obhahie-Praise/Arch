# AGENTS.md

## Purpose

Arch is an opportunity intelligence and application platform.

It helps users:

1. Discover opportunities.
2. Understand whether those opportunities are relevant to them.
3. Pursue those opportunities.

The product should feel calm, useful, intelligent, and trustworthy.

---

## Before Writing Code

**Understand the task before implementing it.**

Before changing code:

1. Read the relevant documentation in `docs/`.
2. Inspect the existing implementation.
3. Understand how the requested change fits the current architecture.
4. Identify existing components, utilities, types, and patterns that should be reused.
5. Check whether the requested behavior already exists elsewhere.
6. Only then decide what code needs to change.

Do not immediately start coding from a prompt without understanding the surrounding system.

If the task conflicts with documented product or architectural decisions, stop and resolve the conflict rather than silently choosing a direction.

---

## Avoid Bloat

Arch values simplicity.

Do not:

- create abstractions without a real use case
- add dependencies unnecessarily
- create files that only contain a few lines without a clear reason
- duplicate existing utilities or components
- add configuration that is not currently needed
- build speculative features
- create elaborate systems for simple problems
- add UI elements merely to fill space
- turn simple functionality into a framework

Prefer the smallest implementation that correctly solves the actual problem.

> **Do not build for hypothetical complexity. Build for the current product.**

---

## Product Rules

Arch is not:

- a generic AI chatbot
- a traditional job board
- an autonomous application bot
- an analytics dashboard
- an AI agent control panel

The core product loop is:

**DISCOVER → UNDERSTAND → PURSUE**

Arch provides opportunity intelligence, preparation, and tracking.

The actual application submission normally happens on the original opportunity provider's website.

Do not introduce autonomous application submission unless the product documentation explicitly changes this decision.

---

## Architecture Rules

Arch is a pnpm monorepo.

Primary applications:

- `apps/web` — Next.js web application
- `workers/api` — Cloudflare Worker backend

Shared packages should contain genuinely shared functionality.

Do not move code into a shared package simply because it could technically be shared.

The backend owns:

- authentication
- authorization
- business logic
- database access
- AI orchestration
- opportunity discovery
- matching
- application state
- background processing

The web application is primarily responsible for presentation and user interaction.

---

## Technology Rules

Use:

- pnpm
- TypeScript
- Next.js
- Cloudflare Workers
- Hono
- Cloudflare services where appropriate
- Zod for runtime validation
- Tailwind CSS
- existing UI components before creating new ones

Use strict TypeScript.

Do not use `any` unless there is an exceptional, documented reason.

Do not introduce a new library when the existing stack can solve the problem cleanly.

---

## UI Rules

Arch's interface should be:

- minimal
- calm
- modern
- neutral
- responsive
- accessible
- intentional

The visual direction is primarily:

- near-black
- off-white
- restrained gray
- muted green accent
- rounded surfaces
- subtle interaction

Avoid:

- unnecessary gradients
- excessive glassmorphism
- neon effects
- flashy AI aesthetics
- excessive animations
- dashboard clutter
- decorative UI without purpose

Animation should support interaction rather than perform for the user.

---

## Navigation

Desktop uses a top navigation.

Primary navigation:

- Home
- Opportunities
- Saved
- Applications

The user's profile is accessed through the profile button on the right.

Do not introduce a desktop sidebar unless the information architecture changes enough to justify one.

---

## Documentation

Documentation is part of the implementation.

Before implementing a significant feature, read the relevant documentation.

After implementing a significant feature:

- update `docs/engineering/progress.md`
- update other documentation if the implementation changes an established decision

Do not create documentation for trivial changes.

Do not allow documentation to describe behavior that the application does not actually implement.

---

## Changes and Dependencies

Before adding a dependency, ask:

> Can the existing stack solve this cleanly?

If yes, use the existing stack.

If no, introduce the smallest appropriate dependency and document the reason when it materially affects the architecture.

Avoid dependency duplication across packages.

---

## Verification

Before considering a task complete:

1. Run the relevant type checks.
2. Run the relevant lint checks.
3. Run tests when applicable.
4. Verify the actual user flow when the change affects UI or behavior.
5. Check that no unrelated files were modified.

Never claim a feature is complete solely because the code was written.

---

## Git Discipline

Keep commits focused.

Prefer commits such as:

```text
feat: add opportunity detail page
fix: correct profile matching state
docs: define application flow
chore: configure cloudflare worker
```

Do not combine unrelated changes into one commit.

---

## Decision Discipline

Do not silently change:

- product behavior
- architecture
- data model
- authentication strategy
- navigation
- pricing
- opportunity workflow

If a change is required, document the decision or ask for clarification.

The goal is not to produce the most code.

The goal is to produce the smallest amount of correct code that moves Arch forward.