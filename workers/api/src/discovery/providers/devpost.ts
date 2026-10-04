import type {
  OpportunitySourceAdapter,
  DiscoveryContext,
  OpportunityCandidate,
  OpportunityInput,
  ExtractedOpportunityContent,
} from "../types";
import type { FetchResult } from "../fetcher";

interface DevpostHackathon {
  id: number;
  title: string;
  url: string;
  organization_name?: string;
  displayed_location?: { location?: string; icon?: string };
  open_state?: string;
  submission_period_dates?: string;
  prize_amount?: string;
  themes?: { id: number; name: string }[];
  time_left_to_submission?: string;
  registrations_count?: number;
  managed_by_devpost_badge?: boolean;
}

/**
 * Parses a Devpost submission period string like "Aug 31 - Oct 23, 2026"
 * and returns the end date as an ISO string if parseable.
 */
function parseDevpostDeadline(periodStr: string | undefined): string | undefined {
  if (!periodStr) return undefined;
  // Format: "Month Day - Month Day, Year"  or  "Month Day, Year - Month Day, Year"
  const parts = periodStr.split(" - ");
  const endPart = parts[parts.length - 1]?.trim();
  if (!endPart) return undefined;
  const d = new Date(endPart);
  if (!isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

export class DevpostAdapter implements OpportunitySourceAdapter {
  id = "devpost";
  name = "Devpost";
  domain = "devpost.com";
  type = "api" as const;

  async discover(_context: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const candidates: OpportunityCandidate[] = [];

    try {
      // No status filter — the status=upcoming,open filter returns 0 results.
      // Fetch open hackathons by ordering by submission deadline descending.
      const res = await fetch(
        "https://devpost.com/api/hackathons?order_by=deadline&per_page=20",
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) throw new Error(`Devpost API returned HTTP ${res.status}`);
      const data = (await res.json()) as { hackathons?: DevpostHackathon[] };

      for (const h of data.hackathons ?? []) {
        if (!h.url || !h.title) continue;

        const deadline = parseDevpostDeadline(h.submission_period_dates);
        const isRemote = h.displayed_location?.icon === "globe" ||
          h.displayed_location?.location?.toLowerCase().includes("online");
        const themes = (h.themes ?? []).map((t) => t.name);

        // Build pre-extracted data from the API response directly
        const preExtracted: Partial<OpportunityInput> = {
          title: h.title,
          organizationName: h.organization_name || "Devpost",
          type: "hackathon",
          sourceUrl: h.url,
          applicationUrl: h.url,
          isRemote: isRemote ?? true,
          location: isRemote ? "Online" : (h.displayed_location?.location ?? undefined),
          deadline,
          description: `${h.title} — a hackathon${h.organization_name ? ` by ${h.organization_name}` : ""}. ${h.submission_period_dates ? `Submissions: ${h.submission_period_dates}.` : ""} ${h.time_left_to_submission ? `Time left: ${h.time_left_to_submission}.` : ""}`.trim(),
          skills: themes.length > 0 ? themes : undefined,
          externalId: String(h.id),
        };

        candidates.push({
          url: h.url,
          title: h.title,
          sourceDomain: "devpost.com",
          sourceType: "api",
          preExtracted,
        });
      }

      console.log(`[devpost] discover: fetched ${candidates.length} candidates from API`);
    } catch (e) {
      console.error("[devpost] discover error:", e instanceof Error ? e.message : String(e));
    }

    return candidates;
  }

  /**
   * Supplements pre-extracted data with JSON-LD from the hackathon page if available.
   * Only called when the pipeline decides to fetch the page.
   */
  async extract(
    fetchRes: FetchResult,
    content: ExtractedOpportunityContent
  ): Promise<Partial<OpportunityInput> | null> {
    const html = fetchRes.html || "";
    const result: Partial<OpportunityInput> = {
      type: "hackathon",
      sourceUrl: fetchRes.url,
      applicationUrl: fetchRes.url,
    };

    // Try JSON-LD Event schema
    const ldRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = ldRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed["@type"] === "Event") {
          if (parsed.name) result.title = parsed.name;
          if (parsed.description) result.description = parsed.description;
          if (parsed.startDate) result.startDate = new Date(parsed.startDate).toISOString();
          if (parsed.endDate) {
            result.endDate = new Date(parsed.endDate).toISOString();
            result.deadline = result.endDate;
          } else if (parsed.startDate) {
            result.deadline = new Date(parsed.startDate).toISOString();
          }
          if (parsed.organizer?.name) result.organizationName = parsed.organizer.name;
          if (parsed.url) {
            result.applicationUrl = parsed.url;
            result.sourceUrl = parsed.url;
          }
          if (parsed.location?.["@type"] === "VirtualLocation") {
            result.isRemote = true;
            result.location = "Online";
          }
        }
      } catch {
        // Skip malformed JSON-LD blocks
      }
    }

    if (!result.title) result.title = content.title;
    if (!result.organizationName) result.organizationName = "Devpost Hackathon";

    return result;
  }
}
