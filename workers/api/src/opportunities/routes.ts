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
      userId
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
    userId
  );

  return c.json({
    success: true,
    count: recommendations.length,
  });
});
