import type { ExtractedOpportunityContent, OpportunityInput } from "./types";
import type { AIProvider } from "../ai/provider";
import type { AIExtractionOutput } from "../ai/schemas";
import type { OpportunityType } from "../opportunities/types";

const VALID_TYPES: OpportunityType[] = [
  "job",
  "grant",
  "hackathon",
  "fellowship",
  "competition",
  "funding",
  "other",
];

const MIN_CONTENT_CHARS = 200;

export interface OpportunityExtractor {
  extract(content: ExtractedOpportunityContent): Promise<OpportunityInput | null>;
}

// Shared URL validator
function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const p = new URL(url);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}

// Validate and sanitize AI output
function validateAIOutput(raw: AIExtractionOutput): boolean {
  if (raw.isOpportunity === false) return false;
  if (!raw.title || typeof raw.title !== "string" || raw.title.trim().length < 3) return false;
  if (!raw.organizationName || typeof raw.organizationName !== "string") return false;
  if (raw.type && !VALID_TYPES.includes(raw.type as OpportunityType)) return false;
  if (raw.applicationUrl && !isValidUrl(raw.applicationUrl)) {
    raw.applicationUrl = null; // Sanitize invalid URLs
  }
  if (raw.organizationUrl && !isValidUrl(raw.organizationUrl)) {
    raw.organizationUrl = null;
  }
  if (raw.eligibility && !Array.isArray(raw.eligibility)) return false;
  if (raw.requirements && !Array.isArray(raw.requirements)) return false;
  if (raw.skills && !Array.isArray(raw.skills)) return false;
  if (raw.benefits && !Array.isArray(raw.benefits)) return false;
  return true;
}

// Convert AI output + source URL → OpportunityInput
function aiOutputToInput(
  raw: AIExtractionOutput,
  sourceUrl: string
): OpportunityInput {
  return {
    title: raw.title!.trim(),
    organizationName: raw.organizationName!.trim(),
    organizationUrl: raw.organizationUrl ?? undefined,
    type: (raw.type as OpportunityType) ?? "other",
    description: raw.description ?? undefined,
    applicationUrl: raw.applicationUrl ?? undefined,
    sourceUrl,
    location: raw.location ?? undefined,
    country: raw.country ?? undefined,
    isRemote: raw.isRemote ?? false,
    deadline: raw.deadline ?? undefined,
    eligibility: Array.isArray(raw.eligibility) ? raw.eligibility : undefined,
    requirements: Array.isArray(raw.requirements) ? raw.requirements : undefined,
    skills: Array.isArray(raw.skills) ? raw.skills : undefined,
    benefits: Array.isArray(raw.benefits) ? raw.benefits : undefined,
    compensation: raw.compensation ?? undefined,
    fundingAmount: raw.fundingAmount ?? undefined,
  };
}

// Check if content is rich enough to send to AI
function hasMinimumContent(content: ExtractedOpportunityContent): boolean {
  const total = (content.text || "").length + (content.title || "").length;
  return total >= MIN_CONTENT_CHARS;
}

// Prepare compact prompt content from extracted page
function preparePageContext(content: ExtractedOpportunityContent): string {
  const parts: string[] = [];
  if (content.title) parts.push(`PAGE TITLE: ${content.title}`);
  if (content.description) parts.push(`PAGE DESCRIPTION: ${content.description}`);
  if (content.url) parts.push(`PAGE URL: ${content.url}`);
  if (content.canonicalUrl && content.canonicalUrl !== content.url) {
    parts.push(`CANONICAL URL: ${content.canonicalUrl}`);
  }
  if (content.text) parts.push(`PAGE CONTENT:\n${content.text}`);
  return parts.join("\n\n");
}

export class HeuristicOpportunityExtractor implements OpportunityExtractor {
  async extract(content: ExtractedOpportunityContent): Promise<OpportunityInput | null> {
    const rawText = content.text || "";
    const titleRaw = content.title || "";
    const urlStr = content.url || "";

    if (!rawText && !titleRaw) return null;

    let orgName: string | undefined =
      content.metadata?.["og:site_name"] ||
      content.metadata?.["author"] ||
      content.metadata?.["organization"];
    if (!orgName) {
      try {
        const parsedUrl = new URL(urlStr);
        const hostParts = parsedUrl.hostname.replace(/^www\./, "").split(".");
        if (hostParts.length >= 2) {
          orgName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1);
        }
      } catch {
        orgName = "Unknown Organization";
      }
    }

    if (titleRaw.includes(" - ") || titleRaw.includes(" | ") || titleRaw.includes(" at ")) {
      const parts = titleRaw.split(/\s+(?:[\-\|]|at)\s+/i);
      if (parts.length >= 2) {
        orgName = parts[parts.length - 1].trim();
      }
    }

    let title = titleRaw;
    if (title.includes(" - ") || title.includes(" | ") || title.includes(" at ")) {
      const parts = title.split(/\s+(?:[\-\|]|at)\s+/i);
      if (parts.length >= 2) {
        title = parts[0].trim();
      }
    }
    if (!title || title.length < 3) {
      title = "Opportunity at " + (orgName || "Unknown");
    }

    const fullContentLower = `${title} ${content.description || ""} ${rawText.slice(0, 3000)}`.toLowerCase();
    let type: OpportunityType = "other";
    if (fullContentLower.includes("hackathon") || fullContentLower.includes("devpost")) {
      type = "hackathon";
    } else if (fullContentLower.includes("grant") || fullContentLower.includes("non-dilutive")) {
      type = "grant";
    } else if (fullContentLower.includes("fellowship") || fullContentLower.includes("fellow")) {
      type = "fellowship";
    } else if (fullContentLower.includes("competition") || fullContentLower.includes("contest")) {
      type = "competition";
    } else if (fullContentLower.includes("funding") || fullContentLower.includes("accelerator")) {
      type = "funding";
    } else if (
      fullContentLower.includes("engineer") ||
      fullContentLower.includes("developer") ||
      fullContentLower.includes("internship") ||
      fullContentLower.includes("hiring")
    ) {
      type = "job";
    }

    const isRemote =
      fullContentLower.includes("remote") ||
      fullContentLower.includes("virtual") ||
      fullContentLower.includes("work from anywhere");
    const location = isRemote ? "Remote" : undefined;

    let deadline: string | undefined;
    const deadlineMatch = rawText.match(
      /(?:deadline|apply by|closing date|due date):\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i
    );
    if (deadlineMatch) {
      const parsedDate = new Date(deadlineMatch[1]);
      if (!isNaN(parsedDate.getTime())) deadline = parsedDate.toISOString();
    }

    const commonSkills = [
      "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Python",
      "Go", "Rust", "SQL", "Cloudflare Workers", "Tailwind CSS", "GraphQL",
    ];
    const detectedSkills = commonSkills.filter((s) => fullContentLower.includes(s.toLowerCase()));

    const description =
      content.description ||
      rawText.split("\n").filter((l) => l.length > 40).slice(0, 3).join(" ") ||
      `Opportunity listing for ${title} at ${orgName || "Unknown"}.`;

    const finalUrl = content.canonicalUrl || content.url || "https://arch.inc";

    return {
      title,
      organizationName: orgName || "Unknown Organization",
      organizationUrl: content.canonicalUrl || content.url,
      type,
      description: description.slice(0, 1000),
      sourceUrl: finalUrl,
      applicationUrl: finalUrl,
      location,
      isRemote,
      deadline,
      skills: detectedSkills.length > 0 ? detectedSkills : undefined,
      eligibility: ["See source listing for details"],
      requirements: detectedSkills.length > 0 ? [`Experience with ${detectedSkills.slice(0, 3).join(", ")}`] : undefined,
      rawContent: rawText.slice(0, 5000),
    };
  }
}

/**
 * AI-powered extractor that uses Workers AI with heuristic fallback.
 *
 * Strategy:
 * 1. Run heuristic extractor to get a baseline candidate.
 * 2. Run AI extractor with JSON schema mode.
 * 3. If AI returns valid output, prefer AI values over heuristic.
 * 4. If AI fails or is unavailable, fall back to heuristic result.
 */
export class AIOpportunityExtractor implements OpportunityExtractor {
  private readonly heuristic = new HeuristicOpportunityExtractor();

  constructor(private readonly aiProvider: AIProvider) {}

  async extract(content: ExtractedOpportunityContent): Promise<OpportunityInput | null> {
    // Run heuristic as baseline
    const heuristicResult = await this.heuristic.extract(content);

    // Skip AI on clearly invalid pages
    if (!hasMinimumContent(content)) {
      return heuristicResult;
    }

    // Prepare compact context for AI
    const pageContext = preparePageContext(content);

    // Attempt AI extraction
    let aiOutput: AIExtractionOutput | null = null;
    try {
      aiOutput = await this.aiProvider.extractOpportunity(pageContext);
    } catch {
      // AI failed, fall back to heuristic
      return heuristicResult;
    }

    if (!aiOutput) {
      return heuristicResult;
    }

    // Non-opportunity page detected by AI
    if (aiOutput.isOpportunity === false) {
      return null;
    }

    // Validate AI output
    if (!validateAIOutput(aiOutput)) {
      return heuristicResult;
    }

    const sourceUrl = content.canonicalUrl || content.url || "https://arch.inc";
    const aiInput = aiOutputToInput(aiOutput, sourceUrl);

    // Merge: prefer AI-extracted values but fill gaps from heuristic
    return {
      ...heuristicResult,
      ...aiInput,
      // Always keep the actual source URL
      sourceUrl,
      // Prefer AI application URL only if it's a real URL
      applicationUrl: aiInput.applicationUrl || heuristicResult?.applicationUrl,
      // Preserve raw content from heuristic for dedup hashing
      rawContent: heuristicResult?.rawContent,
    };
  }
}
