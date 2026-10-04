import type { OpportunityType } from "./types";

export interface OpportunityFilterQuery {
  status?: string;
  type?: OpportunityType;
  search?: string;
  isRemote?: boolean;
}

export function validateOpportunityId(id: string): boolean {
  return typeof id === "string" && id.trim().length > 0;
}
