import type { DiscoveryQuery } from "./types";

export const DEFAULT_DISCOVERY_QUERIES: DiscoveryQuery[] = [
  {
    id: "query-job-01",
    type: "job",
    query: "senior full stack engineer typescript next.js remote job",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-job-02",
    type: "job",
    query: "frontend architect developer tools remote job",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-grant-01",
    type: "grant",
    query: "AI autonomous agent research grant 2026",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-grant-02",
    type: "grant",
    query: "open source infrastructure security grant",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-hackathon-01",
    type: "hackathon",
    query: "serverless cloudflare AI hackathon 2026",
    enabled: true,
    priority: 1,
  },
  {
    id: "query-fellowship-01",
    type: "fellowship",
    query: "techstars founder accelerator fellowship 2026",
    enabled: true,
    priority: 1,
  },
];

export async function getActiveDiscoveryQueries(db: D1Database): Promise<DiscoveryQuery[]> {
  try {
    const res = await db
      .prepare(`SELECT * FROM discovery_queries WHERE enabled = 1 ORDER BY priority DESC`)
      .all<DiscoveryQuery>();

    if (res.results && res.results.length > 0) {
      return res.results;
    }
  } catch {
    // If table query fails, fallback to defaults
  }
  return DEFAULT_DISCOVERY_QUERIES;
}
