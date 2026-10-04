import { MatchingService } from "../matching/service";

/**
 * Scheduled worker job for generating user recommendations.
 */
export async function runMatchingJobForUser(db: D1Database, userId: string) {
  const recommendations = await MatchingService.getOrGenerateUserRecommendations(db, userId);
  return { userId, count: recommendations.length };
}
