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
- [ ] Database initialized
- [ ] Core database schema implemented
- [ ] API foundation implemented

### Web

- [x] Existing Next.js application reviewed
- [x] Authentication flow implemented
- [ ] Profile flow implemented
- [ ] Home implemented
- [ ] Opportunities implemented
- [ ] Opportunity detail implemented
- [ ] Saved implemented
- [ ] Applications implemented

### Intelligence

- [ ] Opportunity discovery foundation
- [ ] Opportunity normalization
- [ ] Requirement extraction
- [ ] Matching
- [ ] Match explanations
- [ ] AI integration

### Background Processing

- [ ] Queue infrastructure
- [ ] Scheduled discovery
- [ ] Opportunity processing
- [ ] Stale opportunity handling

## Current Focus

The next implementation step should be establishing the backend foundation without prematurely implementing product features.

Before coding:

1. Inspect the generated repository.
2. Read the relevant product, design, and engineering documentation.
3. Understand the existing Next.js structure.
4. Establish the Worker/API foundation.
5. Verify the development workflow.
6. Only then begin implementing product behavior.

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