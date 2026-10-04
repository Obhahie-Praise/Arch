import type { DiscoverySourceConfig } from "./types";

export const DISCOVERY_SOURCES: DiscoverySourceConfig[] = [
  // --- Tier 1: Major Job & Opportunity Platforms ---
  {
    id: "linkedin-jobs",
    name: "LinkedIn Jobs",
    domain: "linkedin.com",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:linkedin.com/jobs/view software engineer",
      "site:linkedin.com/jobs/view frontend developer",
      "site:linkedin.com/jobs/view full stack typescript",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "indeed",
    name: "Indeed",
    domain: "indeed.com",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:indeed.com/viewjob software engineer",
      "site:indeed.com/viewjob frontend developer",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "wellfound",
    name: "Wellfound",
    domain: "wellfound.com",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:wellfound.com/jobs software engineer",
      "site:wellfound.com/jobs developer",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    domain: "boards.greenhouse.io",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:boards.greenhouse.io software engineer",
      "site:boards.greenhouse.io frontend",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "lever",
    name: "Lever",
    domain: "jobs.lever.co",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:jobs.lever.co software engineer",
      "site:jobs.lever.co frontend",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "ashby",
    name: "Ashby",
    domain: "jobs.ashbyhq.com",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:jobs.ashbyhq.com software engineer",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "ycombinator",
    name: "Y Combinator Jobs",
    domain: "ycombinator.com",
    types: ["job"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:ycombinator.com/jobs software engineer",
    ],
    refreshIntervalHours: 4,
  },

  // --- Tier 1: Hackathons ---
  {
    id: "devpost",
    name: "Devpost",
    domain: "devpost.com",
    types: ["hackathon"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:devpost.com hackathon",
      "site:devpost.com AI hackathon",
    ],
    refreshIntervalHours: 4,
  },
  {
    id: "lablab",
    name: "LabLab",
    domain: "lablab.ai",
    types: ["hackathon"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:lablab.ai/event hackathon",
    ],
    refreshIntervalHours: 4,
  },

  // --- Tier 1: Grants & Fellowships ---
  {
    id: "grants-gov",
    name: "Grants.gov",
    domain: "grants.gov",
    types: ["grant"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:grants.gov research grant technology",
    ],
    refreshIntervalHours: 6,
  },
  {
    id: "techstars",
    name: "Techstars",
    domain: "techstars.com",
    types: ["fellowship"],
    priority: 1,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "site:techstars.com/accelerators",
    ],
    refreshIntervalHours: 6,
  },

  // --- Tier 2: General Sources ---
  {
    id: "generic-jobs",
    name: "Generic Job Boards",
    domain: "",
    types: ["job"],
    priority: 2,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "remote typescript developer job 2026",
    ],
    refreshIntervalHours: 12,
  },
  {
    id: "generic-grants",
    name: "Generic Grants",
    domain: "",
    types: ["grant"],
    priority: 2,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "AI open source infrastructure grant 2026",
    ],
    refreshIntervalHours: 12,
  },
  {
    id: "generic-fellowships",
    name: "Generic Fellowships",
    domain: "",
    types: ["fellowship"],
    priority: 2,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "founder fellowship software technology 2026",
    ],
    refreshIntervalHours: 12,
  },

  // --- Tier 3: Broad Web Discovery ---
  {
    id: "broad-discovery",
    name: "Broad Web Discovery",
    domain: "",
    types: ["job", "grant", "hackathon", "fellowship", "competition"],
    priority: 3,
    enabled: true,
    discoveryStrategy: "search",
    queries: [
      "latest opportunities for developers 2026",
    ],
    refreshIntervalHours: 24,
  }
];
