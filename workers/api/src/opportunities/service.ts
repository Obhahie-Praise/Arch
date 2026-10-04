import type { OpportunityRow, UserOpportunityMatchRow, JoinedOpportunityMatchRow, OpportunityFormatted } from "./types";
import { OpportunityRepository } from "./repository";

function parseJsonField<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class OpportunityService {
  static formatOpportunity(
    opp: OpportunityRow | JoinedOpportunityMatchRow,
    match?: UserOpportunityMatchRow | JoinedOpportunityMatchRow | null
  ): OpportunityFormatted {
    const userStatus = "user_status" in opp ? opp.user_status : match ? ("user_status" in match ? match.user_status : match.status) : "matched";
    const matchScore = "match_score" in opp ? opp.match_score : match ? match.match_score : undefined;
    const matchReasonsStr = "match_reasons" in opp ? opp.match_reasons : match ? match.match_reasons : null;
    const potentialMismatchesStr = "potential_mismatches" in opp ? opp.potential_mismatches : match ? match.potential_mismatches : null;

    return {
      id: opp.id,
      title: opp.title,
      slug: opp.slug,
      organizationName: opp.organization_name,
      organizationUrl: opp.organization_url,
      type: opp.type,
      description: opp.description,
      applicationUrl: opp.application_url,
      sourceUrl: opp.source_url,
      location: opp.location,
      country: opp.country,
      region: opp.region,
      city: opp.city,
      isRemote: opp.is_remote === 1,
      deadline: opp.deadline,
      startDate: opp.start_date,
      endDate: opp.end_date,
      eligibility: parseJsonField<string[]>(opp.eligibility, []),
      requirements: parseJsonField<string[]>(opp.requirements, []),
      skills: parseJsonField<string[]>(opp.skills, []),
      benefits: parseJsonField<string[]>(opp.benefits, []),
      compensation: parseJsonField<Record<string, unknown> | null>(opp.compensation, null),
      fundingAmount: parseJsonField<Record<string, unknown> | null>(opp.funding_amount, null),
      status: opp.status,
      firstSeenAt: opp.first_seen_at,
      lastSeenAt: opp.last_seen_at,
      lastVerifiedAt: opp.last_verified_at,
      expiresAt: opp.expires_at,
      createdAt: opp.created_at,
      updatedAt: opp.updated_at,

      userStatus,
      matchScore,
      matchReasons: parseJsonField<string[]>(matchReasonsStr, []),
      potentialMismatches: parseJsonField<string[]>(potentialMismatchesStr, []),
    };
  }

  static async getDetails(db: D1Database, userId: string, idOrSlug: string) {
    let opp = await OpportunityRepository.getById(db, idOrSlug);
    if (!opp) {
      opp = await OpportunityRepository.getBySlug(db, idOrSlug);
    }
    if (!opp) return null;

    const match = await OpportunityRepository.getUserMatch(db, userId, opp.id);
    return this.formatOpportunity(opp, match);
  }

  static async saveOpportunity(db: D1Database, userId: string, id: string) {
    const opp = await OpportunityRepository.getById(db, id);
    if (!opp) return false;
    return await OpportunityRepository.updateUserMatchStatus(db, userId, id, "saved");
  }

  static async unsaveOpportunity(db: D1Database, userId: string, id: string) {
    const opp = await OpportunityRepository.getById(db, id);
    if (!opp) return false;
    return await OpportunityRepository.updateUserMatchStatus(db, userId, id, "matched");
  }

  static async pursueOpportunity(db: D1Database, userId: string, id: string) {
    const opp = await OpportunityRepository.getById(db, id);
    if (!opp) return false;
    return await OpportunityRepository.updateUserMatchStatus(db, userId, id, "pursuing");
  }

  static async unpursueOpportunity(db: D1Database, userId: string, id: string) {
    const opp = await OpportunityRepository.getById(db, id);
    if (!opp) return false;
    return await OpportunityRepository.updateUserMatchStatus(db, userId, id, "saved");
  }

  static async dismissOpportunity(db: D1Database, userId: string, id: string) {
    const opp = await OpportunityRepository.getById(db, id);
    if (!opp) return false;
    return await OpportunityRepository.updateUserMatchStatus(db, userId, id, "dismissed");
  }
}
