import type { OpportunityInput, IngestionResult } from "./types";
import { normalizeUrl, computeContentHash, createSlug } from "./normalizer";
import { findDuplicateOpportunity } from "./dedupe";
import { getNowIso } from "../lib/dates";
import type { OpportunityType, OpportunityStatus } from "../opportunities/types";

const VALID_TYPES: OpportunityType[] = [
  "job",
  "grant",
  "hackathon",
  "fellowship",
  "competition",
  "funding",
  "other",
];

export class IngestionService {
  /**
   * Ingests an opportunity input record, performing validation, normalization, deduplication, and persistence.
   */
  static async ingestOpportunity(
    db: D1Database,
    input: OpportunityInput,
    sourceId?: string
  ): Promise<IngestionResult> {
    // 1. Validation
    if (!input.title || !input.title.trim()) {
      return { status: "rejected", reason: "Title is required" };
    }
    if (!input.organizationName || !input.organizationName.trim()) {
      return { status: "rejected", reason: "Organization name is required" };
    }
    if (!input.sourceUrl || !input.sourceUrl.trim()) {
      return { status: "rejected", reason: "Source URL is required" };
    }
    if (!VALID_TYPES.includes(input.type)) {
      return { status: "rejected", reason: `Invalid opportunity type: ${input.type}` };
    }

    const now = getNowIso();
    const normalizedSourceUrl = normalizeUrl(input.sourceUrl);
    const normalizedAppUrl = input.applicationUrl ? normalizeUrl(input.applicationUrl) : null;
    const contentHash = await computeContentHash(input);

    // 2. Deduplication check
    const dupResult = await findDuplicateOpportunity(db, input, contentHash);

    if (dupResult.isDuplicate && dupResult.existingOpportunity) {
      const existing = dupResult.existingOpportunity;
      const oppId = existing.id;

      // Update source provenance
      const mapId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO opportunity_sources_map (id, opportunity_id, source_id, source_url, external_id, first_seen_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT DO UPDATE SET last_seen_at = excluded.last_seen_at`
        )
        .bind(mapId, oppId, sourceId || null, normalizedSourceUrl, input.externalId || null, now, now)
        .run();

      // Check if critical fields updated
      let hasChanges = false;
      const newStatus: OpportunityStatus =
        input.deadline && new Date(input.deadline).getTime() < Date.now() ? "expired" : "active";

      if (existing.status !== newStatus) hasChanges = true;
      if (input.deadline && existing.deadline !== input.deadline) hasChanges = true;
      if (input.description && existing.description !== input.description) hasChanges = true;

      // Update existing record timestamps and fields
      await db
        .prepare(
          `UPDATE opportunities
           SET last_seen_at = ?, last_verified_at = ?, status = ?, deadline = COALESCE(?, deadline), description = COALESCE(?, description), updated_at = ?
           WHERE id = ?`
        )
        .bind(now, now, newStatus, input.deadline || null, input.description || null, now, oppId)
        .run();

      return {
        status: hasChanges ? "updated" : "unchanged",
        opportunityId: oppId,
        message: `Deduplicated using signal '${dupResult.matchSignal}'`,
      };
    }

    // 3. Insert new opportunity
    const oppId = crypto.randomUUID();
    const slug = createSlug(input.title, input.organizationName);
    const initialStatus: OpportunityStatus =
      input.deadline && new Date(input.deadline).getTime() < Date.now() ? "expired" : "active";

    await db
      .prepare(
        `INSERT INTO opportunities (
          id, title, slug, organization_name, organization_url, type, description,
          application_url, source_url, location, country, region, city, is_remote,
          deadline, start_date, end_date, eligibility, requirements, skills, benefits,
          compensation, funding_amount, status, first_seen_at, last_seen_at, last_verified_at,
          expires_at, content_hash, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?
        )`
      )
      .bind(
        oppId,
        input.title.trim(),
        slug,
        input.organizationName.trim(),
        input.organizationUrl ? normalizeUrl(input.organizationUrl) : null,
        input.type,
        input.description || null,
        normalizedAppUrl,
        normalizedSourceUrl,
        input.location || null,
        input.country || null,
        input.region || null,
        input.city || null,
        input.isRemote ? 1 : 0,
        input.deadline || null,
        input.startDate || null,
        input.endDate || null,
        input.eligibility ? JSON.stringify(input.eligibility) : null,
        input.requirements ? JSON.stringify(input.requirements) : null,
        input.skills ? JSON.stringify(input.skills) : null,
        input.benefits ? JSON.stringify(input.benefits) : null,
        input.compensation ? JSON.stringify(input.compensation) : null,
        input.fundingAmount ? JSON.stringify(input.fundingAmount) : null,
        initialStatus,
        now,
        now,
        now,
        input.deadline || null,
        contentHash,
        now,
        now
      )
      .run();

    // Insert source map entry
    const mapId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO opportunity_sources_map (id, opportunity_id, source_id, source_url, external_id, first_seen_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(mapId, oppId, sourceId || null, normalizedSourceUrl, input.externalId || null, now, now)
      .run();

    return { status: "created", opportunityId: oppId };
  }
}
