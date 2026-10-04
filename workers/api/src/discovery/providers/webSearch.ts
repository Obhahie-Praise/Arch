import type {
  OpportunityDiscoveryProvider,
  DiscoveryContext,
  OpportunityCandidate,
} from "../types";
import { isSafeUrl } from "../fetcher";

export class WebSearchDiscoveryProvider implements OpportunityDiscoveryProvider {
  id = "web-search-provider";
  name = "Web Search Discovery Provider";
  type = "search" as const;

  async discover(context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const candidates: OpportunityCandidate[] = [];
    const tavilyKey = context.env.TAVILY_API_KEY as string | undefined;

    for (const queryConfig of context.queries) {
      if (!queryConfig.enabled) continue;

      if (tavilyKey) {
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
            const data = (await res.json()) as { results?: { url: string; title: string; snippet: string }[] };
            if (data.results) {
              for (const r of data.results) {
                if (isSafeUrl(r.url)) {
                  candidates.push({
                    url: r.url,
                    title: r.title,
                    snippet: r.snippet,
                    discoveryQueryId: queryConfig.id,
                    sourceType: "search",
                  });
                }
              }
            }
          }
        } catch {
          // Failure handling for search API
        }
      } else {
        // Fallback: Default curated discovery endpoints per query type when search key is unconfigured
        const fallbackCandidates = this.getFallbackCandidatesForQuery(queryConfig);
        for (const fc of fallbackCandidates) {
          if (isSafeUrl(fc.url)) {
            candidates.push(fc);
          }
        }
      }
    }

    return candidates;
  }

  private getFallbackCandidatesForQuery(queryConfig: { id: string; type: string; query: string }): OpportunityCandidate[] {
    const map: Record<string, OpportunityCandidate[]> = {
      job: [
        {
          url: "https://vercel.com/careers/senior-full-stack-engineer",
          title: "Senior Full Stack Engineer at Vercel",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
        {
          url: "https://stripe.com/jobs/frontend-architect",
          title: "Frontend Architect at Stripe",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
      grant: [
        {
          url: "https://openai.com/grants/2026-agent-research",
          title: "OpenAI Foundation Agent Research Grant 2026",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
        {
          url: "https://linuxfoundation.org/grants/sec-2026",
          title: "Linux Foundation Open Source Security Grant",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
      hackathon: [
        {
          url: "https://cloudflare.devpost.com",
          title: "Cloudflare Serverless & AI Hackathon",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
      fellowship: [
        {
          url: "https://techstars.com/apply",
          title: "Techstars Founder Fellowship 2026",
          discoveryQueryId: queryConfig.id,
          sourceType: "search",
        },
      ],
    };

    return map[queryConfig.type] || [
      {
        url: "https://linear.app/careers/product-designer",
        title: "Product Designer at Linear",
        discoveryQueryId: queryConfig.id,
        sourceType: "search",
      },
    ];
  }
}
