-- Migration number: 0006 	 AI Extractions metrics tracking for discovery_runs

ALTER TABLE "discovery_runs" ADD COLUMN "ai_extractions_attempted" INTEGER DEFAULT 0;
ALTER TABLE "discovery_runs" ADD COLUMN "ai_extractions_succeeded" INTEGER DEFAULT 0;
ALTER TABLE "discovery_runs" ADD COLUMN "ai_extractions_failed" INTEGER DEFAULT 0;
