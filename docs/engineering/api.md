# API

## Purpose

The API is the contract between the Arch web application and backend.

The backend owns business logic and authorization.

The web application consumes the API.

## Principles

- Validate all untrusted input.
- Authenticate requests that require an account.
- Authorize every protected resource.
- Return predictable responses.
- Keep endpoints focused.
- Do not expose database implementation details unnecessarily.
- Do not put business logic into frontend components.
- Do not create endpoints for hypothetical future features.

## API Structure

The API runs through the Cloudflare Worker using Hono.

Conceptually:

```text
/api
├── auth
├── profile
├── opportunities
├── saved
├── pursuits
└── applications
```

The exact route structure may evolve as implementation begins.

## Authentication

Authentication endpoints and flows are backend-owned.

V1 authentication supports:

- email
- X

Authenticated requests must establish the current user before accessing private resources.

The frontend should never be trusted to provide a user ID as proof of identity.

## Profile

Profile operations should support the core profile lifecycle.

Examples:

```text
GET    /profile
PUT    /profile
```

The profile response should contain only information the authenticated user is allowed to access.

## Opportunities

Examples:

```text
GET /opportunities
GET /opportunities/:id
```

Opportunity listing should support the filters required by V1.

Initial categories:

- all
- jobs
- grants
- hackathons

Search and filtering should remain simple until real usage demonstrates a need for more complexity.

## Saved

Examples:

```text
GET    /saved
POST   /saved/:opportunityId
DELETE /saved/:opportunityId
```

Saving and removing a saved opportunity should be idempotent where practical.

## Pursuits

Examples:

```text
GET   /pursuits
POST  /pursuits/:opportunityId
```

Pursuit represents the user's intention to actively go after an opportunity.

## Applications

Examples:

```text
GET   /applications
POST  /applications/:opportunityId
PATCH /applications/:id
```

Arch tracks application state.

Arch does not normally submit the external application itself.

The application record may contain:

- status
- started timestamp
- submitted timestamp
- external application URL
- relevant user notes

## Home

Home can compose information from several backend resources.

It should provide the data needed for:

- overview metrics
- recent matches
- recent pursuits
- profile improvements

Do not create a separate `/dashboard` domain merely because the UI calls the page a dashboard.

## Errors

API errors should be predictable and useful.

At minimum, distinguish between:

- invalid input
- unauthenticated request
- unauthorized request
- resource not found
- conflict
- server/internal failure

Do not expose sensitive internal errors to clients.

## API Evolution

When changing an API:

1. Check all consumers.
2. Update shared types/schemas where applicable.
3. Update documentation if the contract materially changes.
4. Test the affected flow.
5. Avoid breaking changes when a small compatible change is possible.

Do not version the entire API prematurely.