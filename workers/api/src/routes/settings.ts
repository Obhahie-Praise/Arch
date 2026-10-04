import { Hono } from "hono";
import { createAuth, type Env } from "../auth";

export const settingsRouter = new Hono<{ Bindings: Env }>();

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserSettings {
  id: string;
  userId: string;
  matchingBreadth: "focused" | "balanced" | "broad";
  notifyNewMatches: number;
  notifyDeadlineReminders: number;
  notifySavedUpdates: number;
  notifyPursuingReminders: number;
  notifyEmail: number;
  createdAt: string;
  updatedAt: string;
}

type MatchingBreadth = "focused" | "balanced" | "broad";
const VALID_BREADTHS: MatchingBreadth[] = ["focused", "balanced", "broad"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultSettings(userId: string): Omit<UserSettings, "id" | "createdAt" | "updatedAt"> {
  return {
    userId,
    matchingBreadth: "balanced",
    notifyNewMatches: 1,
    notifyDeadlineReminders: 1,
    notifySavedUpdates: 1,
    notifyPursuingReminders: 1,
    notifyEmail: 0,
  };
}

function settingsToResponse(row: UserSettings) {
  return {
    matchingBreadth: row.matchingBreadth,
    notifications: {
      newMatches: row.notifyNewMatches === 1,
      deadlineReminders: row.notifyDeadlineReminders === 1,
      savedUpdates: row.notifySavedUpdates === 1,
      pursuingReminders: row.notifyPursuingReminders === 1,
      email: row.notifyEmail === 1,
    },
  };
}

// ─── GET /api/settings ───────────────────────────────────────────────────────

settingsRouter.get("/", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const userId = session.user.id;

  try {
    const row = await c.env.arch_db
      .prepare(`SELECT * FROM "user_settings" WHERE "userId" = ?`)
      .bind(userId)
      .first<UserSettings>();

    if (!row) {
      // Return defaults — we don't persist until the user actually saves
      return c.json({
        settings: settingsToResponse({
          id: "",
          ...defaultSettings(userId),
          createdAt: "",
          updatedAt: "",
        } as UserSettings),
      });
    }

    return c.json({ settings: settingsToResponse(row) });
  } catch (err: any) {
    return c.json({ error: "Failed to fetch settings", details: err.message }, 500);
  }
});

// ─── PUT /api/settings ───────────────────────────────────────────────────────

settingsRouter.put("/", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const userId = session.user.id;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // Validate matchingBreadth
  const matchingBreadth = (body.matchingBreadth as string) ?? "balanced";
  if (!VALID_BREADTHS.includes(matchingBreadth as MatchingBreadth)) {
    return c.json({ error: "Invalid matchingBreadth value" }, 400);
  }

  const notifications = (body.notifications as Record<string, boolean>) ?? {};
  const notifyNewMatches = notifications.newMatches !== false ? 1 : 0;
  const notifyDeadlineReminders = notifications.deadlineReminders !== false ? 1 : 0;
  const notifySavedUpdates = notifications.savedUpdates !== false ? 1 : 0;
  const notifyPursuingReminders = notifications.pursuingReminders !== false ? 1 : 0;
  const notifyEmail = notifications.email === true ? 1 : 0;

  const now = new Date().toISOString();

  try {
    const existing = await c.env.arch_db
      .prepare(`SELECT "id" FROM "user_settings" WHERE "userId" = ?`)
      .bind(userId)
      .first<{ id: string }>();

    if (existing) {
      await c.env.arch_db
        .prepare(
          `UPDATE "user_settings" SET
            "matchingBreadth" = ?,
            "notifyNewMatches" = ?,
            "notifyDeadlineReminders" = ?,
            "notifySavedUpdates" = ?,
            "notifyPursuingReminders" = ?,
            "notifyEmail" = ?,
            "updatedAt" = ?
          WHERE "userId" = ?`
        )
        .bind(
          matchingBreadth,
          notifyNewMatches,
          notifyDeadlineReminders,
          notifySavedUpdates,
          notifyPursuingReminders,
          notifyEmail,
          now,
          userId
        )
        .run();
    } else {
      await c.env.arch_db
        .prepare(
          `INSERT INTO "user_settings" (
            "id", "userId",
            "matchingBreadth",
            "notifyNewMatches", "notifyDeadlineReminders",
            "notifySavedUpdates", "notifyPursuingReminders", "notifyEmail",
            "createdAt", "updatedAt"
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(), userId,
          matchingBreadth,
          notifyNewMatches, notifyDeadlineReminders,
          notifySavedUpdates, notifyPursuingReminders, notifyEmail,
          now, now
        )
        .run();
    }

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Failed to save settings", details: err.message }, 500);
  }
});

// ─── DELETE /api/settings/account ────────────────────────────────────────────

settingsRouter.delete("/account", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const userId = session.user.id;

  try {
    // Delete in dependency order. user_settings and profiles have ON DELETE CASCADE
    // from "user", but we manually delete user-owned data first for clarity, then
    // delete the user record itself (which cascades the rest).

    await c.env.arch_db.batch([
      // settings
      c.env.arch_db.prepare(`DELETE FROM "user_settings" WHERE "userId" = ?`).bind(userId),
      // opportunity interactions
      c.env.arch_db.prepare(`DELETE FROM "user_opportunity_matches" WHERE "user_id" = ?`).bind(userId),
      c.env.arch_db.prepare(`DELETE FROM "user_opportunity_quota" WHERE "user_id" = ?`).bind(userId),
      // auth sessions & accounts (cascade from user, but be explicit)
      c.env.arch_db.prepare(`DELETE FROM "session" WHERE "userId" = ?`).bind(userId),
      c.env.arch_db.prepare(`DELETE FROM "account" WHERE "userId" = ?`).bind(userId),
      // profile (cascades child tables via FK ON DELETE CASCADE)
      c.env.arch_db.prepare(`DELETE FROM "profiles" WHERE "userId" = ?`).bind(userId),
      // finally remove the user record
      c.env.arch_db.prepare(`DELETE FROM "user" WHERE "id" = ?`).bind(userId),
    ]);

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Failed to delete account", details: err.message }, 500);
  }
});
