import { OpportunityRepository } from "../opportunities/repository";

/**
 * Scheduled worker job for checking stale and past-deadline opportunities.
 */
export async function runRefreshJob(db: D1Database) {
  const expiredCount = await OpportunityRepository.expirePastDeadline(db);
  return { expiredCount };
}
