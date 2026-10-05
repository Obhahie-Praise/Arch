import { Hono } from "hono";
import { createAuth, type Env } from "../auth";
import { MatchingService } from "../matching/service";
import { OpportunityService } from "./service";
import { OpportunityRepository } from "./repository";
import { ChatRepository } from "./chat-repository";
import { DiscoveryPipeline } from "../discovery/pipeline";
import { createAIProvider } from "../ai/provider";
import type { OpportunityType } from "./types";

export const opportunitiesRouter = new Hono<{ Bindings: Env }>();

// Middleware / Auth helper — returns user ID only
async function getAuthUserId(c: any): Promise<string | null> {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session || !session.user) return null;
  return session.user.id;
}

// Auth helper that returns both ID and email (needed for developer detection)
async function getAuthSession(c: any): Promise<{ id: string; email: string } | null> {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session || !session.user) return null;
  return { id: session.user.id, email: session.user.email };
}

// Security helper for internal engine endpoints
function isInternalAuthorized(c: any): boolean {
  const secret = c.req.header("X-Internal-Secret");
  const envSecret = c.env.INTERNAL_ENGINE_SECRET;
  // In local dev without a secret configured, allow localhost callers only
  if (!envSecret) {
    const origin = c.req.header("origin") || c.req.header("referer") || "";
    return origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1");
  }
  return secret === envSecret;
}

// GET /api/opportunities - Get recommendations for current user
opportunitiesRouter.get("/", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session || !session.user) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }
  const userId = session.user.id;
  const userEmail = session.user.email;

  // Developer check is server-side only — never trust client input for this.
  const isDeveloper =
    !!c.env.DEVELOPER_ACCESS_EMAIL && userEmail === c.env.DEVELOPER_ACCESS_EMAIL;

  try {
    const typeFilter = c.req.query("type") as OpportunityType | undefined;
    const searchFilter = c.req.query("search")?.toLowerCase();
    // matched=true is a developer-only filter — only honoured when isDeveloper is true.
    const matchedOnly = isDeveloper && c.req.query("matched") === "true";

    // pageSize is fixed server-side. Clients cannot influence it.
    const PAGE_SIZE = 30;
    const requestedPage = parseInt(c.req.query("page") || "1", 10);
    const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1;

    let formatted: ReturnType<typeof OpportunityService.formatOpportunity>[];

    if (isDeveloper) {
      // ── DEVELOPER PATH ─────────────────────────────────────────────────────
      // Return every active opportunity in the database regardless of whether it
      // matches the developer's profile. Matching data is used only as optional
      // enrichment: if a match record exists, its score is shown; if not, the
      // opportunity still appears but with no score.

      // 1. Fetch the complete active inventory from DB (all columns needed for
      //    formatOpportunity, which operates on OpportunityRow-shaped objects).
      const allOppsRes = await c.env.arch_db
        .prepare(
          `SELECT * FROM opportunities
           WHERE status = 'active'
             AND (deadline IS NULL OR deadline >= date('now'))
           ORDER BY first_seen_at DESC`
        )
        .all<import("./types").OpportunityRow>();

      const allOpps = allOppsRes.results ?? [];

      // 2. Fetch all existing match records for this user in one query so we can
      //    look them up by opportunity_id without N+1 queries.
      const matchRes = await c.env.arch_db
        .prepare(
          `SELECT * FROM user_opportunity_matches WHERE user_id = ? AND status != 'dismissed'`
        )
        .bind(userId)
        .all<import("./types").UserOpportunityMatchRow>();

      const matchByOppId = new Map(
        (matchRes.results ?? []).map((m) => [m.opportunity_id, m])
      );

      // 3. Merge: every opportunity gets its match record (or null).
      //    formatOpportunity gracefully handles null match → matchScore undefined.
      formatted = allOpps.map((opp) => {
        const match = matchByOppId.get(opp.id) ?? null;
        return OpportunityService.formatOpportunity(opp, match);
      });
    } else {
      // ── NORMAL USER PATH ───────────────────────────────────────────────────
      // Normal users see only the opportunities surfaced by the matching engine,
      // capped at WEEKLY_QUOTA (30). This path is intentionally unchanged.
      const rawRecommendations = await MatchingService.getOrGenerateUserRecommendations(
        c.env.arch_db,
        userId,
        c.env.AI,
        false
      );

      formatted = rawRecommendations.map((row) =>
        OpportunityService.formatOpportunity(row, row)
      );

      // Hard-cap: defence-in-depth against any future MatchingService changes.
      formatted = formatted.slice(0, 30);
    }

    // ── SHARED FILTERING (applies to both paths) ──────────────────────────────
    if (typeFilter) {
      formatted = formatted.filter((item) => item.type === typeFilter);
    }

    if (searchFilter) {
      formatted = formatted.filter((opp) => {
        const haystack = [
          opp.title,
          opp.organizationName,
          opp.description,
          opp.type,
          ...(opp.skills ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchFilter);
      });
    }

    // Developer-only: restrict to opportunities that have a valid profile match score.
    // matchedOnly is always false for normal users (enforced above).
    if (matchedOnly) {
      formatted = formatted.filter(
        (opp) => opp.matchScore != null && opp.matchScore > 0
      );
    }

    // ── PAGINATION ────────────────────────────────────────────────────────────
    const total = formatted.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;
    const paginatedData = formatted.slice(offset, offset + PAGE_SIZE);

    return c.json({
      data: paginatedData,
      meta: {
        total,
        weeklyLimit: isDeveloper ? "unlimited" : 30,
        isDeveloper,
      },
      pagination: {
        page: safePage,
        pageSize: PAGE_SIZE,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrevious: safePage > 1,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[opportunities/] error:", err);
    return c.json({ error: { code: "ENGINE_ERROR", message: msg } }, 500);
  }
});

// GET /api/opportunities/saved - Get saved opportunities
opportunitiesRouter.get("/saved", async (c) => {
  const user = await getAuthSession(c);
  if (!user) {
    return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);
  }

  const isDeveloper =
    !!c.env.DEVELOPER_ACCESS_EMAIL && user.email === c.env.DEVELOPER_ACCESS_EMAIL;

  const rows = await OpportunityRepository.listUserSaved(c.env.arch_db, user.id);
  let formatted = rows.map((row) => OpportunityService.formatOpportunity(row, row));

  // Developer-only matched filter — normal users cannot activate this param.
  const matchedOnly = isDeveloper && c.req.query("matched") === "true";
  if (matchedOnly) {
    formatted = formatted.filter(
      (opp) => opp.matchScore != null && opp.matchScore > 0
    );
  }

  return c.json({
    data: formatted,
    meta: { isDeveloper },
  });
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

// GET /api/opportunities/:id/chat - Get conversation and messages
opportunitiesRouter.get("/:id/chat", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);

  const id = c.req.param("id");
  const details = await OpportunityService.getDetails(c.env.arch_db, userId, id);
  
  if (!details || (details.userStatus !== "saved" && details.userStatus !== "pursuing")) {
    return c.json({ error: { code: "FORBIDDEN", message: "Opportunity not saved" } }, 403);
  }

  let conversation = await ChatRepository.getConversation(c.env.arch_db, userId, id);
  if (!conversation) {
    conversation = await ChatRepository.createConversation(c.env.arch_db, userId, id);
  }

  const messages = await ChatRepository.getMessages(c.env.arch_db, conversation.id);
  
  return c.json({ data: { conversation, messages, opportunity: details } });
});

// POST /api/opportunities/:id/chat/messages - Send message
opportunitiesRouter.post("/:id/chat/messages", async (c) => {
  const userId = await getAuthUserId(c);
  if (!userId) return c.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, 401);

  const id = c.req.param("id");

  let body: { content?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }
  const { content } = body;
  if (!content?.trim()) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Message content required" } }, 400);
  }

  const details = await OpportunityService.getDetails(c.env.arch_db, userId, id);
  if (!details || (details.userStatus !== "saved" && details.userStatus !== "pursuing")) {
    return c.json({ error: { code: "FORBIDDEN", message: "Opportunity not saved" } }, 403);
  }

  let conversation = await ChatRepository.getConversation(c.env.arch_db, userId, id);
  if (!conversation) {
    conversation = await ChatRepository.createConversation(c.env.arch_db, userId, id);
  }

  // Persist the user message before calling AI so it is saved even if AI fails
  await ChatRepository.addMessage(c.env.arch_db, conversation.id, "user", content.trim());

  const dbMessages = await ChatRepository.getMessages(c.env.arch_db, conversation.id);

  // Load user profile for context-aware answers ("Am I eligible?" etc.)
  const userProfile = await c.env.arch_db
    .prepare(`SELECT * FROM profiles WHERE "userId" = ? LIMIT 1`)
    .bind(userId)
    .first<Record<string, unknown>>();

  let userSkills: string[] = [];
  try { userSkills = JSON.parse((userProfile?.technicalSkills as string) || "[]"); } catch {}

  // Build a rich system prompt scoped to this specific opportunity.
  // Only include fields that are actually populated to avoid confusing the model.
  const oppLines: string[] = [
    `Title: ${details.title}`,
    `Organization: ${details.organizationName}`,
    `Type: ${details.type}`,
  ];
  if (details.description) oppLines.push(`Description: ${details.description}`);
  if (details.location) oppLines.push(`Location: ${details.location}`);
  if (details.isRemote) oppLines.push(`Remote: Yes`);
  if (details.deadline) oppLines.push(`Deadline: ${details.deadline}`);
  if (details.eligibility?.length) oppLines.push(`Eligibility: ${details.eligibility.join("; ")}`);
  if (details.requirements?.length) oppLines.push(`Requirements: ${details.requirements.join("; ")}`);
  if (details.skills?.length) oppLines.push(`Relevant skills: ${details.skills.join(", ")}`);
  if (details.benefits?.length) oppLines.push(`Benefits: ${details.benefits.join(", ")}`);
  if (details.applicationUrl) oppLines.push(`Application URL: ${details.applicationUrl}`);

  const profileLines: string[] = [];
  if (userProfile?.fullName) profileLines.push(`Name: ${userProfile.fullName}`);
  if (userProfile?.bio) profileLines.push(`Bio: ${userProfile.bio as string}`);
  if (userSkills.length) profileLines.push(`Technical skills: ${userSkills.join(", ")}`);

  const systemContext = [
    "You are Arch's opportunity assistant. You help users understand and prepare for a specific opportunity.",
    "Answer questions using ONLY the information provided below.",
    "If something is not specified, say so clearly rather than guessing.",
    "Stay focused on this opportunity. Do not discuss other opportunities or unrelated topics.",
    "",
    "OPPORTUNITY:",
    ...oppLines,
    "",
    "USER PROFILE:",
    profileLines.length ? profileLines.join("\n") : "No profile information available.",
  ].join("\n");

  const aiMessages = [
    { role: "system" as const, content: systemContext },
    ...dbMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  try {
    const aiProvider = createAIProvider(c.env.AI);
    const result = await aiProvider.streamChat(aiMessages);

    // streamChat now always returns a string (non-streaming mode)
    const responseText = typeof result === "string" ? result : "";

    if (!responseText) {
      console.error("[chat/messages] AI returned empty text for opportunity", id);
      return c.json(
        { error: { code: "AI_EMPTY_RESPONSE", message: "The AI returned an empty response. Please try again." } },
        502
      );
    }

    await ChatRepository.addMessage(c.env.arch_db, conversation.id, "assistant", responseText);
    return c.json({ data: { message: responseText } });
  } catch (err) {
    console.error("[chat/messages] Unexpected error for opportunity", id, err);
    return c.json(
      { error: { code: "AI_ERROR", message: "Failed to generate a response. Please try again." } },
      502
    );
  }
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
