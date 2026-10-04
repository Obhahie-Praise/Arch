-- Migration number: 0005 	 Discovery Pipeline tracking & query configuration tables

CREATE TABLE IF NOT EXISTS "discovery_runs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "provider_id" TEXT NOT NULL,
  "started_at" TEXT NOT NULL,
  "completed_at" TEXT,
  "status" TEXT NOT NULL DEFAULT 'running' CHECK("status" IN ('running', 'completed', 'failed')),
  "candidates_found" INTEGER DEFAULT 0,
  "pages_fetched" INTEGER DEFAULT 0,
  "opportunities_created" INTEGER DEFAULT 0,
  "opportunities_updated" INTEGER DEFAULT 0,
  "opportunities_rejected" INTEGER DEFAULT 0,
  "errors" TEXT, -- JSON array of string error logs
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "discovery_queries" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "type" TEXT NOT NULL CHECK("type" IN ('job', 'grant', 'hackathon', 'fellowship', 'competition', 'funding', 'other')),
  "query" TEXT NOT NULL,
  "enabled" INTEGER DEFAULT 1,
  "priority" INTEGER DEFAULT 1,
  "created_at" TEXT NOT NULL,
  "updated_at" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_discovery_runs_status" ON "discovery_runs" ("status");
CREATE INDEX IF NOT EXISTS "idx_discovery_runs_started" ON "discovery_runs" ("started_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_discovery_queries_enabled_type" ON "discovery_queries" ("enabled", "type");

CREATE INDEX IF NOT EXISTS "idx_opportunities_type" ON "opportunities" ("type");
CREATE INDEX IF NOT EXISTS "idx_opportunities_last_verified" ON "opportunities" ("last_verified_at");
CREATE INDEX IF NOT EXISTS "idx_sources_map_source_url" ON "opportunity_sources_map" ("source_url");
