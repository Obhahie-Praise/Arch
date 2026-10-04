/**
 * AI Semantic Matching Layer
 *
 * Reuses the Workers AI binding through the existing provider abstraction.
 * Keeps matching-specific prompt and schema separate from extraction.
 */

import type { AIMatchResult } from "../matching/types";
import type { OpportunityRow } from "../opportunities/types";

// Compact profile view sent to AI — only fields useful for matching
export interface MatchingProfile {
  // Identity context
  country?: string | null;
  city?: string | null;
  citizenship?: string | null;
  studentStatus?: string | null;

  // Skills
  technicalSkills?: string[];
  nonTechnicalSkills?: string[];
  tools?: string[];

  // Interests & goals
  desiredRoles?: string[];
  desiredIndustries?: string[];
  opportunityTypes?: string[];
  shortTermGoals?: string | null;
  longTermGoals?: string | null;

  // Experience summary
  experienceSummary?: string | null;
}

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_OPP_CHARS = 1500;
const MAX_PROFILE_CHARS = 800;

const SYSTEM_MATCHING_PROMPT = `You are an opportunity matching system for Arch, a personalized opportunity discovery platform.

Your task: Evaluate the compatibility between a user profile and a single opportunity using ONLY the supplied information.

RULES:
1. Score range: 0.0 to 1.0. 0 = no match, 1 = perfect match.
2. Identify genuine strengths (concrete reasons the user fits this opportunity).
3. Identify genuine gaps (concrete reasons the user may not fit or may struggle).
4. Do NOT invent user experience that is not listed.
5. Do NOT invent opportunity requirements that are not stated.
6. Calibrate confidence based on the completeness of supplied information — low if profile is sparse.
7. Do NOT browse the internet. Only reason over supplied data.
8. Keep strengths and gaps concise — one clear sentence each, max 5 per list.`;

const MATCHING_JSON_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number" },
    strengths: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    reason: { type: "string" },
    confidence: { type: "number" },
  },
  required: ["score", "strengths", "gaps", "reason", "confidence"],
};

function serializeProfile(profile: MatchingProfile): string {
  const parts: string[] = [];
  if (profile.country) parts.push(`Country: ${profile.country}`);
  if (profile.city) parts.push(`City: ${profile.city}`);
  if (profile.citizenship) parts.push(`Citizenship: ${profile.citizenship}`);
  if (profile.studentStatus) parts.push(`Student status: ${profile.studentStatus}`);
  if (profile.technicalSkills?.length) {
    parts.push(`Technical skills: ${profile.technicalSkills.join(", ")}`);
  }
  if (profile.nonTechnicalSkills?.length) {
    parts.push(`Other skills: ${profile.nonTechnicalSkills.join(", ")}`);
  }
  if (profile.tools?.length) parts.push(`Tools: ${profile.tools.join(", ")}`);
  if (profile.desiredRoles?.length) {
    parts.push(`Desired roles: ${profile.desiredRoles.join(", ")}`);
  }
  if (profile.desiredIndustries?.length) {
    parts.push(`Desired industries: ${profile.desiredIndustries.join(", ")}`);
  }
  if (profile.opportunityTypes?.length) {
    parts.push(`Preferred opportunity types: ${profile.opportunityTypes.join(", ")}`);
  }
  if (profile.shortTermGoals) parts.push(`Short-term goals: ${profile.shortTermGoals}`);
  if (profile.longTermGoals) parts.push(`Long-term goals: ${profile.longTermGoals}`);
  if (profile.experienceSummary) parts.push(`Experience: ${profile.experienceSummary}`);
  return parts.join("\n").slice(0, MAX_PROFILE_CHARS);
}

function serializeOpportunity(opp: OpportunityRow): string {
  const parts: string[] = [];
  parts.push(`Title: ${opp.title}`);
  parts.push(`Organization: ${opp.organization_name}`);
  parts.push(`Type: ${opp.type}`);
  if (opp.description) parts.push(`Description: ${opp.description}`);
  if (opp.location) parts.push(`Location: ${opp.location}`);
  if (opp.country) parts.push(`Country: ${opp.country}`);
  if (opp.is_remote) parts.push(`Remote: Yes`);
  if (opp.deadline) parts.push(`Deadline: ${opp.deadline}`);
  if (opp.eligibility) parts.push(`Eligibility: ${opp.eligibility}`);
  if (opp.requirements) parts.push(`Requirements: ${opp.requirements}`);
  if (opp.skills) parts.push(`Skills: ${opp.skills}`);
  if (opp.benefits) parts.push(`Benefits: ${opp.benefits}`);
  return parts.join("\n").slice(0, MAX_OPP_CHARS);
}

export interface MatchingAI {
  evaluate(profile: MatchingProfile, opportunity: OpportunityRow): Promise<AIMatchResult | null>;
}

/**
 * Workers AI implementation for semantic matching.
 */
export class WorkersAIMatchingProvider implements MatchingAI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly ai: any) {}

  async evaluate(profile: MatchingProfile, opportunity: OpportunityRow): Promise<AIMatchResult | null> {
    const profileText = serializeProfile(profile);
    const oppText = serializeOpportunity(opportunity);

    const userContent = [
      "USER PROFILE:",
      profileText,
      "",
      "OPPORTUNITY:",
      oppText,
    ].join("\n");

    try {
      const response = await this.ai.run(AI_MODEL, {
        messages: [
          { role: "system", content: SYSTEM_MATCHING_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "opportunity_match",
            strict: true,
            schema: MATCHING_JSON_SCHEMA,
          },
        },
      });

      const raw = typeof response === "string" ? response : response?.response ?? "";
      if (!raw) return null;

      const parsed = JSON.parse(raw) as AIMatchResult;

      // Clamp values to valid ranges
      parsed.score = Math.max(0, Math.min(1, parsed.score ?? 0));
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence ?? 0));
      parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [];
      parsed.gaps = Array.isArray(parsed.gaps) ? parsed.gaps.slice(0, 5) : [];
      parsed.reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : "";

      return parsed;
    } catch {
      return null;
    }
  }
}

/**
 * No-op matching AI — used when AI binding is absent or for deterministic-only mode.
 */
export class NullMatchingAI implements MatchingAI {
  async evaluate(_profile: MatchingProfile, _opportunity: OpportunityRow): Promise<AIMatchResult | null> {
    return null;
  }
}

export function createMatchingAI(ai: unknown): MatchingAI {
  if (ai) return new WorkersAIMatchingProvider(ai);
  return new NullMatchingAI();
}
