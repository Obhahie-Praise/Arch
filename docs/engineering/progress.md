# Progress

This document records meaningful implementation progress.

It is not a task dump.

Keep it short and current.

## Status

### Foundation

- [x] Turborepo monorepo created
- [x] pnpm workspace established
- [x] Initial application/package structure established
- [x] Product documentation created
- [x] Design documentation created
- [x] Engineering documentation created

### Backend

- [x] Cloudflare Worker initialized
- [x] Hono API initialized
- [x] Backend environment configuration established
- [x] Authentication implemented
- [x] Database initialized
- [x] Core database schema implemented (profiles, profile_experiences, profile_education, profile_projects, profile_achievements)
- [x] API foundation & profile routes implemented
- [x] Opportunity Engine schema & D1 migration implemented (`opportunities`, `opportunity_sources`, `opportunity_sources_map`, `user_opportunity_matches`, `user_opportunity_quota`)
- [x] Opportunity Discovery Pipeline schema & D1 migration implemented (`discovery_runs`, `discovery_queries`)
- [x] Opportunities API routes implemented (`/api/opportunities`, `/api/opportunities/:id`, `/api/opportunities/:id/match`, `/api/opportunities/:id/save`, `/api/opportunities/:id/pursue`, `/api/opportunities/:id/dismiss`, `/api/internal/discovery/run`, `/api/internal/...`)

### Web

- [x] Existing Next.js application reviewed
- [x] Authentication flow implemented
- [x] Profile flow implemented (complete persistent matching-ready profile form)
- [x] Home implemented (Arch home dashboard with completion gate, metrics, charts & mock sections)
- [x] Opportunities UI implemented
- [x] Opportunity detail UI implemented
- [x] Progressive loading skeletons implemented (Home, Opportunities, Detail)
- [x] Opportunities page connected to real backend (`/api/opportunities`, save, filter, search)
- [x] Opportunity detail page connected to real backend (`/api/opportunities/:id`, optimistic save)
- [x] Discovery pipeline verified end-to-end (ran locally, 2 opportunities created)
- [x] Home dashboard connected to real backend (`/api/opportunities/home` — metrics, discovery chart, journey chart, recent matches, recent saved, deadline timeline)
- [x] Saved UI implemented (with Mark as Pursuing functionality)
- [ ] Applications UI implemented

### Intelligence

- [x] Opportunity discovery foundation & pipeline orchestrator
- [x] Web discovery providers (Web Search & Direct Website Providers)
- [x] Defensive page fetching (SSRF protection, timeout, size cap, URL normalization)
- [x] Page content extraction & heuristic opportunity extraction
- [x] Requirement extraction & content hash deduplication
- [x] AI opportunity extraction layer (Workers AI, JSON schema mode, heuristic fallback)
- [x] Deterministic matching pipeline & ranking engine (7 dimensions: eligibility, skills, interest, goals, experience, location, preference)
- [x] Hard eligibility evaluation (eligible / ineligible / unknown — three-state, never overridden by AI)
- [x] AI semantic matching layer (Workers AI structured JSON, deterministic fallback on failure)
- [x] Final blended scoring (deterministic 70% + AI 30%, with deadline urgency + freshness bonuses)
- [x] Diversity-aware ranking (max 8 per type, max 3 per org)
- [x] 30/week global recommendation limit & ISO-week quota management per user
- [x] Idempotent recommendation persistence via ON CONFLICT
- [x] Explainable recommendations (match reasons + AI strengths + AI gaps persisted)

### Background Processing

- [x] Discovery run tracking (`discovery_runs`) & provenance recording
- [x] Scheduled discovery runner
- [x] Scheduled refresh & stale opportunity handling
- [ ] Queue infrastructure

## Current Focus

Home dashboard, Opportunities page, Saved page, and Opportunity detail page are fully connected to the real backend engine.

All mock data removed from production rendering paths. Home metrics, charts, and recent activity all come from real D1 queries. Saved page provides full Save and Mark as Pursuing capabilities.

Next steps:

1. Implement the Applications page.

## Progress Rules

Agents must update this document after meaningful implementation work.

Do not mark work complete because files were created.

A feature is complete only when:

- implementation exists
- relevant flows work
- validation exists where needed
- type checking passes
- linting passes
- relevant tests pass where applicable
- the documentation accurately reflects the current state

Do not add speculative tasks simply to make the progress file look larger.

## Change Discipline

When implementation reveals that an architectural or product decision needs to change:

1. Stop.
2. Understand why the change is necessary.
3. Check the relevant documentation.
4. Update the appropriate decision/document.
5. Continue implementation only after the new direction is clear.

The progress file should reflect reality, not intention.