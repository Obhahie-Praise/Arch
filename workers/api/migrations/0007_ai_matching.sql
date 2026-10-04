-- Migration number: 0007  AI matching columns for user_opportunity_matches

-- Add AI semantic match fields to existing matches table
ALTER TABLE "user_opportunity_matches" ADD COLUMN "ai_match_score" REAL;
ALTER TABLE "user_opportunity_matches" ADD COLUMN "ai_match_reasons" TEXT;
ALTER TABLE "user_opportunity_matches" ADD COLUMN "ai_match_gaps" TEXT;
ALTER TABLE "user_opportunity_matches" ADD COLUMN "ai_confidence" REAL;
ALTER TABLE "user_opportunity_matches" ADD COLUMN "ai_ran" INTEGER NOT NULL DEFAULT 0;

-- Eligibility status: 0 = unknown, 1 = eligible, -1 = ineligible
ALTER TABLE "user_opportunity_matches" ADD COLUMN "eligibility_status" INTEGER NOT NULL DEFAULT 0;

-- The ISO week key (YYYY-Www) this recommendation belongs to
ALTER TABLE "user_opportunity_matches" ADD COLUMN "week_key" TEXT;

-- Final blended score (deterministic + AI)
ALTER TABLE "user_opportunity_matches" ADD COLUMN "final_score" REAL NOT NULL DEFAULT 0;

-- Index for weekly recommendation queries
CREATE INDEX IF NOT EXISTS "idx_user_matches_week_key"
  ON "user_opportunity_matches" ("user_id", "week_key");

CREATE INDEX IF NOT EXISTS "idx_user_matches_final_score"
  ON "user_opportunity_matches" ("user_id", "final_score" DESC);
