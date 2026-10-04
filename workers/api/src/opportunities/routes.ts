import { Hono } from "hono";
import { createAuth, type Env } from "../auth";
import { MatchingService } from "../matching/service";
import { OpportunityService } from "./service";
import { OpportunityRepository } from "./repository";
import { DiscoveryPipeline } from "../discovery/pipeline";
import type { OpportunityType } from "./types";

export const opportunitiesRouter = new Hono<{ Bindings: Env }>();

// Middleware / Auth helper
async function getAuthUserId(c: any): Promise<string | null> {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session || !session.user) return null;
  return session.user.id;
}

// Security helper for internal engine endpoints
function isInternalAuthorized(c: any): boolean {
  const secret = c.req.header("X-Internal-Secret");
  const envSecret = c.env.INTERNAL_ENGINE_SECRET || "arch-internal-local-secret";
  return secret === envSecret || c.env.ENVIRONMENT === "development" || !c.env.INTERNAL_ENGINE_SECRET;
}

// GET /api/opportunities - Get 30 weekly recommendations for current user
opportunitiesRouter.get("/", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  try {
    const typeFilter = c.req.query("type") as OpportunityType | undefined;
    const rawRecommendations = await MatchingService.getOrGenerateUserRecommendations(
      c.env.arch_db,
      userId,
      c.env.AI
    );

    let formatted = rawRecommendations.map((row) => OpportunityService.formatOpportunity(row, row));

    if (typeFilter) {
      formatted = formatted.filter((item) => item.type === typeFilter);
    }

    return c.json({
      data: formatted,
      meta: {
        total: formatted.length,
        weeklyLimit: 30,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return c.json({ error: { code: "ENGINE_ERROR", message: msg } }, 500);
  }
});

// GET /api/opportunities/saved - Get saved opportunities
opportunitiesRouter.get("/saved", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const rows = await OpportunityRepository.listUserSaved(c.env.arch_db, userId);
  const formatted = rows.map((row) => OpportunityService.formatOpportunity(row, row));
  return c.json({ data: formatted });
});

// GET /api/opportunities/pursuing - Get pursuing opportunities
opportunitiesRouter.get("/pursuing", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const rows = await OpportunityRepository.listUserPursuing(c.env.arch_db, userId);
  const formatted = rows.map((row) => OpportunityService.formatOpportunity(row, row));
  return c.json({ data: formatted });
});

// GET /api/opportunities/home - Aggregated Home dashboard data
opportunitiesRouter.get("/home", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const db = c.env.arch_db;

  // Fetch all in parallel for efficiency
  const [matchRows, savedRows, pursuingRows, discoveryRuns] = await Promise.all([
    // All matched/recommended for this user
    db
      .prepare(
        `SELECT o.*, m.status AS user_status, m.match_score, m.eligibility_score, m.skills_score,
                m.interest_score, m.experience_score, m.location_score, m.preference_score,
                m.match_reasons, m.potential_mismatches, m.ai_match_score, m.ai_match_reasons,
                m.ai_match_gaps, m.ai_confidence, m.ai_ran, m.eligibility_status, m.week_key,
                m.final_score, m.surfaced_at, m.id AS match_id
         FROM user_opportunity_matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = ? AND m.status NOT IN ('dismissed')
         ORDER BY m.final_score DESC, m.updated_at DESC`
      )
      .bind(userId)
      .all<any>(),
    // Saved
    db
      .prepare(
        `SELECT o.*, m.status AS user_status, m.match_score, m.eligibility_score, m.skills_score,
                m.interest_score, m.experience_score, m.location_score, m.preference_score,
                m.match_reasons, m.potential_mismatches
         FROM user_opportunity_matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = ? AND m.status = 'saved'
         ORDER BY m.updated_at DESC LIMIT 5`
      )
      .bind(userId)
      .all<any>(),
    // Pursuing count
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM user_opportunity_matches
         WHERE user_id = ? AND status = 'pursuing'`
      )
      .bind(userId)
      .first<{ count: number }>(),
    // Discovery runs last 7 days
    db
      .prepare(
        `SELECT date(started_at) AS day, SUM(opportunities_created) AS created
         FROM discovery_runs
         WHERE started_at >= date('now', '-7 days')
           AND status = 'completed'
         GROUP BY date(started_at)
         ORDER BY day ASC`
      )
      .all<{ day: string; created: number }>(),
  ]);

  const allMatches = matchRows.results || [];
  const savedList = savedRows.results || [];
  const pursuingCount = pursuingRows?.count || 0;

  const matchCount = allMatches.length;
  const savedCount = savedList.length;

  // Format recent matches (top 3 by score)
  const recentMatches = allMatches
    .slice(0, 3)
    .map((row) => OpportunityService.formatOpportunity(row, row));

  // Format saved list
  const recentSaved = savedList.map((row) => OpportunityService.formatOpportunity(row, row));

  // Timeline: saved opportunities with upcoming deadlines (not expired)
  const timelineRows = savedList.filter((row) => row.deadline && row.deadline >= new Date().toISOString().substring(0, 10));
  const timeline = timelineRows.map((row) => {
    const deadlineDate = new Date(row.deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const urgency = daysLeft <= 7 ? "high" : daysLeft <= 21 ? "medium" : "low";
    // percentRemaining relative to a ~30-day window
    const percentRemaining = Math.min(100, Math.round((daysLeft / 30) * 100));
    return {
      id: row.id,
      title: row.title,
      organization: row.organization_name,
      deadline: row.deadline,
      daysLeft,
      label: daysLeft === 0 ? "Today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`,
      urgency,
      percentRemaining,
    };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  // Discovery chart: fill missing days with 0
  const chartData: { day: string; created: number }[] = [];
  const runsByDay = new Map((discoveryRuns.results || []).map((r) => [r.day, r.created]));
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0, 10);
    chartData.push({ day: key, created: runsByDay.get(key) || 0 });
  }

  return c.json({
    data: {
      metrics: {
        matches: matchCount,
        saved: savedCount,
        pursuing: pursuingCount,
      },
      recentMatches,
      recentSaved,
      timeline,
      discoveryChart: chartData,
    },
  });
});


// GET /api/opportunities/:id - Get details of single opportunity
opportunitiesRouter.get("/:id", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const details = await OpportunityService.getDetails(c.env.arch_db, userId, id);
  if (!details) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({ data: details });
});

// GET /api/opportunities/:id/match - Get match score breakdown
opportunitiesRouter.get("/:id/match", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const details = await OpportunityService.getDetails(c.env.arch_db, userId, id);
  if (!details) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({
    data: {
      opportunityId: details.id,
      matchScore: details.matchScore || 0,
      matchReasons: details.matchReasons || [],
      potentialMismatches: details.potentialMismatches || [],
      userStatus: details.userStatus,
    },
  });
});

// POST /api/opportunities/:id/save - Save opportunity
opportunitiesRouter.post("/:id/save", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const success = await OpportunityService.saveOpportunity(c.env.arch_db, userId, id);
  if (!success) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({ success: true, status: "saved" });
});

// DELETE /api/opportunities/:id/save - Unsave opportunity
opportunitiesRouter.delete("/:id/save", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const success = await OpportunityService.unsaveOpportunity(c.env.arch_db, userId, id);
  if (!success) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({ success: true, status: "matched" });
});

// POST /api/opportunities/:id/pursue - Pursue opportunity
opportunitiesRouter.post("/:id/pursue", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const success = await OpportunityService.pursueOpportunity(c.env.arch_db, userId, id);
  if (!success) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({ success: true, status: "pursuing" });
});

// DELETE /api/opportunities/:id/pursue - Unpursue opportunity
opportunitiesRouter.delete("/:id/pursue", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const success = await OpportunityService.unpursueOpportunity(c.env.arch_db, userId, id);
  if (!success) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({ success: true, status: "saved" });
});

// POST /api/opportunities/:id/dismiss - Dismiss opportunity
opportunitiesRouter.post("/:id/dismiss", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const id = c.req.param("id");
  const success = await OpportunityService.dismissOpportunity(c.env.arch_db, userId, id);
  if (!success) {
    return c.json({ error: { code: "OPPORTUNITY_NOT_FOUND", message: "Opportunity not found" } }, 404);
  }

  return c.json({ success: true, status: "dismissed" });
});

// INTERNAL / ENGINE ENDPOINTS

// POST /api/internal/discovery/run - Run opportunity discovery & ingestion pipeline
opportunitiesRouter.post("/internal/discovery/run", async (c) => {
  if (!isInternalAuthorized(c)) {
    return c.json({ error: { code: "FORBIDDEN", message: "Internal access unauthorized" } }, 403);
  }

  const providerId = c.req.query("providerId");
  const summary = await DiscoveryPipeline.runPipeline(c.env.arch_db, c.env as unknown as Record<string, unknown>, {
    providerId,
  });

  return c.json({
    success: summary.status === "completed",
    summary,
  });
});

// POST /api/internal/opportunities/refresh - Run expiration & freshness check
opportunitiesRouter.post("/internal/opportunities/refresh", async (c) => {
  if (!isInternalAuthorized(c)) {
    return c.json({ error: { code: "FORBIDDEN", message: "Internal access unauthorized" } }, 403);
  }

  const expiredCount = await OpportunityRepository.expirePastDeadline(c.env.arch_db);
  return c.json({
    success: true,
    expiredCount,
  });
});

// POST /api/internal/matching/run - Trigger recommendation matching run
opportunitiesRouter.post("/internal/matching/run", async (c) => {
  if (!isInternalAuthorized(c)) {
    return c.json({ error: { code: "FORBIDDEN", message: "Internal access unauthorized" } }, 403);
  }

  const userId = await getAuthUserId(c);
  if (!userId) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const recommendations = await MatchingService.getOrGenerateUserRecommendations(
    c.env.arch_db,
    userId,
    c.env.AI
  );

  return c.json({
    success: true,
    count: recommendations.length,
  });
});
