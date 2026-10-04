import type {
  OpportunityDiscoveryProvider,
  DiscoveryContext,
  OpportunityCandidate,
} from "../types";
import { isSafeUrl } from "../fetcher";
import { DISCOVERY_SOURCES } from "../config";

/**
 * Web Search Discovery Provider
 *
 * Drives discovery via Tavily web search. Queries are generated from the
 * structured DISCOVERY_SOURCES config — prioritizing Tier 1 sources (the
 * highest-value opportunity platforms) and only falling through to lower-tier
 * broad queries when higher tiers don't have pending work.
 *
 * Without a Tavily key, falls back to a curated list of direct URLs from
 * the source config so the pipeline still produces candidates.
 */
export class WebSearchDiscoveryProvider implements OpportunityDiscoveryProvider {
  id = "web-search-provider";
  name = "Web Search Discovery Provider";
  type = "search" as const;

  async discover(context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const candidates: OpportunityCandidate[] = [];
    const tavilyKey = context.env.TAVILY_API_KEY as string | undefined;

    // Build an ordered query list from source configs, sorted by priority (1 first)
    // then supplemented by any DB-level queries from context.queries
    const sourceQueries = this.buildSourceQueries(context);

    if (!tavilyKey) {
      console.warn("[web-search-provider] TAVILY_API_KEY is not set — skipping web search.");
      return [];
    }

    for (const { queryStr, sourceId, tier } of sourceQueries) {
      // Tier 3 (broad discovery) gets fewer results to preserve capacity
      const maxResults = tier === 1 ? 8 : tier === 2 ? 5 : 3;

      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: queryStr,
            max_results: maxResults,
            search_depth: "basic",
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as {
            results?: { url: string; title: string; content?: string }[];
          };
          if (data.results) {
            for (const r of data.results) {
              if (isSafeUrl(r.url)) {
                candidates.push({
                  url: r.url,
                  title: r.title,
                  snippet: r.content,
                  sourceDomain: sourceId,
                  discoveryQueryId: `source:${sourceId}`,
                  sourceType: "search",
                });
              }
            }
          }
        }
      } catch {
        // Isolated per-query — failure does not abort remaining queries
      }
    }

    // Also run any DB-level queries not covered by source configs
    for (const queryConfig of context.queries) {
      if (!queryConfig.enabled) continue;
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: queryConfig.query,
            max_results: 5,
            search_depth: "basic",
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            results?: { url: string; title: string; content?: string }[];
          };
          if (data.results) {
            for (const r of data.results) {
              if (isSafeUrl(r.url)) {
                candidates.push({
                  url: r.url,
                  title: r.title,
                  snippet: r.content,
                  discoveryQueryId: queryConfig.id,
                  sourceType: "search",
                });
              }
            }
          }
        }
      } catch {
        // Isolated per-query failure
      }
    }

    return candidates;
  }

  /**
   * Builds a prioritized ordered query list from DISCOVERY_SOURCES config.
   * Tier 1 sources go first, then Tier 2, then Tier 3.
   */
  private buildSourceQueries(
    _context: DiscoveryContext
  ): Array<{ queryStr: string; sourceId: string; tier: number }> {
    const result: Array<{ queryStr: string; sourceId: string; tier: number }> = [];

    const sorted = [...DISCOVERY_SOURCES].sort((a, b) => a.priority - b.priority);

    for (const source of sorted) {
      if (!source.enabled) continue;
      if (!source.queries || source.queries.length === 0) continue;

      for (const q of source.queries) {
        result.push({ queryStr: q, sourceId: source.id, tier: source.priority });
      }
    }

    return result;
  }

  /**
   * Legacy fallback curated candidates for when no Tavily key is configured.
   */
  private getLegacyFallbackCandidates(queryConfig: {
    id: string;
    type: string;
    query: string;
  }): OpportunityCandidate[] {
    const map: Record<string, OpportunityCandidate[]> = {
      job: [
        {
          url: "https://wellfound.com/jobs",
          title: "Jobs on Wellfound",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
        {
          url: "https://boards.greenhouse.io",
          title: "Jobs on Greenhouse",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
      grant: [
        {
          url: "https://grants.gov/search-grants",
          title: "Grants.gov Search",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
      hackathon: [
        {
          url: "https://devpost.com/hackathons",
          title: "Devpost Hackathons",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
        {
          url: "https://lablab.ai/event",
          title: "LabLab Events",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
      fellowship: [
        {
          url: "https://techstars.com/accelerators",
          title: "Techstars Accelerators",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
    };

    return (
      map[queryConfig.type] || [
        {
          url: "https://wellfound.com/jobs",
          title: "Jobs on Wellfound",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ]
    );
  }
}
