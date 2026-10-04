import type { OpportunityInput } from "./types";

/**
 * Clean and normalize URLs by lowercasing hostname, removing tracking params (utm_*, ref, etc.),
 * and removing trailing slashes.
 */
export function normalizeUrl(urlStr: string): string {
  if (!urlStr) return "";
  try {
    const parsed = new URL(urlStr.trim());
    parsed.hostname = parsed.hostname.toLowerCase();
    
    // Remove common tracking parameters
    const paramsToKeep: [string, string][] = [];
    for (const [key, value] of parsed.searchParams.entries()) {
      const k = key.toLowerCase();
      if (!k.startsWith("utm_") && k !== "ref" && k !== "fbclid" && k !== "gclid" && k !== "mc_eid") {
        paramsToKeep.push([key, value]);
      }
    }
    
    parsed.search = "";
    for (const [k, v] of paramsToKeep) {
      parsed.searchParams.append(k, v);
    }

    let res = parsed.toString();
    if (res.endsWith("/")) {
      res = res.slice(0, -1);
    }
    return res;
  } catch {
    return urlStr.trim().toLowerCase();
  }
}

/**
 * Normalizes title string by removing company suffix patterns and extra spaces.
 */
export function normalizeTitle(title: string): string {
  if (!title) return "";
  let clean = title.trim();
  // Strip common trailing patterns like " - Organization" or " | Organization"
  clean = clean.replace(/\s+[\-\|]\s+.*$/, "");
  // Remove extra whitespace
  clean = clean.replace(/\s+/g, " ").toLowerCase();
  return clean;
}

/**
 * Normalizes organization name by stripping legal suffixes.
 */
export function normalizeOrg(org: string): string {
  if (!org) return "";
  let clean = org.trim();
  clean = clean.replace(/\b(inc\.?|llc\.?|corp\.?|corporation|ltd\.?|limited|co\.?|company)\b/gi, "");
  clean = clean.replace(/\s+/g, " ").trim().toLowerCase();
  return clean;
}

/**
 * Normalizes general text for fuzzy comparisons.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Creates a URL-friendly slug from title and organization.
 */
export function createSlug(title: string, orgName: string): string {
  const base = `${title} ${orgName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const shortId = Math.random().toString(36).substring(2, 8);
  return `${base.slice(0, 60)}-${shortId}`;
}

/**
 * Deterministically computes a content hash using SHA-256 via Web Crypto API.
 */
export async function computeContentHash(input: OpportunityInput): Promise<string> {
  const nTitle = normalizeTitle(input.title);
  const nOrg = normalizeOrg(input.organizationName);
  const nType = input.type.toLowerCase();
  const nDesc = normalizeText((input.description || "").slice(0, 500));
  const nSource = normalizeUrl(input.sourceUrl);

  const rawPayload = `${nTitle}|${nOrg}|${nType}|${nDesc}|${nSource}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(rawPayload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
