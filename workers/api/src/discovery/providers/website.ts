import type {
  OpportunityDiscoveryProvider,
  DiscoveryContext,
  OpportunityCandidate,
} from "../types";
import { isSafeUrl } from "../fetcher";
import { DISCOVERY_SOURCES } from "../config";

/**
 * Website Direct Discovery Provider
 *
 * Directly crawls known, high-value opportunity listing pages.
 * Only sources that have `directUrls` and `discoveryStrategy` of "direct" or
 * "both" will be targeted.
 *
 * This provider is intentionally selective — it does not attempt to crawl
 * platforms that restrict access, require authentication, or block bots.
 */
export class WebsiteDiscoveryProvider implements OpportunityDiscoveryProvider {
  id = "website-direct-provider";
  name = "Website Direct Discovery Provider";
  type = "website" as const;

  async discover(_context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const candidates: OpportunityCandidate[] = [];

    const directSources = DISCOVERY_SOURCES.filter(
      (s) =>
        s.enabled &&
        (s.discoveryStrategy === "direct" || s.discoveryStrategy === "both") &&
        s.directUrls &&
        s.directUrls.length > 0
    );

    // Sort by priority — Tier 1 first
    directSources.sort((a, b) => a.priority - b.priority);

    for (const source of directSources) {
      for (const url of source.directUrls ?? []) {
        if (isSafeUrl(url)) {
          candidates.push({
            url,
            sourceDomain: source.domain || source.id,
            sourceType: "website",
          });
        }
      }
    }

    return candidates;
  }
}
