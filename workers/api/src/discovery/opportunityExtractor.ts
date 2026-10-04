import type { ExtractedOpportunityContent, OpportunityInput } from "./types";
import type { OpportunityType } from "../opportunities/types";

export interface OpportunityExtractor {
  extract(content: ExtractedOpportunityContent): Promise<OpportunityInput | null>;
}

export class HeuristicOpportunityExtractor implements OpportunityExtractor {
  async extract(content: ExtractedOpportunityContent): Promise<OpportunityInput | null> {
    const rawText = content.text || "";
    const titleRaw = content.title || "";
    const urlStr = content.url || "";

    if (!rawText && !titleRaw) return null;

    // 1. Determine Organization Name
    let orgName = content.metadata?.["og:site_name"] || content.metadata?.["author"] || content.metadata?.["organization"];
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

    // Try extracting company from title pattern e.g., "Software Engineer - Vercel"
    if (titleRaw.includes(" - ") || titleRaw.includes(" | ") || titleRaw.includes(" at ")) {
      const parts = titleRaw.split(/\s+(?:[\-\|]|at)\s+/i);
      if (parts.length >= 2) {
        orgName = parts[parts.length - 1].trim();
      }
    }

    // 2. Determine Opportunity Title
    let title = titleRaw;
    if (title.includes(" - ") || title.includes(" | ") || title.includes(" at ")) {
      const parts = title.split(/\s+(?:[\-\|]|at)\s+/i);
      if (parts.length >= 2) {
        title = parts[0].trim();
      }
    }
    if (!title || title.length < 3) {
      title = "Opportunity at " + orgName;
    }

    // 3. Infer Opportunity Type
    const fullContentLower = `${title} ${content.description || ""} ${rawText.slice(0, 3000)}`.toLowerCase();
    let type: OpportunityType = "other";

    if (fullContentLower.includes("hackathon") || fullContentLower.includes("devpost") || fullContentLower.includes("bounty")) {
      type = "hackathon";
    } else if (fullContentLower.includes("grant") || fullContentLower.includes("research grant") || fullContentLower.includes("non-dilutive")) {
      type = "grant";
    } else if (fullContentLower.includes("fellowship") || fullContentLower.includes("fellow")) {
      type = "fellowship";
    } else if (fullContentLower.includes("competition") || fullContentLower.includes("contest") || fullContentLower.includes("challenge")) {
      type = "competition";
    } else if (fullContentLower.includes("funding") || fullContentLower.includes("accelerator") || fullContentLower.includes("venture")) {
      type = "funding";
    } else if (
      fullContentLower.includes("engineer") ||
      fullContentLower.includes("developer") ||
      fullContentLower.includes("manager") ||
      fullContentLower.includes("internship") ||
      fullContentLower.includes("career") ||
      fullContentLower.includes("job") ||
      fullContentLower.includes("hiring")
    ) {
      type = "job";
    }

    // 4. Remote & Location status
    const isRemote =
      fullContentLower.includes("remote") ||
      fullContentLower.includes("virtual") ||
      fullContentLower.includes("work from anywhere") ||
      fullContentLower.includes("worldwide");

    let location = isRemote ? "Remote" : undefined;
    const locMatch = rawText.match(/(?:Location|Based in|Office):\s*([^\n\r,]+(?:,\s*[^\n\r,]+)?)/i);
    if (locMatch) {
      location = locMatch[1].trim();
    }

    // 5. Deadline Parsing
    let deadline: string | undefined = undefined;
    const deadlineMatch = rawText.match(
      /(?:deadline|apply by|closing date|due date):\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i
    );
    if (deadlineMatch) {
      const parsedDate = new Date(deadlineMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        deadline = parsedDate.toISOString();
      }
    }

    // 6. Extract Skills & Requirements keywords
    const commonSkills = [
      "TypeScript",
      "JavaScript",
      "React",
      "Next.js",
      "Node.js",
      "Python",
      "Go",
      "Rust",
      "C++",
      "SQL",
      "Cloudflare Workers",
      "AWS",
      "GCP",
      "Tailwind CSS",
      "GraphQL",
      "UI/UX Design",
    ];
    const detectedSkills = commonSkills.filter((skill) =>
      fullContentLower.includes(skill.toLowerCase())
    );

    // 7. Formulate description
    const description =
      content.description ||
      rawText
        .split("\n")
        .filter((l) => l.length > 40)
        .slice(0, 3)
        .join(" ") ||
      `Opportunity listing for ${title} at ${orgName}.`;

    const finalSourceUrl = content.canonicalUrl || content.url || "https://arch.inc";

    return {
      title,
      organizationName: orgName || "Unknown Organization",
      organizationUrl: content.canonicalUrl || content.url,
      type,
      description: description.slice(0, 1000),
      sourceUrl: finalSourceUrl,
      applicationUrl: finalSourceUrl,
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
