-- Migration number: 0011	 Index opportunities.first_seen_at for discovery chart query
--
-- The /api/opportunities/home discovery chart query groups all rows in the
-- opportunities table by date(first_seen_at). Without an index the query
-- performs a full table scan on every request. This index lets SQLite/D1
-- satisfy the WHERE first_seen_at >= ... and the GROUP BY date(first_seen_at)
-- without reading every row.
CREATE INDEX IF NOT EXISTS "idx_opportunities_first_seen_at" ON "opportunities" ("first_seen_at");
