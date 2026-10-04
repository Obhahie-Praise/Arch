import type { OpportunityType } from "../opportunities/types";

export interface AIExtractionOutput {
  isOpportunity: boolean;
  title?: string | null;
  organizationName?: string | null;
  organizationUrl?: string | null;
  type?: OpportunityType | null;
  description?: string | null;
  applicationUrl?: string | null;
  location?: string | null;
  country?: string | null;
  isRemote?: boolean | null;
  deadline?: string | null;
  eligibility?: string[] | null;
  requirements?: string[] | null;
  skills?: string[] | null;
  benefits?: string[] | null;
  compensation?: Record<string, unknown> | null;
  fundingAmount?: Record<string, unknown> | null;
}

export const SYSTEM_EXTRACTION_PROMPT = `You are an information extraction system for Arch, an opportunity discovery platform.
Given cleaned webpage content, determine whether the page represents a genuine opportunity (e.g. job, grant, hackathon, fellowship, competition, funding) and extract the details into the structured format.

CRITICAL GROUNDING & ACCURACY RULES:
1. Extract ONLY facts explicitly supported by the supplied webpage text.
2. DO NOT hallucinate, infer, guess, or use outside knowledge.
3. If information is not present or is ambiguous (such as compensation, deadline, location, or eligibility), set that property to null.
4. Set "isOpportunity" to false if the page is a search results page, login/auth page, generic homepage, news article, or non-opportunity page.
5. Classify the opportunity type strictly into one of: 'job', 'grant', 'hackathon', 'fellowship', 'competition', 'funding', 'other'.
6. Application URL must be an explicit apply/register link from the page, or null if not specified.`;

export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    isOpportunity: { type: "boolean" },
    title: { type: ["string", "null"] },
    organizationName: { type: ["string", "null"] },
    organizationUrl: { type: ["string", "null"] },
    type: {
      type: ["string", "null"],
      enum: ["job", "grant", "hackathon", "fellowship", "competition", "funding", "other", null],
    },
    description: { type: ["string", "null"] },
    applicationUrl: { type: ["string", "null"] },
    location: { type: ["string", "null"] },
    country: { type: ["string", "null"] },
    isRemote: { type: ["boolean", "null"] },
    deadline: { type: ["string", "null"] },
    eligibility: { type: ["array", "null"], items: { type: "string" } },
    requirements: { type: ["array", "null"], items: { type: "string" } },
    skills: { type: ["array", "null"], items: { type: "string" } },
    benefits: { type: ["array", "null"], items: { type: "string" } },
  },
  required: ["isOpportunity"],
};
