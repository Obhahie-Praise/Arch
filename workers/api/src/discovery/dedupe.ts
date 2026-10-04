import type { OpportunityInput } from "./types";
import { normalizeUrl, normalizeTitle, normalizeOrg } from "./normalizer";
import type { OpportunityRow } from "../opportunities/types";

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  existingOpportunity?: OpportunityRow;
  matchSignal?: "external_id" | "canonical_url" | "content_hash" | "org_title";
}

/**
 * Searches D1 for existing opportunities matching input via deterministic signals.
 */
export async function findDuplicateOpportunity(
  db: D1Database,
  input: OpportunityInput,
  contentHash: string
): Promise<DuplicateMatchResult> {
  const normSourceUrl = normalizeUrl(input.sourceUrl);
  const normAppUrl = input.applicationUrl ? normalizeUrl(input.applicationUrl) : null;

  // Signal 1: External ID check in opportunity_sources_map
  if (input.externalId) {
    const extMatch = await db
      .prepare(
        `SELECT o.* FROM opportunities o
         JOIN opportunity_sources_map m ON o.id = m.opportunity_id
         WHERE m.external_id = ? LIMIT 1`
      )
      .bind(input.externalId)
      .first<OpportunityRow>();

    if (extMatch) {
      return { isDuplicate: true, existingOpportunity: extMatch, matchSignal: "external_id" };
    }
  }

  // Signal 2: Canonical URL check in opportunities or opportunity_sources_map
  if (normSourceUrl) {
    const urlMatch = await db
      .prepare(
        `SELECT o.* FROM opportunities o
         LEFT JOIN opportunity_sources_map m ON o.id = m.opportunity_id
         WHERE o.source_url = ? OR o.application_url = ? OR m.source_url = ? LIMIT 1`
      )
      .bind(normSourceUrl, normSourceUrl, normSourceUrl)
      .first<OpportunityRow>();

    if (urlMatch) {
      return { isDuplicate: true, existingOpportunity: urlMatch, matchSignal: "canonical_url" };
    }
  }

  if (normAppUrl) {
    const appUrlMatch = await db
      .prepare(
        `SELECT o.* FROM opportunities o
         WHERE o.application_url = ? OR o.source_url = ? LIMIT 1`
      )
      .bind(normAppUrl, normAppUrl)
      .first<OpportunityRow>();

    if (appUrlMatch) {
      return { isDuplicate: true, existingOpportunity: appUrlMatch, matchSignal: "canonical_url" };
    }
  }

  // Signal 3: Content hash check
  const hashMatch = await db
    .prepare(`SELECT * FROM opportunities WHERE content_hash = ? LIMIT 1`)
    .bind(contentHash)
    .first<OpportunityRow>();

  if (hashMatch) {
    return { isDuplicate: true, existingOpportunity: hashMatch, matchSignal: "content_hash" };
  }

  // Signal 4: Exact normalized title + normalized organization
  const normTitle = normalizeTitle(input.title);
  const normOrg = normalizeOrg(input.organizationName);

  if (normTitle && normOrg) {
    const allCandidates = await db
      .prepare(`SELECT * FROM opportunities WHERE type = ? AND status != 'archived' LIMIT 100`)
      .bind(input.type)
      .all<OpportunityRow>();

    if (allCandidates.results) {
      for (const cand of allCandidates.results) {
        if (
          normalizeTitle(cand.title) === normTitle &&
          normalizeOrg(cand.organization_name) === normOrg
        ) {
          return { isDuplicate: true, existingOpportunity: cand, matchSignal: "org_title" };
        }
      }
    }
  }

  return { isDuplicate: false };
}
