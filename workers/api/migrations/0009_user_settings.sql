-- Migration number: 0009  User settings table

CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,

  -- Matching / AI preferences
  "matchingBreadth" TEXT NOT NULL DEFAULT 'balanced'
    CHECK("matchingBreadth" IN ('focused', 'balanced', 'broad')),

  -- Notification preferences (stored as booleans: 1 = enabled)
  "notifyNewMatches" INTEGER NOT NULL DEFAULT 1,
  "notifyDeadlineReminders" INTEGER NOT NULL DEFAULT 1,
  "notifySavedUpdates" INTEGER NOT NULL DEFAULT 1,
  "notifyPursuingReminders" INTEGER NOT NULL DEFAULT 1,
  "notifyEmail" INTEGER NOT NULL DEFAULT 0,

  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_user_settings_user"
  ON "user_settings" ("userId");
