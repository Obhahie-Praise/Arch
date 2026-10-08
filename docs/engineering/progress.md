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
- [x] File/object storage migrated from Cloudflare R2 to UploadThing (`uploadthing` SDK, `UTApi`, `UPLOADTHING_TOKEN`)
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
- [x] AI Chat for saved opportunities implemented (`/saved/[id]/chat`)
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
- [x] AI provider abstraction (`src/ai/`) — `AIRouter` + `MatchingAIRouter` with fail-closed semantics, `AiUnavailableResult` sentinel, `AIFeatureFlags` (master / extraction / matching), `WorkersAIProvider`, `NullAIProvider`, factory functions `createAIProvider` / `createMatchingAI`; Workers AI is the sole configured provider and its behaviour is preserved exactly
- [x] AI semantic matching layer (Workers AI structured JSON, deterministic fallback on failure)
- [x] Final blended scoring (deterministic 70% + AI 30%, with deadline urgency + freshness bonuses)
- [x] Diversity-aware ranking (max 8 per type, max 3 per org)
- [x] 30/week global recommendation limit & ISO-week quota management per user
- [x] Idempotent recommendation persistence via ON CONFLICT
- [x] Explainable recommendations (match reasons + AI strengths + AI gaps persisted)
- [x] Source configuration system (`config.ts`) with structured per-source metadata (name, domain, types, priority tier, discovery strategy, queries, directUrls, refreshIntervalHours)
- [x] Tier-1 high-priority source coverage: LinkedIn Jobs, Indeed, Wellfound, Greenhouse, Lever, Ashby, YC Jobs, Devpost, LabLab, Grants.gov, Techstars
- [x] Source-specific, high-signal search queries replacing previous generic queries

### Background Processing

- [x] Discovery run tracking (`discovery_runs`) & provenance recording
- [x] Scheduled discovery runner — cron every hour (`0 * * * *`), tier-aware execution
- [x] Tier-aware scheduling: Tier 1 every 4h, Tier 2 every 12h, Tier 3 every 24h
- [x] Scheduled refresh & stale opportunity handling
- [ ] Queue infrastructure

## Current Focus

Home dashboard, Opportunities page, Saved page, and Opportunity detail page are fully connected to the real backend engine.

All mock data removed from production rendering paths. Home metrics, charts, and recent activity all come from real D1 queries. Saved page provides full Save and Mark as Pursuing capabilities.

**Production Audit Complete:**
- Added robust environment/URL configuration.
- Fixed internal engine bypass logic and CORS.
- Removed internal error details from API responses.
- Removed unused/obsolete boilerplate, dead code, and development constants.
- Passed full TS type checks for both Web and API.

**Google OAuth `state_mismatch` Fixed:**
- Root cause: cross-origin partitioned cookie problem. The frontend (vercel.app) initiates the OAuth flow via a `fetch()` to the API (workers.dev). Browsers store the resulting state cookie partitioned under the vercel.app top-level origin. When Google redirects back to workers.dev, the top-level origin changes and the partitioned cookie is not sent, causing `state_mismatch`.
- Fix 1: Added `account: { skipStateCookieCheck: true }` to Better Auth config (`workers/api/src/auth.ts`). This removes the secondary state cookie check. The primary CSRF protection — the one-time verification record in D1 — is still enforced.
- Fix 2: Added `NEXT_PUBLIC_APP_URL` env var (`apps/web/.env.production`, `.env`, `.env.example`) and exported `APP_URL` from `apps/web/lib/api.ts`. Changed `callbackURL: "/home"` to `callbackURL: \`${APP_URL}/home\`` in `auth/page.tsx` and `signin/page.tsx`. A relative callbackURL was resolved against the API's baseURL (workers.dev) instead of the frontend — sending users to the wrong domain after authentication.
- TypeScript type checks pass for both web and API packages.

**Discovery Chart Fixed:**
- Root cause: `isDataEmpty` gate in Home page was hiding the discovery chart for users with no personal matches. The chart represents global system activity and must be visible regardless of match state.
- Fix: `hasDiscoveryActivity = chart.some(d => d.created > 0)` added to the `isDataEmpty` check — the full dashboard is shown whenever opportunities have been discovered.
- Source of truth for the chart: `opportunities.first_seen_at` column. Querying directly from the `opportunities` table is correct and reliable; `discovery_runs.opportunities_created` is not used because it double-counts re-seen opportunities and is suppressed when a run is stuck in `running`.
- Added `idx_opportunities_first_seen_at` index (migration 0011) to prevent full table scans on the chart query.
- Fixed pre-existing TypeScript 7.0 incompatibility: removed `baseUrl` from `apps/web/tsconfig.json` (breaking in TS 7.0.2) and added null-safety fallbacks in `morphing.tsx` and `rotating.tsx` that were surfaced by strict mode once `baseUrl` was removed.

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