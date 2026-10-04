import { OpportunityRepository } from "../opportunities/repository";
import { PageFetcher } from "../discovery/fetcher";
import { ContentExtractor } from "../discovery/extractor";
import { AIOpportunityExtractor } from "../discovery/opportunityExtractor";
import { SourceRegistry } from "../discovery/registry";
import { createAIProvider } from "../ai/provider";
import { IngestionService } from "../discovery/service";

/**
 * Scheduled worker job for checking stale and past-deadline opportunities.
 */
export async function runRefreshJob(db: D1Database, env: any) {
  const expiredCount = await OpportunityRepository.expirePastDeadline(db);
  
  let refreshedCount = 0;
  try {
    const toRefresh = await db.prepare(
      `SELECT id, source_url FROM opportunities WHERE status = 'active' AND last_verified_at < datetime('now', '-1 day') ORDER BY last_verified_at ASC LIMIT 5`
    ).all();

    if (toRefresh.results && toRefresh.results.length > 0) {
      const aiProvider = createAIProvider(env.AI);
      const extractor = new AIOpportunityExtractor(aiProvider);

      for (const opp of toRefresh.results) {
        const sourceUrl = opp.source_url as string;
        if (!sourceUrl) continue;
        
        try {
          const fetchRes = await PageFetcher.fetchPage(sourceUrl);
          if (fetchRes.success && fetchRes.html) {
            const extractedContent = ContentExtractor.extractContent(fetchRes);
            let adapterInput: any = null;
            const adapter = SourceRegistry.getAdapter(new URL(sourceUrl).hostname);
            
            if (adapter && adapter.extract) {
              adapterInput = await adapter.extract(fetchRes, extractedContent);
            }
            
            const oppInput = await extractor.extract(extractedContent, adapterInput);
            if (oppInput && oppInput.title) {
              // This will deduplicate and update existing opportunity fields/timestamps
              await IngestionService.ingestOpportunity(db, oppInput);
              refreshedCount++;
            }
          }
        } catch (e) {
          console.error("Refresh error for", sourceUrl, e);
        }
      }
    }
  } catch (err) {
    console.error("Failed to run active opportunity refresh", err);
  }

  return { expiredCount, refreshedCount };
}
