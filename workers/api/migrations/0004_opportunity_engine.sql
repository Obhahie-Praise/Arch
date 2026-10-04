-- Migration number: 0004 	 Opportunity Engine tables creation

CREATE TABLE IF NOT EXISTS "opportunities" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "organization_name" TEXT NOT NULL,
  "organization_url" TEXT,
  "type" TEXT NOT NULL CHECK("type" IN ('job', 'grant', 'hackathon', 'fellowship', 'competition', 'funding', 'other')),
  "description" TEXT,
  "application_url" TEXT,
  "source_url" TEXT NOT NULL,
  "location" TEXT,
  "country" TEXT,
  "region" TEXT,
  "city" TEXT,
  "is_remote" INTEGER DEFAULT 0,
  "deadline" TEXT,
  "start_date" TEXT,
  "end_date" TEXT,
  "eligibility" TEXT,
  "requirements" TEXT,
  "skills" TEXT,
  "benefits" TEXT,
  "compensation" TEXT,
  "funding_amount" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active' CHECK("status" IN ('active', 'expiring', 'expired', 'archived')),
  "first_seen_at" TEXT NOT NULL,
  "last_seen_at" TEXT NOT NULL,
  "last_verified_at" TEXT NOT NULL,
  "expires_at" TEXT,
  "content_hash" TEXT NOT NULL,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "opportunity_sources" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "base_url" TEXT,
  "source_type" TEXT NOT NULL CHECK("source_type" IN ('search', 'website', 'api', 'manual')),
  "enabled" INTEGER DEFAULT 1,
  "priority" INTEGER DEFAULT 1,
  "discovery_interval_minutes" INTEGER DEFAULT 360,
  "last_checked_at" TEXT,
  "next_check_at" TEXT,
  "health_status" TEXT DEFAULT 'healthy',
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "opportunity_sources_map" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "opportunity_id" TEXT NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "source_id" TEXT REFERENCES "opportunity_sources"("id") ON DELETE SET NULL,
  "source_url" TEXT NOT NULL,
  "external_id" TEXT,
  "first_seen_at" TEXT NOT NULL,
  "last_seen_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_opportunity_matches" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "opportunity_id" TEXT NOT NULL REFERENCES "opportunities"("id") ON DELETE CASCADE,
  "match_score" REAL NOT NULL DEFAULT 0,
  "eligibility_score" REAL NOT NULL DEFAULT 0,
  "skills_score" REAL NOT NULL DEFAULT 0,
  "interest_score" REAL NOT NULL DEFAULT 0,
  "experience_score" REAL NOT NULL DEFAULT 0,
  "location_score" REAL NOT NULL DEFAULT 0,
  "preference_score" REAL NOT NULL DEFAULT 0,
  "match_reasons" TEXT,
  "potential_mismatches" TEXT,
  "status" TEXT NOT NULL DEFAULT 'matched' CHECK("status" IN ('matched', 'saved', 'pursuing', 'dismissed')),
  "surfaced_at" TEXT,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "unique_user_opportunity" UNIQUE ("user_id", "opportunity_id")
);

CREATE TABLE IF NOT EXISTS "user_opportunity_quota" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "week_start" TEXT NOT NULL,
  "recommendations_used" INTEGER NOT NULL DEFAULT 0,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL,
  CONSTRAINT "unique_user_week_quota" UNIQUE ("user_id", "week_start")
);

CREATE INDEX IF NOT EXISTS "idx_opportunities_status_deadline" ON "opportunities" ("status", "deadline");
CREATE INDEX IF NOT EXISTS "idx_opportunities_slug" ON "opportunities" ("slug");
CREATE INDEX IF NOT EXISTS "idx_opportunities_org_title" ON "opportunities" ("organization_name", "title");
CREATE INDEX IF NOT EXISTS "idx_user_matches_user_status" ON "user_opportunity_matches" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_user_matches_user_score" ON "user_opportunity_matches" ("user_id", "match_score" DESC);
CREATE INDEX IF NOT EXISTS "idx_sources_map_opp_id" ON "opportunity_sources_map" ("opportunity_id");
