import type { OpportunitySourceAdapter, DiscoveryContext, OpportunityCandidate, OpportunityInput, ExtractedOpportunityContent } from "../types";
import type { FetchResult } from "../fetcher";

export class DevpostAdapter implements OpportunitySourceAdapter {
  id = "devpost";
  name = "Devpost";
  domain = "devpost.com";
  type = "api" as const;

  async discover(context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const candidates: OpportunityCandidate[] = [];
    
    // Fallback if config is disabled for devpost
    const config = context.queries.find(q => q.id === "devpost");
    // Wait, the context has queries, but config is in DISCOVERY_SOURCES
    // For now we'll just fetch upcoming/open hackathons
    
    try {
       const res = await fetch("https://devpost.com/api/hackathons?status=upcoming,open");
       if (!res.ok) throw new Error("Failed to fetch devpost API");
       const data = await res.json() as any;
       
       for (const hackathon of data.hackathons || []) {
          if (hackathon.url) {
             candidates.push({
                url: hackathon.url,
                title: hackathon.title,
                sourceDomain: "devpost.com",
                sourceType: "api"
             });
          }
       }
    } catch(e) {
       console.error("Devpost discovery error", e);
    }
    
    return candidates;
  }

  async extract(fetchRes: FetchResult, content: ExtractedOpportunityContent): Promise<Partial<OpportunityInput> | null> {
    const html = fetchRes.html || "";
    const result: Partial<OpportunityInput> = {
      type: "hackathon",
      sourceUrl: fetchRes.url,
      applicationUrl: fetchRes.url,
    };
    
    // Attempt to extract JSON-LD
    const ldMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (ldMatches) {
      for (const match of ldMatches) {
        try {
          const clean = match.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '');
          const parsed = JSON.parse(clean);
          
          if (parsed["@type"] === "Event") {
             if (parsed.name) result.title = parsed.name;
             if (parsed.description) result.description = parsed.description;
             if (parsed.startDate) result.startDate = new Date(parsed.startDate).toISOString();
             if (parsed.endDate) result.endDate = new Date(parsed.endDate).toISOString();
             
             // Devpost deadline is usually the end of submission period or start of event
             if (parsed.endDate) {
                result.deadline = result.endDate;
             } else if (parsed.startDate) {
                result.deadline = result.startDate;
             }
             
             if (parsed.organizer && parsed.organizer.name) {
                result.organizationName = parsed.organizer.name;
             }
             if (parsed.url) {
                result.applicationUrl = parsed.url;
                result.sourceUrl = parsed.url;
             }
             
             if (parsed.offers && parsed.offers.price) {
                // Free to enter?
             }
             
             if (parsed.location && parsed.location["@type"] === "VirtualLocation") {
                result.isRemote = true;
                result.location = "Online";
             }
          }
        } catch(e) {
          // Ignore JSON parse errors
        }
      }
    }
    
    // Fallbacks if JSON-LD missed anything
    if (!result.title) result.title = content.title;
    if (!result.organizationName) result.organizationName = "Devpost Hackathon";
    
    return result;
  }
}
