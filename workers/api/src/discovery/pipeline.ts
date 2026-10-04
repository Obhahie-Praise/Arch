import type {
  DiscoveryRunSummary,
  OpportunityDiscoveryProvider,
  OpportunityCandidate,
} from "./types";
import { getActiveDiscoveryQueries } from "./queries";
import { WebSearchDiscoveryProvider } from "./providers/webSearch";
import { WebsiteDiscoveryProvider } from "./providers/website";
import { PageFetcher } from "./fetcher";
import { ContentExtractor } from "./extractor";
import { AIOpportunityExtractor } from "./opportunityExtractor";
import { createAIProvider } from "../ai/provider";
import { IngestionService } from "./service";
import { normalizeUrl } from "./normalizer";
import { getNowIso } from "../lib/dates";

/**
 * Tier refresh intervals (in hours). The pipeline runs every hour via cron,
 * but each tier is only rediscovered when its interval has elapsed.
 *
 * These values mirror the `refreshIntervalHours` in DISCOVERY_SOURCES but are
 * defined here as the authoritative scheduler thresholds.
 */
const TIER_REFRESH_HOURS: Record<1 | 2 | 3, number> = {
  1: 4,   // Tier 1 (major platforms): every 4 hours
  2: 12,  // Tier 2 (aggregators, universities): every 12 hours
  3: 24,  // Tier 3 (broad web): every 24 hours
};

export class DiscoveryPipeline {
  static async runPipeline(
    db: D1Database,
    env: Record<string, unknown>,
    options: { providerId?: string } = {}
  ): Promise<DiscoveryRunSummary> {
    const runId = crypto.randomUUID();
    const startedAt = getNowIso();

    // Determine which tiers are due based on last run time
    const activeTiers = await DiscoveryPipeline.getActiveTiers(db);

    const summary: DiscoveryRunSummary = {
      id: runId,
      providerId: options.providerId || `tiers:${activeTiers.join(",")}`,
      startedAt,
      status: "running",
      candidatesFound: 0,
      pagesFetched: 0,
      opportunitiesCreated: 0,
      opportunitiesUpdated: 0,
      opportunitiesRejected: 0,
      errors: [],
    };

    // 1. Create discovery_runs record
    try {
      await db
        .prepare(
          `INSERT INTO discovery_runs (
            id, provider_id, started_at, status, candidates_found, pages_fetched,
            opportunities_created, opportunities_updated, opportunities_rejected, errors, created_at, updated_at
          ) VALUES (?, ?, ?, 'running', 0, 0, 0, 0, 0, '[]', ?, ?)`
        )
        .bind(runId, summary.providerId, startedAt, startedAt, startedAt)
        .run();
    } catch {
      // Table may be pending or skipped in mock test
    }

    try {
      // 2. Load queries and setup providers
      const queries = await getActiveDiscoveryQueries(db);

      // Inject active tiers into context so providers know what's due
      const context = {
        queries,
        env,
        activeTiers,
      };

      const allProviders: OpportunityDiscoveryProvider[] = [
        new WebSearchDiscoveryProvider(),
        new WebsiteDiscoveryProvider(),
      ];

      const providersToRun = options.providerId
        ? allProviders.filter((p) => p.id === options.providerId)
        : allProviders;

      const candidates: OpportunityCandidate[] = [];

      // 3. Discover candidates from providers
      for (const provider of providersToRun) {
        try {
          const providerCandidates = await provider.discover(context);
          candidates.push(...providerCandidates);
        } catch (err) {
          const errMsg = `Provider ${provider.id} discovery error: ${
            err instanceof Error ? err.message : String(err)
          }`;
          summary.errors.push(errMsg);
        }
      }

      summary.candidatesFound = candidates.length;

      // 4. Deduplicate candidate URLs
      const seenUrls = new Set<string>();
      const uniqueCandidates: OpportunityCandidate[] = [];

      for (const c of candidates) {
        const norm = normalizeUrl(c.url);
        if (norm && !seenUrls.has(norm)) {
          seenUrls.add(norm);
          uniqueCandidates.push(c);
        }
      }

      // 5. Fetch, extract, and ingest each candidate
      const aiProvider = createAIProvider(env.AI);
      const extractor = new AIOpportunityExtractor(aiProvider);

      for (const candidate of uniqueCandidates) {
        try {
          const fetchRes = await PageFetcher.fetchPage(candidate.url);
          if (!fetchRes.success || !fetchRes.html) {
            summary.errors.push(
              `Fetch failed for ${candidate.url}: ${fetchRes.error || "No content"}`
            );
            continue;
          }

          summary.pagesFetched++;

          const extractedContent = ContentExtractor.extractContent(fetchRes);
          if (candidate.title && !extractedContent.title) {
            extractedContent.title = candidate.title;
          }

          const oppInput = await extractor.extract(extractedContent);
          if (!oppInput) {
            summary.opportunitiesRejected++;
            summary.errors.push(
              `Extraction produced null input for ${candidate.url}`
            );
            continue;
          }

          const ingestRes = await IngestionService.ingestOpportunity(
            db,
            oppInput,
            candidate.sourceDomain
          );

          if (ingestRes.status === "created") {
            summary.opportunitiesCreated++;
          } else if (ingestRes.status === "updated") {
            summary.opportunitiesUpdated++;
          } else if (ingestRes.status === "unchanged") {
            summary.opportunitiesUpdated++;
          } else {
            summary.opportunitiesRejected++;
            if (ingestRes.reason) {
              summary.errors.push(
                `Ingestion rejected ${candidate.url}: ${ingestRes.reason}`
              );
            }
          }
        } catch (err) {
          const errMsg = `Error processing candidate ${candidate.url}: ${
            err instanceof Error ? err.message : String(err)
          }`;
          summary.errors.push(errMsg);
        }
      }

      summary.status = "completed";
      summary.completedAt = getNowIso();
    } catch (err) {
      summary.status = "failed";
      summary.completedAt = getNowIso();
      summary.errors.push(
        `Pipeline execution failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // 6. Update discovery_runs record
    try {
      await db
        .prepare(
          `UPDATE discovery_runs
           SET completed_at = ?, status = ?, candidates_found = ?, pages_fetched = ?,
               opportunities_created = ?, opportunities_updated = ?, opportunities_rejected = ?,
               errors = ?, updated_at = ?
           WHERE id = ?`
        )
        .bind(
          summary.completedAt || getNowIso(),
          summary.status,
          summary.candidatesFound,
          summary.pagesFetched,
          summary.opportunitiesCreated,
          summary.opportunitiesUpdated,
          summary.opportunitiesRejected,
          JSON.stringify(summary.errors.slice(0, 20)),
          getNowIso(),
          runId
        )
        .run();
    } catch {
      // Ignore update errors
    }

    return summary;
  }

  /**
   * Determines which tiers are due for discovery based on the elapsed time
   * since each tier last ran. Falls back to running all tiers if history
   * is unavailable.
   */
  private static async getActiveTiers(db: D1Database): Promise<(1 | 2 | 3)[]> {
    const now = Date.now();
    const activeTiers: (1 | 2 | 3)[] = [];

    for (const [tierStr, intervalHours] of Object.entries(TIER_REFRESH_HOURS)) {
      const tier = Number(tierStr) as 1 | 2 | 3;
      const intervalMs = intervalHours * 60 * 60 * 1000;

      try {
        const row = await db
          .prepare(
            `SELECT completed_at FROM discovery_runs
             WHERE provider_id LIKE ? AND status = 'completed'
             ORDER BY completed_at DESC LIMIT 1`
          )
          .bind(`%tiers:${tier}%`)
          .first<{ completed_at: string }>();

        if (!row || !row.completed_at) {
          activeTiers.push(tier);
          continue;
        }

        const lastRanAt = new Date(row.completed_at).getTime();
        if (now - lastRanAt >= intervalMs) {
          activeTiers.push(tier);
        }
      } catch {
        // On any DB error, include tier to be safe
        activeTiers.push(tier);
      }
    }

    // Always run at least Tier 1
    if (activeTiers.length === 0) {
      activeTiers.push(1);
    }

    return activeTiers;
  }
}
