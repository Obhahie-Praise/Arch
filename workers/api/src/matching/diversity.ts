/**
 * Diversity-aware ranking.
 *
 * Prevents the user from receiving 30 nearly identical opportunities.
 * Applies lightweight penalization to clusters of the same type or organization
 * without sorting by diversity alone (relevance still dominates).
 */

import type { OpportunityRow } from "../opportunities/types";

interface ScoredCandidate {
  opp: OpportunityRow;
  finalScore: number;
}

const MAX_PER_TYPE = 8;
const MAX_PER_ORG = 3;

/**
 * Rank candidates by final score and apply diversity constraints.
 *
 * Strategy:
 * 1. Sort by final score descending.
 * 2. Walk the list. If adding a candidate would violate type or org limits,
 *    defer it to the end of the result set.
 * 3. Fill remaining slots with deferred candidates.
 * 4. Return top N.
 */
export function applyDiversityRanking(
  candidates: ScoredCandidate[],
  limit: number
): ScoredCandidate[] {
  // Sort by score desc
  const sorted = [...candidates].sort((a, b) => b.finalScore - a.finalScore);

  const typeCounts = new Map<string, number>();
  const orgCounts = new Map<string, number>();
  const selected: ScoredCandidate[] = [];
  const deferred: ScoredCandidate[] = [];

  for (const candidate of sorted) {
    const type = candidate.opp.type;
    const org = candidate.opp.organization_name.toLowerCase().trim();

    const typeCount = typeCounts.get(type) ?? 0;
    const orgCount = orgCounts.get(org) ?? 0;

    if (typeCount >= MAX_PER_TYPE || orgCount >= MAX_PER_ORG) {
      deferred.push(candidate);
      continue;
    }

    selected.push(candidate);
    typeCounts.set(type, typeCount + 1);
    orgCounts.set(org, orgCount + 1);

    if (selected.length >= limit) break;
  }

  // Fill remaining slots with deferred (overflow) candidates if quota not met
  if (selected.length < limit) {
    for (const candidate of deferred) {
      if (selected.length >= limit) break;
      selected.push(candidate);
    }
  }

  return selected.slice(0, limit);
}
