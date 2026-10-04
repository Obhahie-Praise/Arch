import type { DiscoveryQuery } from "./types";

/**
 * Default discovery queries used when no queries are found in the D1 database.
 *
 * Queries are designed to be:
 * - Source-specific where possible (site: prefixes)
 * - High-signal (targeted at known opportunity pages)
 * - Category-specific
 * - Diverse (multiple angles per category)
 *
 * Priority: 1 = highest, 3 = lowest.
 */
export const DEFAULT_DISCOVERY_QUERIES: DiscoveryQuery[] = [
  // --- Jobs: Tier 1 platform-targeted ---
  {
    id: "query-job-greenhouse-01",
    type: "job",
    query: "site:boards.greenhouse.io software engineer",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-greenhouse-02",
    type: "job",
    query: "site:boards.greenhouse.io frontend developer typescript",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-lever-01",
    type: "job",
    query: "site:jobs.lever.co software engineer",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-lever-02",
    type: "job",
    query: "site:jobs.lever.co frontend react typescript",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-ashby-01",
    type: "job",
    query: "site:jobs.ashbyhq.com software engineer",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-wellfound-01",
    type: "job",
    query: "site:wellfound.com/jobs developer",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-yc-01",
    type: "job",
    query: "site:ycombinator.com/jobs software engineer",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-linkedin-01",
    type: "job",
    query: "site:linkedin.com/jobs/view software engineer remote",
    enabled: true,
    priority: 1,
  },

  // --- Hackathons: Tier 1 platform-targeted ---
  {
    id: "query-hackathon-devpost-01",
    type: "hackathon",
    query: "site:devpost.com hackathon",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-hackathon-devpost-02",
    type: "hackathon",
    query: "site:devpost.com AI hackathon 2026",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-hackathon-lablab-01",
    type: "hackathon",
    query: "site:lablab.ai/event hackathon",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-hackathon-lablab-02",
    type: "hackathon",
    query: "site:lablab.ai challenge AI",
    enabled: true,
    priority: 1,
  },

  // --- Grants: Tier 1 platform-targeted ---
  {
    id: "query-grant-gov-01",
    type: "grant",
    query: "site:grants.gov research grant technology 2026",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-grant-general-01",
    type: "grant",
    query: "open source infrastructure security grant 2026 apply",
    enabled: true,
    priority: 2,
  },
  {
    id: "query-grant-ai-01",
    type: "grant",
    query: "AI research grant non-dilutive funding 2026",
    enabled: true,
    priority: 2,
  },

  // --- Fellowships: Tier 1 ---
  {
    id: "query-fellowship-techstars-01",
    type: "fellowship",
    query: "site:techstars.com accelerator fellowship apply 2026",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-fellowship-general-01",
    type: "fellowship",
    query: "developer technology fellowship program 2026 apply",
    enabled: true,
    priority: 2,
  },

  // --- Competitions: Tier 2 ---
  {
    id: "query-competition-dev-01",
    type: "competition",
    query: "developer competition prize 2026",
    enabled: true,
    priority: 2,
  },
];

export async function getActiveDiscoveryQueries(
  db: D1Database
): Promise<DiscoveryQuery[]> {
  try {
    const res = await db
      .prepare(
        `SELECT * FROM discovery_queries WHERE enabled = 1 ORDER BY priority DESC`
      )
      .all<DiscoveryQuery>();

    if (res.results && res.results.length > 0) {
      return res.results;
    }
  } catch {
    // If table query fails, fallback to defaults
  }
  return DEFAULT_DISCOVERY_QUERIES;
}
