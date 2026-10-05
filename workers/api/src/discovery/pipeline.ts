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
import { SourceRegistry } from "./registry";

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
      sourceMetrics: {},
      errors: [],
    };

    // 0. Clean up any permanently stuck 'running' rows from previous invocations.
    // A run that started more than 30 minutes ago and is still 'running' was killed
    // by the Cloudflare Worker CPU limit before the finally block could persist its
    // terminal status. Mark them as 'failed' so getActiveTiers stops treating them
    // as active and the discovery chart query does not exclude their partial counts.
    try {
      await db
        .prepare(
          `UPDATE discovery_runs
           SET status = 'failed',
               completed_at = COALESCE(completed_at, datetime(started_at, '+30 minutes')),
               errors = json_insert(COALESCE(errors, '[]'), '$[0]', 'Run killed by Worker CPU limit before finalisation'),
               updated_at = ?
           WHERE status = 'running'
             AND started_at <= datetime('now', '-30 minutes')`
        )
        .bind(getNowIso())
        .run();
    } catch {
      // Best-effort cleanup — do not abort the current run if this fails
    }

    // 1. Create discovery_runs record
    try {
      await db
        .prepare(
          `INSERT INTO discovery_runs (
            id, provider_id, started_at, status, candidates_found, pages_fetched,
            opportunities_created, opportunities_updated, opportunities_rejected, errors, source_metrics, created_at, updated_at
          ) VALUES (?, ?, ?, 'running', 0, 0, 0, 0, 0, '[]', '{}', ?, ?)`
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

      const allProviders: OpportunityDiscoveryProvider[] = SourceRegistry.getProviders();

      const providersToRun = options.providerId
        ? allProviders.filter((p) => p.id === options.providerId)
        : allProviders;

      const candidates: OpportunityCandidate[] = [];

      // 3. Discover candidates from providers
      const providerPromises = providersToRun.map(async (provider) => {
        console.log(`[discovery] starting provider: ${provider.id}`);
        try {
          const providerCandidates = await provider.discover(context);
          console.log(`[discovery] completed provider: ${provider.id} candidates=${providerCandidates.length}`);
          
          if (!summary.sourceMetrics[provider.id]) {
            summary.sourceMetrics[provider.id] = { discovered: 0, created: 0, rejected: 0, updated: 0, executed: true };
          } else {
            (summary.sourceMetrics[provider.id] as any).executed = true;
          }
          
          return providerCandidates;
        } catch (err) {
          const errMsg = `Provider ${provider.id} discovery error: ${
            err instanceof Error ? err.message : String(err)
          }`;
          console.error(`[discovery] failed provider: ${provider.id} error=${errMsg}`);
          summary.errors.push(errMsg);
          
          if (!summary.sourceMetrics[provider.id]) {
            summary.sourceMetrics[provider.id] = { discovered: 0, created: 0, rejected: 0, updated: 0, executed: true, failed: true };
          } else {
            (summary.sourceMetrics[provider.id] as any).executed = true;
            (summary.sourceMetrics[provider.id] as any).failed = true;
          }
          
          return [];
        }
      });

      const results = await Promise.allSettled(providerPromises);
      for (const res of results) {
        if (res.status === "fulfilled") {
          candidates.push(...res.value);
        }
      }

      summary.candidatesFound = candidates.length;

      // 4. Deduplicate candidate URLs and filter out known listing pages
      const LISTING_PAGE_PATTERNS = [
        /\/jobs\/?$/i,
        /\/jobs\/search/i,
        /\/hackathons\/?$/i,
        /\/search[-_]grants/i,
        /\/accelerators\/?$/i,
        /\/events?\/?$/i,
        /\/ai-hackathons\/?$/i,
        /\/search\/?$/i,
        /\/opportunities\/?$/i,
        /\/careers\/?$/i,
        /\/find[-_]jobs/i,
        // Exact platform homepage / listing URLs
        /^https?:\/\/(www\.)?greenhouse\.com\/?$/i,
        /^https?:\/\/(www\.)?greenhouse\.io\/?$/i,
        /^https?:\/\/boards\.greenhouse\.io\/?$/i,
        /^https?:\/\/(www\.)?wellfound\.com\/jobs\/?$/i,
        /^https?:\/\/(www\.)?devpost\.com\/hackathons\/?$/i,
        /^https?:\/\/(www\.)?lablab\.ai\/(ai-)?hackathons?\/?$/i,
        /^https?:\/\/(www\.)?lablab\.ai\/event\/?$/i,
        /^https?:\/\/(www\.)?techstars\.com\/accelerators\/?$/i,
        /^https?:\/\/grants\.gov\/search/i,
        /^https?:\/\/apply\.techstars\.com\/?$/i,
        /^https?:\/\/(www\.)?linkedin\.com\/jobs\/?$/i,
        /^https?:\/\/(www\.)?indeed\.com\/?$/i,
      ];

      function isListingPage(url: string): boolean {
        return LISTING_PAGE_PATTERNS.some((p) => p.test(url));
      }

      const seenUrls = new Set<string>();
      const uniqueCandidates: OpportunityCandidate[] = [];

      for (const c of candidates) {
        if (isListingPage(c.url)) {
          // Skip platform listing/index pages — they are not individual opportunities
          summary.errors.push(`Skipped listing page: ${c.url}`);
          continue;
        }
        const norm = normalizeUrl(c.url);
        if (norm && !seenUrls.has(norm)) {
          seenUrls.add(norm);
          uniqueCandidates.push(c);
          
          const srcDomain = c.sourceDomain || new URL(c.url).hostname;
          if (!summary.sourceMetrics[srcDomain]) {
            summary.sourceMetrics[srcDomain] = { discovered: 0, created: 0, rejected: 0, updated: 0 };
          }
          summary.sourceMetrics[srcDomain].discovered++;
        }
      }

      // 5. Fetch, extract, and ingest each candidate
      const aiProvider = createAIProvider(env.AI);
      const extractor = new AIOpportunityExtractor(
        aiProvider,
        // Surface every AI failure in the run summary so operators can diagnose
        // Workers AI errors without having to inspect Worker logs.
        (msg) => summary.errors.push(msg)
      );

      /**
       * Flush current summary counters and errors to the DB without changing
       * the terminal status (it is still 'running' at this point).
       * Called every FLUSH_EVERY candidates so partial progress is visible even
       * if the Worker is killed by Cloudflare's CPU budget before the loop ends.
       */
      const FLUSH_EVERY = 10;
      let candidatesSinceLastFlush = 0;

      async function flushProgress(): Promise<void> {
        try {
          await db
            .prepare(
              `UPDATE discovery_runs
               SET candidates_found = ?, pages_fetched = ?,
                   opportunities_created = ?, opportunities_updated = ?, opportunities_rejected = ?,
                   errors = ?, source_metrics = ?, updated_at = ?
               WHERE id = ?`
            )
            .bind(
              summary.candidatesFound,
              summary.pagesFetched,
              summary.opportunitiesCreated,
              summary.opportunitiesUpdated,
              summary.opportunitiesRejected,
              JSON.stringify(summary.errors.slice(0, 20)),
              JSON.stringify(summary.sourceMetrics),
              getNowIso(),
              runId
            )
            .run();
        } catch {
          // Ignore flush errors — best-effort
        }
      }

      for (const candidate of uniqueCandidates) {
        try {
          let oppInput: import("./types").OpportunityInput | null = null;

          if (candidate.preExtracted) {
            // Fast path: API adapter already extracted structured data.
            // Build a minimal OpportunityInput directly without fetching the page.
            const p = candidate.preExtracted;
            if (p.title && p.organizationName && p.description && p.sourceUrl) {
              oppInput = p as import("./types").OpportunityInput;
              console.log(`[pipeline] pre-extracted: ${p.title} (${p.sourceUrl})`);
            } else {
              // Pre-extracted but incomplete — fall through to page fetch
              console.log(`[pipeline] pre-extracted incomplete for ${candidate.url}, fetching page`);
            }
          }

          if (!oppInput) {
            // Standard path: fetch page, run adapter extract + AI extractor
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

            let adapterInput: Partial<import("./types").OpportunityInput> | null = candidate.preExtracted ?? null;
            const adapter = SourceRegistry.getAdapter(candidate.sourceDomain || new URL(candidate.url).hostname);
            if (adapter && adapter.extract) {
              try {
                const fromAdapter = await adapter.extract(fetchRes, extractedContent);
                // Merge: page adapter overrides pre-extracted for page-specific fields
                adapterInput = fromAdapter ? { ...adapterInput, ...fromAdapter } : adapterInput;
              } catch (e) {
                summary.errors.push(`Adapter extraction failed for ${candidate.url}: ${e}`);
              }
            }

            oppInput = await extractor.extract(extractedContent, adapterInput);
          }

          // Validate completeness
          const srcDomain = candidate.sourceDomain || new URL(candidate.url).hostname;
          
          if (!oppInput || !oppInput.title || !oppInput.organizationName || !oppInput.description) {
            summary.opportunitiesRejected++;
            summary.sourceMetrics[srcDomain].rejected++;
            summary.errors.push(
              `Rejected (incomplete): ${candidate.url} — title=${oppInput?.title ?? "missing"} org=${oppInput?.organizationName ?? "missing"} desc=${oppInput?.description ? "ok" : "missing"}`
            );
            continue;
          }

          const ingestRes = await IngestionService.ingestOpportunity(
            db,
            oppInput,
            undefined // source_id FK — opportunity_sources table not yet populated
          );

          if (ingestRes.status === "created") {
            summary.opportunitiesCreated++;
            summary.sourceMetrics[srcDomain].created++;
            console.log(`[pipeline] created: ${oppInput.title}`);
          } else if (ingestRes.status === "updated" || ingestRes.status === "unchanged") {
            summary.opportunitiesUpdated++;
            summary.sourceMetrics[srcDomain].updated++;
          } else {
            summary.opportunitiesRejected++;
            summary.sourceMetrics[srcDomain].rejected++;
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

        // Periodically flush progress so a CPU kill doesn't erase all state
        candidatesSinceLastFlush++;
        if (candidatesSinceLastFlush >= FLUSH_EVERY) {
          await flushProgress();
          candidatesSinceLastFlush = 0;
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
    } finally {
      // 6. Always persist the final run state, even if the outer catch fired.
      // Without this in a finally block, an unhandled rejection would leave the
      // discovery_runs row permanently in 'running', causing getActiveTiers to
      // re-trigger the run on every subsequent cron tick.
      try {
        await db
          .prepare(
            `UPDATE discovery_runs
             SET completed_at = ?, status = ?, candidates_found = ?, pages_fetched = ?,
                 opportunities_created = ?, opportunities_updated = ?, opportunities_rejected = ?,
                 errors = ?, source_metrics = ?, updated_at = ?
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
            JSON.stringify(summary.sourceMetrics),
            getNowIso(),
            runId
          )
          .run();
      } catch {
        // Ignore update errors — best-effort persistence
      }
    }

    return summary;
  }

  /**
   * Determines which tiers are due for discovery based on the elapsed time
   * since each tier last ran. Falls back to running all tiers if history
   * is unavailable.
   *
   * A tier is considered "ran" if its most recent run has any of these statuses:
   *   - 'completed'  — normal finish
   *   - 'failed'     — outer pipeline error
   *   - 'running' with started_at older than the tier interval — stale/CPU-killed run
   *
   * Previously, only 'completed' was checked. A run killed mid-loop by the
   * Cloudflare Worker CPU budget stays permanently in 'running' and was never
   * found, causing the tier to re-fire every cron tick forever.
   */
  private static async getActiveTiers(db: D1Database): Promise<(1 | 2 | 3)[]> {
    const now = Date.now();
    const activeTiers: (1 | 2 | 3)[] = [];

    for (const [tierStr, intervalHours] of Object.entries(TIER_REFRESH_HOURS)) {
      const tier = Number(tierStr) as 1 | 2 | 3;
      const intervalMs = intervalHours * 60 * 60 * 1000;

      try {
        // Look for the most recent run for this tier regardless of status.
        // Use COALESCE(completed_at, started_at) so killed runs (which never
        // set completed_at) are still considered using their start time.
        const row = await db
          .prepare(
            `SELECT COALESCE(completed_at, started_at) AS last_activity_at
             FROM discovery_runs
             WHERE provider_id LIKE ?
               AND (
                 status IN ('completed', 'failed')
                 OR (status = 'running' AND started_at <= datetime('now', ?))
               )
             ORDER BY last_activity_at DESC LIMIT 1`
          )
          .bind(`%tiers:${tier}%`, `-${intervalHours} hours`)
          .first<{ last_activity_at: string }>();

        if (!row || !row.last_activity_at) {
          // No prior run found at all — tier is due.
          activeTiers.push(tier);
          continue;
        }

        const lastRanAt = new Date(row.last_activity_at).getTime();
        if (now - lastRanAt >= intervalMs) {
          activeTiers.push(tier);
        }
      } catch {
        // On any DB error, include tier to be safe.
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
