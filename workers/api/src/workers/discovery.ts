import { DiscoveryPipeline } from "../discovery/pipeline";

/**
 * Scheduled worker job for discovering and ingesting opportunities.
 */
export async function runDiscoveryJob(db: D1Database, env: Record<string, unknown> = {}) {
  const summary = await DiscoveryPipeline.runPipeline(db, env);
  return summary;
}
