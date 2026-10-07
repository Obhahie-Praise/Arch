/**
 * MatchingService — Personalized opportunity recommendation engine.
 *
 * Pipeline per call:
 *  1. Load user profile + experiences
 *  2. Determine current ISO week key and inspect quota
 *  3. Return cached recommendations if quota is full
 *  4. Select candidate opportunities (DB-filtered, not web-searched)
 *  5. Hard eligibility check — exclude ineligible
 *  6. Deterministic scoring across all candidates
 *  7. Narrow to AI_CANDIDATE_LIMIT for AI evaluation
 *  8. AI semantic matching (with deterministic fallback on failure)
 *  9. Calculate final blended score
 * 10. Diversity ranking
 * 11. Persist up to remaining quota (idempotent via ON CONFLICT)
 * 12. Update weekly quota counter
 * 13. Return full week's recommendations sorted by final_score DESC
 */

import { getIsoWeekStart, getNowIso, isApproachingDeadline } from "../lib/dates";
import { scoreOpportunityForProfile } from "./ranking";
import { evaluateEligibility } from "./eligibility";
import { calculateFinalScore, calcDeadlineUrgency, calcFreshness } from "./scorer";
import { applyDiversityRanking } from "./diversity";
import { createMatchingAI, type MatchingProfile } from "../ai/matching";
import type {
  OpportunityRow,
  UserOpportunityQuotaRow,
  JoinedOpportunityMatchRow,
} from "../opportunities/types";
import { SeedDiscoverySource } from "../discovery/sources";
import { IngestionService } from "../discovery/service";
import { AI_CANDIDATE_LIMIT } from "./types";
import type { EligibilityStatus, AIMatchResult } from "./types";

// ─── ISO week key helper ────────────────────────────────────────────────────

/**
 * Returns an ISO week key string: "YYYY-Www" (e.g. "2026-W40").
 * This is the canonical week identifier used everywhere in the matching layer.
 */
function getIsoWeekKey(date: Date = new Date()): string {
  const weekStart = getIsoWeekStart(date);
  const d = new Date(weekStart);
  // ISO week number
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.ceil(
    ((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

// ─── Profile helpers ────────────────────────────────────────────────────────

function safeParseJsonArray(jsonStr: unknown): string[] {
  if (typeof jsonStr !== "string" || !jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function buildMatchingProfile(
  profile: Record<string, unknown> | null,
  experiences: Record<string, unknown>[]
): MatchingProfile {
  if (!profile) return {};

  const expSummary =
    experiences.length > 0
      ? experiences
          .slice(0, 5)
          .map((e) => `${e.role ?? "Role"} at ${e.organization ?? "Org"}`)
          .join("; ")
      : null;

  return {
    country: profile.country as string | null,
    city: profile.city as string | null,
    citizenship: profile.citizenship as string | null,
    studentStatus: profile.studentStatus as string | null,
    technicalSkills: safeParseJsonArray(profile.technicalSkills),
    nonTechnicalSkills: safeParseJsonArray(profile.nonTechnicalSkills),
    tools: safeParseJsonArray(profile.tools),
    desiredRoles: safeParseJsonArray(profile.desiredRoles),
    desiredIndustries: safeParseJsonArray(profile.desiredIndustries),
    opportunityTypes: safeParseJsonArray(profile.opportunityTypes),
    shortTermGoals: profile.shortTermGoals as string | null,
    longTermGoals: profile.longTermGoals as string | null,
    experienceSummary: expSummary,
  };
}

// ─── DB query helpers ───────────────────────────────────────────────────────

const JOINED_MATCH_QUERY = `
  SELECT o.*,
         m.status AS user_status,
         m.match_score,
         m.eligibility_score,
         m.skills_score,
         m.interest_score,
         m.experience_score,
         m.location_score,
         m.preference_score,
         m.match_reasons,
         m.potential_mismatches,
         m.ai_match_score,
         m.ai_match_reasons,
         m.ai_match_gaps,
         m.ai_confidence,
         m.ai_ran,
         m.eligibility_status,
         m.week_key,
         m.final_score
  FROM user_opportunity_matches m
  JOIN opportunities o ON m.opportunity_id = o.id
  WHERE m.user_id = ? AND m.status != 'dismissed'
  ORDER BY m.final_score DESC, m.match_score DESC
`;

// ─── MatchingService ────────────────────────────────────────────────────────

export class MatchingService {
  /**
   * Returns persisted weekly recommendations, generating new ones if quota is not full.
   * Idempotent: calling twice for the same user/week produces no duplicate rows.
   */
  static async getOrGenerateUserRecommendations(
    db: D1Database,
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ai?: any,
    isDeveloper: boolean = false
  ): Promise<JoinedOpportunityMatchRow[]> {
    const now = getNowIso();
    const currentWeekStart = getIsoWeekStart();
    const currentWeekKey = getIsoWeekKey();

    // 1. Get or create weekly quota record
    let quota = await db
      .prepare(
        `SELECT * FROM user_opportunity_quota WHERE user_id = ? AND week_start = ? LIMIT 1`
      )
      .bind(userId, currentWeekStart)
      .first<UserOpportunityQuotaRow>();

    if (!quota) {
      const quotaId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO user_opportunity_quota (id, user_id, week_start, recommendations_used, created_at, updated_at)
           VALUES (?, ?, ?, 0, ?, ?)
           ON CONFLICT (user_id, week_start) DO NOTHING`
        )
        .bind(quotaId, userId, currentWeekStart, now, now)
        .run();

      quota = await db
        .prepare(
          `SELECT * FROM user_opportunity_quota WHERE user_id = ? AND week_start = ? LIMIT 1`
        )
        .bind(userId, currentWeekStart)
        .first<UserOpportunityQuotaRow>();
    }

    const used = quota?.recommendations_used ?? 0;

    // 2. Fetch all existing recommendations (all time, non-dismissed) — no cap.
    const existingMatches = await db
      .prepare(`${JOINED_MATCH_QUERY}`)
      .bind(userId)
      .all<JoinedOpportunityMatchRow>();

    const existingResults = existingMatches.results ?? [];

    // No quota cap — the matching engine decides what is relevant.
    // remainingQuota bounds how many new items diversity-ranking will surface
    // per run (not a user-visible restriction). 10000 is effectively unlimited.
    const remainingQuota = 10000;

    // 3. Seed opportunities if table is empty
    const countRes = await db
      .prepare(`SELECT COUNT(*) as cnt FROM opportunities`)
      .first<{ cnt: number }>();

    if (!countRes || countRes.cnt === 0) {
      const seedSource = new SeedDiscoverySource();
      const seedInputs = await seedSource.discoverInputs();
      for (const input of seedInputs) {
        await IngestionService.ingestOpportunity(db, input, seedSource.id);
      }
    }

    // 4. Load user profile and experiences
    const profile = await db
      .prepare(`SELECT * FROM profiles WHERE userId = ? LIMIT 1`)
      .bind(userId)
      .first<Record<string, unknown>>();

    let experiences: Record<string, unknown>[] = [];
    if (profile?.id) {
      const expRes = await db
        .prepare(`SELECT * FROM profile_experiences WHERE profileId = ?`)
        .bind(profile.id as string)
        .all<Record<string, unknown>>();
      experiences = expRes.results ?? [];
    }

    const matchingProfile = buildMatchingProfile(profile, experiences);

    // 5. Fetch candidates — already-surfaced opportunities excluded
    const surfacedOppIds = new Set(existingResults.map((r) => r.id));

    // Build type-filter clause from user preferences (cost-effective DB pre-filter)
    const prefTypes = safeParseJsonArray(profile?.opportunityTypes);
    let typeClause = "";
    const typeBindings: string[] = [];
    if (prefTypes.length > 0 && prefTypes.length <= 6) {
      typeClause = `AND type IN (${prefTypes.map(() => "?").join(", ")})`;
      typeBindings.push(...prefTypes);
    }

    const candidatesLimit = isDeveloper ? 10000 : 200;

    const candidatesRes = await db
      .prepare(
        `SELECT * FROM opportunities
         WHERE status = 'active'
           AND (deadline IS NULL OR deadline >= date('now'))
           ${typeClause}
         ORDER BY first_seen_at DESC
         LIMIT ${candidatesLimit}`
      )
      .bind(...typeBindings)
      .all<OpportunityRow>();

    const candidates = (candidatesRes.results ?? []).filter((c) => !surfacedOppIds.has(c.id));

    if (candidates.length === 0 && existingResults.length > 0) {
      return existingResults;
    }

    // 6. Hard eligibility check + deterministic scoring
    type ScoredItem = {
      opp: OpportunityRow;
      eligibilityStatus: EligibilityStatus;
      deterministicScore: number;
      matchReasons: string[];
      potentialMismatches: string[];
      eligibilityScore: number;
      skillsScore: number;
      interestScore: number;
      goalsScore: number;
      experienceScore: number;
      locationScore: number;
      preferenceScore: number;
    };

    const eligibleCandidates: ScoredItem[] = [];

    for (const opp of candidates) {
      const eligibilityStatus = evaluateEligibility(
        {
          country: matchingProfile.country,
          city: matchingProfile.city,
          citizenship: matchingProfile.citizenship,
          studentStatus: matchingProfile.studentStatus,
        },
        opp
      );

      // Hard ineligible — skip entirely
      if (eligibilityStatus === -1) continue;

      const scoreBreakdown = scoreOpportunityForProfile(profile ?? null, experiences, opp);

      // Skip zero-score (e.g., deadline passed during scoring)
      if (scoreBreakdown.deterministicTotal === 0) continue;

      eligibleCandidates.push({
        opp,
        eligibilityStatus,
        deterministicScore: scoreBreakdown.deterministicTotal,
        matchReasons: scoreBreakdown.matchReasons,
        potentialMismatches: scoreBreakdown.potentialMismatches,
        eligibilityScore: scoreBreakdown.eligibilityScore,
        skillsScore: scoreBreakdown.skillsScore,
        interestScore: scoreBreakdown.interestScore,
        goalsScore: scoreBreakdown.goalsScore,
        experienceScore: scoreBreakdown.experienceScore,
        locationScore: scoreBreakdown.locationScore,
        preferenceScore: scoreBreakdown.preferenceScore,
      });
    }

    // Sort by deterministic score so we send the best candidates to AI
    eligibleCandidates.sort((a, b) => b.deterministicScore - a.deterministicScore);

    // 7. AI semantic matching (narrowed candidate pool)
    const matchingAI = createMatchingAI(ai);
    const aiCandidates = eligibleCandidates.slice(0, AI_CANDIDATE_LIMIT);
    const restCandidates = eligibleCandidates.slice(AI_CANDIDATE_LIMIT);

    type FinalItem = ScoredItem & {
      aiResult: AIMatchResult | null;
      finalScore: number;
      aiRan: boolean;
    };

    const finalItems: FinalItem[] = [];

    for (const item of aiCandidates) {
      let aiResult: AIMatchResult | null = null;
      try {
        aiResult = await matchingAI.evaluate(matchingProfile, item.opp);
      } catch {
        // AI failed for this candidate — continue with deterministic only
      }

      const aiScore = aiResult ? Math.round(aiResult.score * 100) : null;
      const { score: finalScore, aiRan } = calculateFinalScore({
        deterministicScore: item.deterministicScore,
        aiScore,
        eligibilityStatus: item.eligibilityStatus,
        deadlineUrgency: calcDeadlineUrgency(item.opp.deadline),
        freshness: calcFreshness(item.opp.first_seen_at),
      });

      finalItems.push({ ...item, aiResult, finalScore, aiRan });
    }

    // Remaining candidates (beyond AI limit) get deterministic-only final score
    for (const item of restCandidates) {
      const { score: finalScore, aiRan } = calculateFinalScore({
        deterministicScore: item.deterministicScore,
        aiScore: null,
        eligibilityStatus: item.eligibilityStatus,
        deadlineUrgency: calcDeadlineUrgency(item.opp.deadline),
        freshness: calcFreshness(item.opp.first_seen_at),
      });
      finalItems.push({ ...item, aiResult: null, finalScore, aiRan });
    }

    // 8. Diversity ranking
    const diverseRanked = applyDiversityRanking(
      finalItems.map((i) => ({ opp: i.opp, finalScore: i.finalScore, _item: i })) as Array<{
        opp: OpportunityRow;
        finalScore: number;
        _item: FinalItem;
      }>,
      remainingQuota
    );

    // 9. Persist recommendations
    let newSurfacedCount = 0;

    for (const { _item: item } of diverseRanked as Array<{ opp: OpportunityRow; finalScore: number; _item: FinalItem }>) {
      const matchId = crypto.randomUUID();
      const opp = item.opp;
      const aiResult = item.aiResult;

      const allReasons = [
        ...item.matchReasons,
        ...(aiResult?.strengths ?? []),
      ];
      const allMismatches = [
        ...item.potentialMismatches,
        ...(aiResult?.gaps ?? []),
      ];

      await db
        .prepare(
          `INSERT INTO user_opportunity_matches (
            id, user_id, opportunity_id,
            match_score, eligibility_score, skills_score,
            interest_score, experience_score, location_score, preference_score,
            match_reasons, potential_mismatches,
            ai_match_score, ai_match_reasons, ai_match_gaps, ai_confidence, ai_ran,
            eligibility_status, week_key, final_score,
            status, surfaced_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'matched', ?, ?, ?)
          ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
            match_score            = excluded.match_score,
            ai_match_score         = excluded.ai_match_score,
            ai_match_reasons       = excluded.ai_match_reasons,
            ai_match_gaps          = excluded.ai_match_gaps,
            ai_confidence          = excluded.ai_confidence,
            ai_ran                 = excluded.ai_ran,
            eligibility_status     = excluded.eligibility_status,
            final_score            = excluded.final_score,
            week_key               = COALESCE(user_opportunity_matches.week_key, excluded.week_key),
            surfaced_at            = COALESCE(user_opportunity_matches.surfaced_at, excluded.surfaced_at),
            updated_at             = excluded.updated_at`
        )
        .bind(
          matchId,
          userId,
          opp.id,
          item.deterministicScore,
          item.eligibilityScore,
          item.skillsScore,
          item.interestScore,
          item.experienceScore,
          item.locationScore,
          item.preferenceScore,
          JSON.stringify(allReasons.slice(0, 10)),
          JSON.stringify(allMismatches.slice(0, 10)),
          aiResult ? Math.round(aiResult.score * 100) : null,
          aiResult ? JSON.stringify(aiResult.strengths) : null,
          aiResult ? JSON.stringify(aiResult.gaps) : null,
          aiResult ? aiResult.confidence : null,
          item.aiRan ? 1 : 0,
          item.eligibilityStatus,
          currentWeekKey,
          item.finalScore,
          now,
          now,
          now
        )
        .run();

      newSurfacedCount++;
    }

    // 10. Update quota counter
    if (newSurfacedCount > 0 && quota) {
      await db
        .prepare(
          `UPDATE user_opportunity_quota
           SET recommendations_used = recommendations_used + ?, updated_at = ?
           WHERE user_id = ? AND week_start = ?`
        )
        .bind(newSurfacedCount, now, userId, currentWeekStart)
        .run();
    }

    // 11. Return complete set for this week
    // 11. Return all matches for this user (no cap — users see every match).
    const finalMatches = await db
      .prepare(`${JOINED_MATCH_QUERY}`)
      .bind(userId)
      .all<JoinedOpportunityMatchRow>();

    return finalMatches.results ?? [];
  }
}
