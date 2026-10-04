import type {
  OpportunityRow,
  UserOpportunityMatchRow,
  JoinedOpportunityMatchRow,
  OpportunitySourceRow,
  UserOpportunityStatus,
} from "./types";
import { getNowIso } from "../lib/dates";

export class OpportunityRepository {
  static async getById(db: D1Database, id: string): Promise<OpportunityRow | null> {
    return await db
      .prepare(`SELECT * FROM opportunities WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<OpportunityRow>();
  }

  static async getBySlug(db: D1Database, slug: string): Promise<OpportunityRow | null> {
    return await db
      .prepare(`SELECT * FROM opportunities WHERE slug = ? LIMIT 1`)
      .bind(slug)
      .first<OpportunityRow>();
  }

  static async getUserMatch(
    db: D1Database,
    userId: string,
    opportunityId: string
  ): Promise<UserOpportunityMatchRow | null> {
    return await db
      .prepare(
        `SELECT * FROM user_opportunity_matches
         WHERE user_id = ? AND opportunity_id = ? LIMIT 1`
      )
      .bind(userId, opportunityId)
      .first<UserOpportunityMatchRow>();
  }

  static async updateUserMatchStatus(
    db: D1Database,
    userId: string,
    opportunityId: string,
    status: UserOpportunityStatus
  ): Promise<boolean> {
    const now = getNowIso();
    const existing = await this.getUserMatch(db, userId, opportunityId);

    if (existing) {
      const res = await db
        .prepare(
          `UPDATE user_opportunity_matches
           SET status = ?, updated_at = ?
           WHERE user_id = ? AND opportunity_id = ?`
        )
        .bind(status, now, userId, opportunityId)
        .run();
      return res.success;
    } else {
      // Create match record if not exists
      const id = crypto.randomUUID();
      const res = await db
        .prepare(
          `INSERT INTO user_opportunity_matches (
            id, user_id, opportunity_id, match_score, status, surfaced_at, created_at, updated_at
          ) VALUES (?, ?, ?, 50, ?, ?, ?, ?)`
        )
        .bind(id, userId, opportunityId, status, now, now, now)
        .run();
      return res.success;
    }
  }

  static async listUserSaved(db: D1Database, userId: string): Promise<JoinedOpportunityMatchRow[]> {
    const res = await db
      .prepare(
        `SELECT o.*, m.status AS user_status, m.match_score, m.eligibility_score, m.skills_score,
                m.interest_score, m.experience_score, m.location_score, m.preference_score,
                m.match_reasons, m.potential_mismatches
         FROM user_opportunity_matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = ? AND m.status = 'saved'
         ORDER BY m.updated_at DESC`
      )
      .bind(userId)
      .all<JoinedOpportunityMatchRow>();
    return res.results || [];
  }

  static async listUserPursuing(db: D1Database, userId: string): Promise<JoinedOpportunityMatchRow[]> {
    const res = await db
      .prepare(
        `SELECT o.*, m.status AS user_status, m.match_score, m.eligibility_score, m.skills_score,
                m.interest_score, m.experience_score, m.location_score, m.preference_score,
                m.match_reasons, m.potential_mismatches
         FROM user_opportunity_matches m
         JOIN opportunities o ON m.opportunity_id = o.id
         WHERE m.user_id = ? AND m.status = 'pursuing'
         ORDER BY m.updated_at DESC`
      )
      .bind(userId)
      .all<JoinedOpportunityMatchRow>();
    return res.results || [];
  }

  static async expirePastDeadline(db: D1Database): Promise<number> {
    const now = getNowIso();
    const res = await db
      .prepare(
        `UPDATE opportunities
         SET status = 'expired', updated_at = ?
         WHERE status = 'active'
           AND deadline IS NOT NULL
           AND deadline < date('now')`
      )
      .bind(now)
      .run();
    return res.meta.changes || 0;
  }

  static async listSources(db: D1Database): Promise<OpportunitySourceRow[]> {
    const res = await db
      .prepare(`SELECT * FROM opportunity_sources ORDER BY priority DESC`)
      .all<OpportunitySourceRow>();
    return res.results || [];
  }
}
