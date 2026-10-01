# Data Model

## Principle

The database should represent the product, not every feature we might build someday.

V1 should use a small relational model that supports:

**DISCOVER → UNDERSTAND → PURSUE**

## Core Entities

### User

Represents an Arch account.

Responsibilities:

- identity
- authentication relationship
- account metadata

A user may have one profile.

### Profile

Represents the information Arch uses to understand a user.

Potential information includes:

- name
- location
- role
- skills
- education
- experience
- projects
- interests
- opportunity preferences
- work preferences

The profile is the primary source of user-specific matching information.

Keep profile structure practical. Do not create dozens of tables for information that can reasonably belong together.

### Opportunity

Represents an opportunity discovered by Arch.

Core information includes:

- title
- organization
- type
- description
- location
- remote status
- deadline
- source URL
- status
- discovery metadata
- timestamps

Opportunity types in V1:

- job
- grant
- hackathon

The model should allow additional types later without requiring a redesign of the entire system.

### Opportunity Requirement

Represents structured requirements extracted from an opportunity.

Examples:

- skills
- location eligibility
- experience requirements
- education requirements
- required documents
- other eligibility conditions

Requirements may originate from deterministic extraction or AI-assisted analysis.

AI-derived information should be treated as data requiring appropriate validation rather than unquestionable truth.

### Saved Opportunity

Represents an opportunity intentionally saved by a user.

Relationship:

```text
User
  ↓
Saved Opportunity
  ↓
Opportunity
```

A user should not have duplicate saved records for the same opportunity.

### Pursuit

Represents the user's intent to actively pursue an opportunity.

A saved opportunity and a pursuit are different concepts.

```text
Saved
  ↓
Pursuing
```

The user can save something without intending to pursue it immediately.

### Application

Represents the user's application state for an opportunity.

The actual submission may happen externally.

Possible states:

```text
IN_PROGRESS
SUBMITTED
```

Additional states should only be added when the product actually needs them.

An application should preserve useful timestamps and external/source information where appropriate.

## Relationships

Conceptually:

```text
User
 │
 ├── Profile
 │
 ├── Saved Opportunities ── Opportunity
 │
 ├── Pursuits ───────────── Opportunity
 │
 └── Applications ───────── Opportunity
```

An opportunity can be associated with many users.

A user can interact with many opportunities.

## Matching

Matching does not need to become a permanent database entity immediately.

A match can initially be calculated from:

- profile data
- opportunity data
- requirements
- deterministic checks
- AI-assisted interpretation where useful

If match results later need persistence for performance, history, or analytics, introduce the smallest model that solves that requirement.

## Data Integrity

The backend is responsible for enforcing important rules.

Examples:

- a user cannot save the same opportunity twice
- users can only access their own private profile data
- users can only modify their own saved opportunities
- applications belong to the correct user and opportunity
- opportunities have valid source information
- invalid external data is not blindly stored

## External Data

Opportunity data may become stale.

The model should therefore preserve enough metadata to support:

- source
- discovery time
- last update
- source status
- expiration/deadline information

Do not assume an opportunity remains valid forever.

## Database Design Rule

Before creating a new table, ask:

1. Does this represent a real domain concept?
2. Does it need its own lifecycle?
3. Does it have relationships that justify separation?
4. Could the requirement be represented by an existing entity?

If the answer is unclear, do not create the table yet.