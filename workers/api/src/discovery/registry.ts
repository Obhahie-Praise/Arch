import type { OpportunityDiscoveryProvider, OpportunitySourceAdapter } from "./types";
import { WebSearchDiscoveryProvider } from "./providers/webSearch";
import { WebsiteDiscoveryProvider } from "./providers/website";
import { DevpostAdapter } from "./providers/devpost";

export class SourceRegistry {
  private static adapters: OpportunitySourceAdapter[] = [
    new DevpostAdapter(),
  ];

  static getAdapter(domain: string): OpportunitySourceAdapter | undefined {
    return this.adapters.find((a) => domain.includes(a.domain));
  }

  static getProviders(): OpportunityDiscoveryProvider[] {
    const providers: OpportunityDiscoveryProvider[] = [
      new WebSearchDiscoveryProvider(),
      new WebsiteDiscoveryProvider(),
    ];

    for (const adapter of this.adapters) {
      if (adapter.discover) {
        providers.push({
          id: adapter.id,
          name: adapter.name,
          type: adapter.type || "api",
          discover: (ctx) => adapter.discover!(ctx),
        });
      }
    }

    return providers;
  }
}
