import type { OpportunityType, SourceType } from "../opportunities/types";

export interface OpportunityInput {
  title: string;
  organizationName: string;
  organizationUrl?: string;
  type: OpportunityType;

  description?: string;

  applicationUrl?: string;
  sourceUrl: string;

  location?: string;
  country?: string;
  region?: string;
  city?: string;
  isRemote?: boolean;

  deadline?: string;
  startDate?: string;
  endDate?: string;

  eligibility?: string[];
  requirements?: string[];
  skills?: string[];
  benefits?: string[];

  compensation?: Record<string, unknown>;
  fundingAmount?: Record<string, unknown>;

  externalId?: string;

  rawContent?: string;
}

export type IngestionStatus = "created" | "updated" | "unchanged" | "rejected";

export interface IngestionResult {
  status: IngestionStatus;
  opportunityId?: string;
  message?: string;
  reason?: string;
}

export interface OpportunityCandidate {
  url: string;
  title?: string;
  snippet?: string;
  sourceDomain?: string;
  discoveryQueryId?: string;
  sourceType?: SourceType;
}

export interface ExtractedOpportunityContent {
  url: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  text: string;
  metadata?: Record<string, string>;
}

export interface DiscoveryQuery {
  id: string;
  type: OpportunityType;
  query: string;
  enabled: boolean;
  priority: number;
}

export interface DiscoverySourceConfig {
  id: string;
  name: string;
  domain: string;
  types: OpportunityType[];
  priority: 1 | 2 | 3;
  enabled: boolean;
  discoveryStrategy: "search" | "direct" | "both";
  queries?: string[];
  directUrls?: string[];
  refreshIntervalHours: number;
}

export interface DiscoveryContext {
  queries: DiscoveryQuery[];
  env: Record<string, unknown>;
}

export interface OpportunityDiscoveryProvider {
  id: string;
  name: string;
  type: SourceType;
  discover(context: DiscoveryContext): Promise<OpportunityCandidate[]>;
}

export interface DiscoveryRunSummary {
  id: string;
  providerId: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "failed";
  candidatesFound: number;
  pagesFetched: number;
  opportunitiesCreated: number;
  opportunitiesUpdated: number;
  opportunitiesRejected: number;
  errors: string[];
}
