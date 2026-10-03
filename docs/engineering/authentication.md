# Authentication Architecture

This document defines how authentication works in Arch.

Authentication is handled by **Better Auth** inside the Cloudflare Worker.

The web application does not own authentication logic.

---

# 1. Authentication Stack

```text
Next.js
   │
   │ authentication requests
   ▼
Cloudflare Worker
   │
   ├── Hono
   │
   └── Better Auth
          │
          ▼
         D1
```

Arch uses:

- Better Auth
- Cloudflare Workers
- Hono
- Cloudflare D1

Better Auth provides the authentication system while the Worker provides the runtime and D1 provides persistent storage.

Better Auth is framework-agnostic and supports email/password authentication, sessions, social sign-in, and account management.

---

# 2. Why Authentication Lives in the Worker

Authentication is backend infrastructure.

The Worker owns:

- user creation
- password authentication
- OAuth flows
- sessions
- cookies
- account linking
- authorization
- authentication-related database operations

Next.js consumes authentication state but does not become the source of truth for it.

This keeps authentication consistent for future clients and services.

---

# 3. Authentication Providers

Arch currently supports:

```text
Email + Password
Google
GitHub
X
```

The implementation will be introduced progressively rather than configuring everything at once.

Order:

```text
D1
 ↓
Better Auth
 ↓
Email/password
 ↓
Session testing
 ↓
Google
 ↓
GitHub
 ↓
X
 ↓
Next.js integration
```

This makes failures easier to isolate.

---

# 4. Better Auth Route

Better Auth's default API path is:

```text
/api/auth/*
```

Hono mounts Better Auth there:

```ts
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
```

Better Auth and Hono both use the standard Web `Request` and `Response` APIs, so no special adapter is required for the basic Hono integration.

The authentication endpoint therefore looks like:

```text
/api/auth/*
```

Examples include:

```text
/api/auth/sign-in/email
/api/auth/sign-up/email
/api/auth/get-session
```

The exact endpoints should be consumed through Better Auth's client/API rather than manually duplicated throughout the application.

---

# 5. Cloudflare Compatibility

Better Auth uses `AsyncLocalStorage`.

The Worker therefore requires the Cloudflare compatibility flag:

```json
{
  "compatibility_flags": [
    "nodejs_compat"
  ]
}
```

Better Auth's Hono integration explicitly requires this for Cloudflare Workers.

---

# 6. Database

Better Auth uses the Arch D1 database.

Conceptually:

```text
Better Auth
     │
     ▼
   env.DB
     │
     ▼
Cloudflare D1
```

Better Auth currently supports Cloudflare D1 as a first-class database option, allowing the D1 binding to be passed directly without creating a separate Prisma or Drizzle adapter.

Authentication data is therefore stored alongside Arch's application data in D1.

---

# 7. Authentication Data

Better Auth manages authentication-related records such as:

```text
User
Session
Account
Verification
```

The exact schema should be generated/managed according to the Better Auth version being used.

Do not manually invent Better Auth tables unless there is a specific reason.

Arch-specific data should remain separate from authentication concerns.

For example:

```text
Better Auth
├── user
├── session
├── account
└── verification

Arch
├── profile
├── opportunity
├── saved_opportunity
├── pursuit
└── application
```

---

# 8. Arch User vs Arch Profile

Authentication identifies the person.

The Arch profile describes the person for opportunity matching.

These are different concerns.

```text
Authenticated User
        │
        ▼
Arch Profile
        │
        ├── skills
        ├── education
        ├── experience
        ├── interests
        ├── location
        └── opportunity preferences
```

A user can therefore authenticate before completing their Arch profile.

This supports the product flow:

```text
SIGN UP
   ↓
HOME
   ↓
"You're almost there"
   ↓
CREATE PROFILE
   ↓
PERSONALIZED ARCH
```

---

# 9. Email + Password

Email/password authentication is the first authentication method implemented.

Better Auth configuration enables it:

```ts
emailAndPassword: {
  enabled: true,
}
```

The initial implementation should verify:

```text
Sign up
 ↓
User created
 ↓
Sign in
 ↓
Session created
 ↓
Get current session
 ↓
Sign out
 ↓
Session invalidated
```

Do not move to OAuth until this entire flow works.

---

# 10. Sessions

Arch uses Better Auth sessions to determine whether a user is authenticated.

Conceptually:

```text
Browser
   │
   │ cookie
   ▼
Better Auth
   │
   ▼
Session
   │
   ▼
Authenticated User
```

Protected backend routes must verify the session before returning private user data.

Example concept:

```text
GET /profile

No session
    ↓
401 Unauthorized

Valid session
    ↓
Return user's profile
```

---

# 11. Session Middleware

When multiple Hono routes need the current user, session retrieval should be centralized.

Conceptually:

```text
Request
   ↓
Session Middleware
   ↓
Get Better Auth session
   ↓
Attach session to Hono context
   ↓
Protected route
```

Better Auth's Hono integration provides a pattern for retrieving the session and storing it in Hono context.

---

# 12. OAuth

Arch supports three social providers:

```text
Google
GitHub
X
```

Each provider requires credentials from its respective OAuth provider.

The credentials are secrets.

They must never be:

- committed to Git
- hardcoded in source
- exposed to the browser
- placed in public Next.js environment variables

Local development credentials belong in:

```text
workers/api/.dev.vars
```

Production credentials belong in Cloudflare's secret storage.

---

# 13. OAuth Redirects

OAuth providers redirect users back to Better Auth.

The general pattern is:

```text
Provider
   ↓
/api/auth/callback/<provider>
```

For example:

```text
/api/auth/callback/google
/api/auth/callback/github
/api/auth/callback/twitter
```

Better Auth uses `twitter` internally for the X provider.

The actual redirect URLs must match the URLs configured in each OAuth provider's developer console.

---

# 14. Trusted Origins and CORS

During development, the Next.js web application and Worker may run on different local origins.

For example:

```text
Next.js
http://localhost:3000

Worker
http://localhost:8787
```

Authentication requests cross origins.

When credentials/cookies are involved, CORS must explicitly allow the web application's origin.

Do not use:

```text
Access-Control-Allow-Origin: *
```

for authenticated credentialed requests.

Better Auth's Hono documentation recommends configuring an explicit origin with credentials and using the same origin in Better Auth's `trustedOrigins`.

---

# 15. Local Secrets

Arch uses:

```text
workers/api/.dev.vars
```

for local Worker secrets.

Example:

```env
BETTER_AUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
X_CLIENT_ID="..."
X_CLIENT_SECRET="..."
```

Only values actually required by the current implementation should be added.

Do not create placeholder secrets for providers that have not been configured yet.

Cloudflare supports `.dev.vars` or `.env` for local secrets, but they should not be used simultaneously. Arch standardizes on `.dev.vars`.

---

# 16. Production Secrets

Production secrets are stored through Cloudflare rather than committed to the repository.

Conceptually:

```text
Local

.dev.vars
   ↓
wrangler dev
   ↓
Worker


Production

Cloudflare Secrets
   ↓
Deployed Worker
```

The application should access secrets through the Worker environment.

---

# 17. Security Rules

Authentication code must follow these rules:

1. Never expose OAuth client secrets to the browser.
2. Never commit `.dev.vars`.
3. Never commit `.env`.
4. Never hardcode authentication secrets.
5. Never trust user IDs supplied directly by clients for authorization.
6. Always derive the authenticated user from the verified session.
7. Protected routes must verify authentication.
8. Keep OAuth redirect URLs explicit.
9. Keep trusted origins explicit.
10. Do not weaken cookie/CORS settings just to make local development work.
11. Do not build a second authentication system beside Better Auth.
12. Do not store application authorization logic inside frontend components.

---

# 18. Authentication vs Authorization

These are different.

### Authentication

> Who are you?

Better Auth handles this.

### Authorization

> What are you allowed to do?

Arch's backend handles this.

Example:

```text
Authentication
User is signed in
        ↓
Authorization
User can access their own profile
        ↓
Authorization
User cannot access another user's private profile
```

A valid session does not automatically mean every resource is accessible.

---

# 19. Client Architecture

The web application should use Better Auth's client-side functionality to interact with the authentication API.

The browser should not directly access D1.

```text
GOOD

Next.js
   ↓
Better Auth / Worker
   ↓
D1
```

Not:

```text
BAD

Next.js
   ↓
D1
```

The Worker remains the backend boundary.

---

# 20. Authentication Flow

## Sign Up

```text
User
 ↓
Next.js
 ↓
Better Auth
 ↓
D1
 ↓
User + Account created
 ↓
Session
 ↓
Home
```

## Sign In

```text
User
 ↓
Next.js
 ↓
Better Auth
 ↓
Verify credentials
 ↓
Create session
 ↓
Home
```

## OAuth

```text
User
 ↓
Next.js
 ↓
Better Auth
 ↓
OAuth Provider
 ↓
Callback
 ↓
Better Auth
 ↓
Create/link account
 ↓
Create session
 ↓
Home
```

## Protected Request

```text
Next.js
 ↓
Worker
 ↓
Session verification
 ↓
Authorized user
 ↓
Application data
```

---

# 21. Authentication Product Flow

Authentication does not equal onboarding.

Arch intentionally uses this flow:

```text
SIGN UP / SIGN IN
        ↓
      HOME
        ↓
Profile incomplete?
        ↓
"You're almost there."
        ↓
    CREATE PROFILE
        ↓
      HOME
        ↓
Personalized opportunities
```

Do not create a multi-step authentication/onboarding wizard unless the product requirements change.

---

# 22. Implementation Order

Authentication should be implemented in this order:

```text
1. D1
2. Better Auth package
3. Worker compatibility configuration
4. Better Auth server configuration
5. Better Auth schema
6. Email/password
7. Local signup
8. Local signin
9. Session retrieval
10. Sign out
11. Protected API route
12. Next.js authentication client
13. Google OAuth
14. GitHub OAuth
15. X OAuth
16. Production OAuth configuration
17. Production secrets
18. End-to-end authentication verification
```

Each stage should be tested before moving to the next.

---

# 23. Definition of Done

Authentication is not considered complete because the login page renders.

The system is complete when:

- [ ] User can create an account
- [ ] User can sign in
- [ ] User receives a valid session
- [ ] Session survives page refresh
- [ ] User can retrieve their session
- [ ] User can sign out
- [ ] Protected API routes reject unauthenticated requests
- [ ] Authenticated users can access their own data
- [ ] Users cannot access another user's private data
- [ ] Google login works
- [ ] GitHub login works
- [ ] X login works
- [ ] OAuth redirects work locally
- [ ] OAuth redirects work in production
- [ ] Secrets are not committed
- [ ] CORS is configured correctly
- [ ] Trusted origins are configured correctly
- [ ] Authentication works from the actual Next.js application

---

# 24. Core Principle

Arch authentication should remain boring.

Authentication is infrastructure, not a product feature users should have to think about.

The goal is:

```text
Fast
Secure
Predictable
Centralized
Reusable
```

Better Auth owns authentication.

Cloudflare Worker owns the backend boundary.

D1 owns persistence.

Next.js owns the interface.