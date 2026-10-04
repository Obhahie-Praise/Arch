import type {
  OpportunityDiscoveryProvider,
  DiscoveryContext,
  OpportunityCandidate,
} from "../types";
import { isSafeUrl } from "../fetcher";

export class WebsiteDiscoveryProvider implements OpportunityDiscoveryProvider {
  id = "website-direct-provider";
  name = "Website Direct Discovery Provider";
  type = "website" as const;

  async discover(_context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const directSites: OpportunityCandidate[] = [
      {
        url: "https://vercel.com/careers/senior-full-stack-engineer",
        title: "Vercel Careers Direct",
        sourceType: "website",
      },
      {
        url: "https://openai.com/grants/2026-agent-research",
        title: "OpenAI Research Grants Direct",
        sourceType: "website",
      },
      {
        url: "https://cloudflare.devpost.com",
        title: "Cloudflare Devpost Direct",
        sourceType: "website",
      },
      {
        url: "https://techstars.com/apply",
        title: "Techstars Fellowship Direct",
        sourceType: "website",
      },
    ];

    return directSites.filter((site) => isSafeUrl(site.url));
  }
}
