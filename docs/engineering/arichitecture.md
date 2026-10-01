# Architecture

## Purpose

Arch uses a web-first application architecture with Cloudflare providing the backend runtime and infrastructure.

The main principle is:

> **Cloudflare runs Arch. Next.js builds the experience.**

The system is intentionally simple. We are not introducing a traditional long-running Node.js server, microservices, or infrastructure that Arch does not currently need.

## High-Level Architecture

```text
                         ARCH
                          │
             ┌────────────┴────────────┐
             │                         │
          WEB APP                   BACKEND
        Next.js                 Cloudflare Workers
             │                         │
             │              ┌──────────┼──────────┐
             │              │          │          │
             │             API       Cron      Queues
             │              │          │          │
             └──────────────┴──────────┴──────────┘
                            │
                           Data
                            │
                           D1
                            │
                         AI Layer
                            │
                          Gemini
```

## Responsibilities

### Next.js

The web application owns:

- pages
- layouts
- navigation
- forms
- client-side interactions
- loading and error states
- presenting backend data
- authenticated user experience

Next.js should not become the application's primary business-logic layer.

### Cloudflare Workers

The backend owns:

- authentication
- authorization
- API endpoints
- business logic
- profile processing
- opportunity discovery
- opportunity normalization
- matching
- application state
- AI orchestration
- background jobs
- scheduled work

Workers should remain focused on application behavior rather than becoming a collection of unrelated utilities.

### Database

The database is the source of truth for persistent application data.

Core data includes:

- users
- profiles
- opportunities
- opportunity requirements
- saved opportunities
- pursuits
- applications
- discovery metadata

The exact schema should remain as small as possible for V1.

### Queues

Queues are used when work should happen outside the user's immediate request.

Examples:

- processing discovered opportunities
- analyzing an opportunity with AI
- calculating or refreshing matches
- performing expensive background work

Do not put every operation into a queue. If a task is fast and directly required for the request, it can remain synchronous.

### Cron

Scheduled jobs handle recurring work.

Examples:

- discovering new opportunities
- refreshing existing opportunities
- cleaning stale data
- triggering background processing

Scheduled work should enqueue heavier processing instead of trying to perform everything inside a single scheduled request.

## Request Flow

A normal request follows:

```text
Browser
  ↓
Next.js
  ↓
Cloudflare API
  ↓
Business logic
  ↓
Database / external service
  ↓
Response
  ↓
Next.js
  ↓
User
```

Background work follows:

```text
Cron / API request
       ↓
     Queue
       ↓
    Worker
       ↓
Database / AI / external source
```

## AI Architecture

AI is an internal intelligence layer.

The browser should not directly own sensitive AI credentials or business-critical AI operations.

```text
Next.js
   ↓
Cloudflare Worker
   ↓
AI service
   ↓
Worker processes result
   ↓
Database / response
```

AI should be used where it provides meaningful product value, particularly:

- opportunity understanding
- requirement extraction
- eligibility interpretation
- match reasoning
- application preparation

AI output must not replace deterministic application logic where deterministic logic is possible.

## Authentication

Authentication is backend-owned.

V1 supports:

- email authentication
- X authentication

The authentication implementation should be selected based on compatibility with the Workers architecture and maintained without creating unnecessary authentication infrastructure.

Authorization must always be enforced by the backend. The frontend must never be treated as the security boundary.

## External Opportunities

Arch does not own the websites where opportunities originate.

An opportunity record should preserve enough source information to allow the user to reach the original opportunity.

Arch owns:

- discovery
- normalization
- understanding
- matching
- preparation
- pursuit/application tracking

The original provider owns:

- the actual application process
- final submission

## Architectural Rules

1. Keep the architecture boring where possible.
2. Prefer existing platform capabilities before adding infrastructure.
3. Do not introduce microservices for V1.
4. Do not add Redis, Docker, or a traditional server unless a concrete requirement appears.
5. Keep business logic in the backend.
6. Keep presentation logic in Next.js.
7. Background work belongs in queues or scheduled jobs when appropriate.
8. Keep AI behind the backend.
9. Database models should represent actual product requirements, not speculative future features.
10. If a feature does not support **DISCOVER → UNDERSTAND → PURSUE**, question whether it belongs in V1.