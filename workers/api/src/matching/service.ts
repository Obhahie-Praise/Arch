import { getIsoWeekStart, getNowIso } from "../lib/dates";
import { scoreOpportunityForProfile } from "./ranking";
import type {
  OpportunityRow,
  UserOpportunityQuotaRow,
  JoinedOpportunityMatchRow,
} from "../opportunities/types";
import { SeedDiscoverySource } from "../discovery/sources";
import { IngestionService } from "../discovery/service";

export class MatchingService {
  /**
   * Generates or retrieves a user's 30 weekly recommendations.
   * Strictly enforces the max 30 recommendations per user per ISO week limit.
   */
  static async getOrGenerateUserRecommendations(
    db: D1Database,
    userId: string
  ): Promise<JoinedOpportunityMatchRow[]> {
    const now = getNowIso();
    const currentWeekStart = getIsoWeekStart();

    // 1. Get or create weekly quota record
    let quota = await db
      .prepare(`SELECT * FROM user_opportunity_quota WHERE user_id = ? AND week_start = ? LIMIT 1`)
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
        .prepare(`SELECT * FROM user_opportunity_quota WHERE user_id = ? AND week_start = ? LIMIT 1`)
        .bind(userId, currentWeekStart)
        .first<UserOpportunityQuotaRow>();
    }

    const used = quota ? quota.recommendations_used : 0;

    // Helper query for joining matches and opportunities
    const getJoinedMatchesQuery = `
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
             m.potential_mismatches
      FROM user_opportunity_matches m
      JOIN opportunities o ON m.opportunity_id = o.id
      WHERE m.user_id = ? AND m.status != 'dismissed'
      ORDER BY m.match_score DESC
    `;

    // 2. Fetch existing surfaced matches for this week
    const existingMatches = await db
      .prepare(getJoinedMatchesQuery)
      .bind(userId)
      .all<JoinedOpportunityMatchRow>();

    const existingResults = existingMatches.results || [];

    // If user has already reached 30 recommendations or has enough surfaced matches for this week
    if (used >= 30 || existingResults.length >= 30) {
      return existingResults.slice(0, 30);
    }

    // 3. Need to generate new recommendations up to remaining quota
    const remainingQuota = 30 - used;

    // First check if opportunities table is empty, if so, seed initial opportunities
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

    // Exclude already surfaced opportunity IDs for this user
    const surfacedOppIds = new Set(existingResults.map((r) => r.id));

    // Fetch candidates from opportunities table
    const candidatesRes = await db
      .prepare(
        `SELECT * FROM opportunities
         WHERE status = 'active'
           AND (deadline IS NULL OR deadline >= date('now'))
         ORDER BY created_at DESC LIMIT 100`
      )
      .all<OpportunityRow>();

    const candidates = (candidatesRes.results || []).filter((c) => !surfacedOppIds.has(c.id));

    if (candidates.length === 0 && existingResults.length > 0) {
      return existingResults;
    }

    // Fetch user profile and experiences for scoring
    const profile = await db
      .prepare(`SELECT * FROM profiles WHERE userId = ? LIMIT 1`)
      .bind(userId)
      .first<Record<string, unknown>>();

    let experiences: Record<string, unknown>[] = [];
    if (profile && profile.id) {
      const expRes = await db
        .prepare(`SELECT * FROM profile_experiences WHERE profileId = ?`)
        .bind(profile.id as string)
        .all<Record<string, unknown>>();
      experiences = expRes.results || [];
    }

    // Score candidates
    const scoredCandidates = candidates.map((opp) => {
      const scoreData = scoreOpportunityForProfile(profile, experiences, opp);
      return {
        opp,
        scoreData,
      };
    });

    // Rank candidates by totalScore DESC
    scoredCandidates.sort((a, b) => b.scoreData.totalScore - a.scoreData.totalScore);

    // Pick top candidates up to remainingQuota
    const selected = scoredCandidates.slice(0, remainingQuota);

    // Insert new matches into user_opportunity_matches and update quota
    let newSurfacedCount = 0;

    for (const item of selected) {
      const matchId = crypto.randomUUID();
      const opp = item.opp;
      const sd = item.scoreData;

      await db
        .prepare(
          `INSERT INTO user_opportunity_matches (
            id, user_id, opportunity_id, match_score, eligibility_score, skills_score,
            interest_score, experience_score, location_score, preference_score,
            match_reasons, potential_mismatches, status, surfaced_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'matched', ?, ?, ?)
          ON CONFLICT (user_id, opportunity_id) DO UPDATE SET
            match_score = excluded.match_score,
            surfaced_at = COALESCE(user_opportunity_matches.surfaced_at, excluded.surfaced_at),
            updated_at = excluded.updated_at`
        )
        .bind(
          matchId,
          userId,
          opp.id,
          sd.totalScore,
          sd.eligibilityScore,
          sd.skillsScore,
          sd.interestScore,
          sd.experienceScore,
          sd.locationScore,
          sd.preferenceScore,
          JSON.stringify(sd.matchReasons),
          JSON.stringify(sd.potentialMismatches),
          now,
          now,
          now
        )
        .run();

      newSurfacedCount++;
    }

    // Update quota
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

    // Fetch and return complete surfaced set
    const finalMatches = await db
      .prepare(`${getJoinedMatchesQuery} LIMIT 30`)
      .bind(userId)
      .all<JoinedOpportunityMatchRow>();

    return finalMatches.results || [];
  }
}
