import type { DiscoveryRunSummary, OpportunityDiscoveryProvider, OpportunityCandidate } from "./types";
import { getActiveDiscoveryQueries } from "./queries";
import { WebSearchDiscoveryProvider } from "./providers/webSearch";
import { WebsiteDiscoveryProvider } from "./providers/website";
import { PageFetcher } from "./fetcher";
import { ContentExtractor } from "./extractor";
import { HeuristicOpportunityExtractor } from "./opportunityExtractor";
import { IngestionService } from "./service";
import { normalizeUrl } from "./normalizer";
import { getNowIso } from "../lib/dates";

export class DiscoveryPipeline {
  static async runPipeline(
    db: D1Database,
    env: Record<string, unknown>,
    options: { providerId?: string } = {}
  ): Promise<DiscoveryRunSummary> {
    const runId = crypto.randomUUID();
    const startedAt = getNowIso();

    const summary: DiscoveryRunSummary = {
      id: runId,
      providerId: options.providerId || "all-providers",
      startedAt,
      status: "running",
      candidatesFound: 0,
      pagesFetched: 0,
      opportunitiesCreated: 0,
      opportunitiesUpdated: 0,
      opportunitiesRejected: 0,
      errors: [],
    };

    // 1. Create discovery_runs record in D1
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
      // Table may be pending or skipped in mock test, proceed
    }

    try {
      // 2. Load queries and setup providers
      const queries = await getActiveDiscoveryQueries(db);

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
          const providerCandidates = await provider.discover({ queries, env });
          candidates.push(...providerCandidates);
        } catch (err) {
          const errMsg = `Provider ${provider.id} discovery error: ${err instanceof Error ? err.message : String(err)}`;
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
      const extractor = new HeuristicOpportunityExtractor();

      for (const candidate of uniqueCandidates) {
        try {
          // Fetch page defensively
          const fetchRes = await PageFetcher.fetchPage(candidate.url);
          if (!fetchRes.success || !fetchRes.html) {
            summary.errors.push(`Fetch failed for ${candidate.url}: ${fetchRes.error || "No content"}`);
            continue;
          }

          summary.pagesFetched++;

          // Extract content
          const extractedContent = ContentExtractor.extractContent(fetchRes);
          if (candidate.title && !extractedContent.title) {
            extractedContent.title = candidate.title;
          }

          // Extract opportunity fields
          const oppInput = await extractor.extract(extractedContent);
          if (!oppInput) {
            summary.opportunitiesRejected++;
            summary.errors.push(`Extraction produced null input for ${candidate.url}`);
            continue;
          }

          // Ingest into database with deduplication and provenance
          const ingestRes = await IngestionService.ingestOpportunity(db, oppInput);

          if (ingestRes.status === "created") {
            summary.opportunitiesCreated++;
          } else if (ingestRes.status === "updated") {
            summary.opportunitiesUpdated++;
          } else if (ingestRes.status === "unchanged") {
            summary.opportunitiesUpdated++;
          } else {
            summary.opportunitiesRejected++;
            if (ingestRes.reason) {
              summary.errors.push(`Ingestion rejected ${candidate.url}: ${ingestRes.reason}`);
            }
          }
        } catch (err) {
          const errMsg = `Error processing candidate ${candidate.url}: ${err instanceof Error ? err.message : String(err)}`;
          summary.errors.push(errMsg);
        }
      }

      summary.status = "completed";
      summary.completedAt = getNowIso();
    } catch (err) {
      summary.status = "failed";
      summary.completedAt = getNowIso();
      summary.errors.push(`Pipeline execution failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 6. Update discovery_runs record in D1
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
}
