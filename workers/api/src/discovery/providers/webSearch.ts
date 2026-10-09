import type {
  OpportunityDiscoveryProvider,
  DiscoveryContext,
  OpportunityCandidate,
  OpportunityInput,
} from "../types";
import { isSafeUrl } from "../fetcher";
import { DISCOVERY_SOURCES } from "../config";
import type { OpportunityType } from "../../opportunities/types";

const VALID_TYPES: OpportunityType[] = [
  "job",
  "grant",
  "hackathon",
  "fellowship",
  "competition",
  "funding",
  "other",
];

/**
 * Web Search Discovery Provider
 *
 * Drives discovery via Tavily web search.
 *
 * Key design constraints (enforced here):
 *
 * 1. Only sources whose tier is in context.activeTiers are queried. This
 *    prevents firing 59+ Tavily calls on every hourly cron tick when the
 *    tier-gating logic says most tiers are not yet due.
 *
 * 2. Total Tavily calls are capped at MAX_QUERIES_PER_RUN. Each call is one
 *    Worker subrequest. Staying well under the limit leaves budget for the
 *    Devpost API calls and any other provider work in the same invocation.
 *
 * 3. Tavily results include a `content` snippet. When that snippet is long
 *    enough to extract an opportunity without fetching the page, the candidate
 *    is marked preExtracted so the pipeline skips the page fetch entirely.
 *    This is essential for platforms like LinkedIn and Greenhouse that block
 *    server-side scraping — the snippet is the best data we will ever get.
 *
 * 4. Provider errors are logged — not swallowed silently. Individual query
 *    failures are isolated and do not abort the remaining queries.
 *
 * Without a Tavily key the provider returns an empty list immediately; the
 * Devpost API adapter and Seed provider continue to run normally.
 */
export class WebSearchDiscoveryProvider implements OpportunityDiscoveryProvider {
  id = "web-search-provider";
  name = "Web Search Discovery Provider";
  type = "search" as const;

  /**
   * Maximum number of Tavily search calls per discovery run.
   *
   * Budget reasoning (Cloudflare Worker scheduled event):
   *   - Devpost API pagination: up to 10 calls (200 candidates)
   *   - DB queries (dedup, ingest): ~3–5 per candidate × up to 50 non-Devpost = ~250
   *   - Page fetches for candidates that still need them: minimal after pre-extraction
   *   - Total safe Tavily budget: ~25 calls (well under the 1,000 subrequest limit,
   *     and leaves 30-second CPU time for ingestion)
   *
   * Tier 1 alone has 41 queries. With the tier-gate already filtering to only
   * due tiers, this cap provides a hard safety net for the very first run (when
   * all tiers are due simultaneously).
   */
  static readonly MAX_QUERIES_PER_RUN = 25;

  /**
   * Minimum Tavily snippet length (characters) required to attempt pre-extraction
   * without fetching the full page.
   */
  static readonly MIN_SNIPPET_FOR_PRE_EXTRACTION = 150;

  async discover(context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const candidates: OpportunityCandidate[] = [];
    const tavilyKey = context.env.TAVILY_API_KEY as string | undefined;

    if (!tavilyKey) {
      console.warn("[web-search-provider] TAVILY_API_KEY is not set — skipping web search.");
      return [];
    }

    // Build the ordered query list, filtered to active tiers only.
    const sourceQueries = this.buildSourceQueries(context);

    let queryCount = 0;

    for (const { queryStr, sourceId, tier } of sourceQueries) {
      if (queryCount >= WebSearchDiscoveryProvider.MAX_QUERIES_PER_RUN) {
        console.warn(
          `[web-search-provider] Query cap (${WebSearchDiscoveryProvider.MAX_QUERIES_PER_RUN}) reached — ` +
            `skipping remaining queries for this run.`
        );
        break;
      }

      // Tier 3 (broad discovery) gets fewer results to preserve capacity.
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

        queryCount++;

        if (!res.ok) {
          // Surface auth failures and rate-limit errors explicitly so they
          // appear in the discovery run's error list rather than being silent.
          const status = res.status;
          const body = await res.text().catch(() => "(unreadable)");
          if (status === 401 || status === 403) {
            console.error(
              `[web-search-provider] Tavily authentication failed (HTTP ${status}) for query "${queryStr}". ` +
                `Check that TAVILY_API_KEY is set correctly in production secrets.`
            );
          } else if (status === 429) {
            console.warn(
              `[web-search-provider] Tavily rate limit hit (HTTP 429) after ${queryCount} queries. ` +
                `Stopping further queries for this run.`
            );
            break; // No point continuing if rate-limited.
          } else {
            console.warn(
              `[web-search-provider] Tavily returned HTTP ${status} for query "${queryStr}": ${body.slice(0, 200)}`
            );
          }
          continue;
        }

        const data = (await res.json()) as {
          results?: { url: string; title: string; content?: string }[];
        };

        if (data.results) {
          for (const r of data.results) {
            if (!isSafeUrl(r.url)) continue;

            // Attempt to build pre-extracted data from the Tavily snippet so
            // the pipeline can skip fetching the individual page. This is the
            // right approach for platforms (LinkedIn, Greenhouse, etc.) that
            // block server-side scraping — the snippet is the only reliable
            // data source available to us.
            const preExtracted = this.buildPreExtractedFromSnippet(
              r.url,
              r.title,
              r.content,
              sourceId
            );

            candidates.push({
              url: r.url,
              title: r.title,
              snippet: r.content,
              sourceDomain: sourceId,
              discoveryQueryId: `source:${sourceId}`,
              sourceType: "search",
              // Include pre-extracted data when the snippet is sufficient.
              // The pipeline will still validate completeness — incomplete
              // pre-extracted records fall through to a page fetch.
              ...(preExtracted ? { preExtracted } : {}),
            });
          }
        }
      } catch (err) {
        // Isolated per-query failure — does not abort remaining queries.
        // Log the error so it surfaces in the run summary via the pipeline's
        // error handler.
        console.error(
          `[web-search-provider] Query "${queryStr}" threw: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    // Also run any DB-level queries not covered by source configs, within the cap.
    for (const queryConfig of context.queries) {
      if (!queryConfig.enabled) continue;
      if (queryCount >= WebSearchDiscoveryProvider.MAX_QUERIES_PER_RUN) break;

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

        queryCount++;

        if (!res.ok) {
          const status = res.status;
          if (status === 429) break;
          console.warn(
            `[web-search-provider] Tavily returned HTTP ${status} for DB query "${queryConfig.query}"`
          );
          continue;
        }

        const data = (await res.json()) as {
          results?: { url: string; title: string; content?: string }[];
        };

        if (data.results) {
          for (const r of data.results) {
            if (!isSafeUrl(r.url)) continue;

            const preExtracted = this.buildPreExtractedFromSnippet(
              r.url,
              r.title,
              r.content,
              queryConfig.id
            );

            candidates.push({
              url: r.url,
              title: r.title,
              snippet: r.content,
              discoveryQueryId: queryConfig.id,
              sourceType: "search",
              ...(preExtracted ? { preExtracted } : {}),
            });
          }
        }
      } catch (err) {
        console.error(
          `[web-search-provider] DB query "${queryConfig.query}" threw: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    console.log(
      `[web-search-provider] Completed ${queryCount} Tavily queries, found ${candidates.length} candidates.`
    );

    return candidates;
  }

  /**
   * Builds a prioritized ordered query list from DISCOVERY_SOURCES config.
   *
   * Only includes sources whose tier is in context.activeTiers (when provided),
   * so queries are skipped for tiers that are not yet due for re-discovery.
   * Tier 1 sources come first, then Tier 2, then Tier 3.
   */
  private buildSourceQueries(
    context: DiscoveryContext
  ): Array<{ queryStr: string; sourceId: string; tier: number }> {
    const activeTiers = context.activeTiers ?? [1, 2, 3];
    const result: Array<{ queryStr: string; sourceId: string; tier: number }> = [];

    const sorted = [...DISCOVERY_SOURCES].sort((a, b) => a.priority - b.priority);

    for (const source of sorted) {
      if (!source.enabled) continue;
      if (!activeTiers.includes(source.priority as 1 | 2 | 3)) continue;
      if (!source.queries || source.queries.length === 0) continue;

      for (const q of source.queries) {
        result.push({ queryStr: q, sourceId: source.id, tier: source.priority });
      }
    }

    return result;
  }

  /**
   * Attempts to build a partial OpportunityInput from a Tavily result's title
   * and content snippet. Returns null when the snippet is too short to be
   * useful — the pipeline will then fetch the full page instead.
   *
   * This does NOT invent fields that are not present in the snippet. Missing
   * fields are left undefined so the pipeline's validation gate can correctly
   * decide whether the record is complete enough to ingest.
   */
  private buildPreExtractedFromSnippet(
    url: string,
    title: string | undefined,
    snippet: string | undefined,
    sourceId: string
  ): Partial<OpportunityInput> | null {
    // Require a minimum snippet length — short snippets are too unreliable.
    if (
      !snippet ||
      snippet.length < WebSearchDiscoveryProvider.MIN_SNIPPET_FOR_PRE_EXTRACTION
    ) {
      return null;
    }

    if (!title || title.trim().length < 3) {
      return null;
    }

    // Infer the opportunity type from the source config.
    const source = DISCOVERY_SOURCES.find((s) => s.id === sourceId);
    const rawType = source?.types?.[0];
    const type: OpportunityType =
      rawType && VALID_TYPES.includes(rawType) ? rawType : "other";

    // Infer organization from the URL hostname as a fallback.
    let organizationName: string | undefined;
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, "");
      // Use the source name when available (more readable than the hostname).
      organizationName = source?.name ?? hostname;
    } catch {
      organizationName = undefined;
    }

    if (!organizationName) return null;

    // Return partial data. description comes from the snippet — not invented.
    // The pipeline's AI extractor or validation gate will reject it if it is
    // insufficient.
    return {
      title: title.trim(),
      organizationName,
      type,
      sourceUrl: url,
      applicationUrl: url,
      description: snippet.trim(),
      isRemote: undefined, // cannot infer from snippet reliably
    };
  }
}
