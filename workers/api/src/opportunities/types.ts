export type OpportunityType =
  | "job"
  | "grant"
  | "hackathon"
  | "fellowship"
  | "competition"
  | "funding"
  | "other";

export type OpportunityStatus = "active" | "expiring" | "expired" | "archived";

export type UserOpportunityStatus = "matched" | "saved" | "pursuing" | "dismissed";

export type SourceType = "search" | "website" | "api" | "manual";

export interface OpportunityRow {
  id: string;
  title: string;
  slug: string;
  organization_name: string;
  organization_url: string | null;
  type: OpportunityType;
  description: string | null;
  application_url: string | null;
  source_url: string;
  location: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  is_remote: number;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  eligibility: string | null; // JSON array
  requirements: string | null; // JSON array
  skills: string | null; // JSON array
  benefits: string | null; // JSON array
  compensation: string | null; // JSON object
  funding_amount: string | null; // JSON object
  status: OpportunityStatus;
  first_seen_at: string;
  last_seen_at: string;
  last_verified_at: string;
  expires_at: string | null;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunitySourceRow {
  id: string;
  name: string;
  base_url: string | null;
  source_type: SourceType;
  enabled: number;
  priority: number;
  discovery_interval_minutes: number;
  last_checked_at: string | null;
  next_check_at: string | null;
  health_status: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunitySourceMapRow {
  id: string;
  opportunity_id: string;
  source_id: string | null;
  source_url: string;
  external_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

export interface UserOpportunityMatchRow {
  id: string;
  user_id: string;
  opportunity_id: string;
  match_score: number;
  eligibility_score: number;
  skills_score: number;
  interest_score: number;
  experience_score: number;
  location_score: number;
  preference_score: number;
  match_reasons: string | null; // JSON array
  potential_mismatches: string | null; // JSON array
  status: UserOpportunityStatus;
  surfaced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JoinedOpportunityMatchRow {
  id: string;
  opportunity_id: string;
  user_id: string;
  title: string;
  slug: string;
  organization_name: string;
  organization_url: string | null;
  type: OpportunityType;
  description: string | null;
  application_url: string | null;
  source_url: string;
  location: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  is_remote: number;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  eligibility: string | null;
  requirements: string | null;
  skills: string | null;
  benefits: string | null;
  compensation: string | null;
  funding_amount: string | null;
  status: OpportunityStatus;
  user_status: UserOpportunityStatus;
  match_score: number;
  eligibility_score: number;
  skills_score: number;
  interest_score: number;
  experience_score: number;
  location_score: number;
  preference_score: number;
  match_reasons: string | null;
  potential_mismatches: string | null;
  ai_match_score: number | null;
  ai_match_reasons: string | null; // JSON array
  ai_match_gaps: string | null;    // JSON array
  ai_confidence: number | null;
  ai_ran: number;                  // 0 | 1
  eligibility_status: number;      // -1 | 0 | 1
  week_key: string | null;
  final_score: number;
  first_seen_at: string;
  last_seen_at: string;
  last_verified_at: string;
  expires_at: string | null;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface UserOpportunityQuotaRow {
  id: string;
  user_id: string;
  week_start: string;
  recommendations_used: number;
  created_at: string;
  updated_at: string;
}

export interface OpportunityFormatted {
  id: string;
  title: string;
  slug: string;
  organizationName: string;
  organizationUrl?: string | null;
  type: OpportunityType;
  description?: string | null;
  applicationUrl?: string | null;
  sourceUrl: string;
  location?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  isRemote: boolean;
  deadline?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  eligibility: string[];
  requirements: string[];
  skills: string[];
  benefits: string[];
  compensation?: Record<string, unknown> | null;
  fundingAmount?: Record<string, unknown> | null;
  status: OpportunityStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  lastVerifiedAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // User-specific match properties when returned in user context
  userStatus?: UserOpportunityStatus;
  matchScore?: number;
  finalScore?: number;
  eligibilityStatus?: number;
  matchReasons?: string[];
  potentialMismatches?: string[];
  aiMatchScore?: number | null;
  aiStrengths?: string[];
  aiGaps?: string[];
  aiConfidence?: number | null;
  aiRan?: boolean;
}
