/**
 * AI Provider Router
 *
 * Sits between callers (discovery pipeline, matching engine) and concrete
 * AI provider implementations (Workers AI, future providers).
 *
 * Responsibilities:
 * - Evaluate feature flags before forwarding calls.
 * - Catch every error thrown by the underlying provider and convert it into a
 *   controlled AI-unavailable result instead of propagating into the caller.
 * - Log failures so operators can diagnose them in Worker logs.
 *
 * Fail-closed semantics: the router never throws. When AI is unavailable —
 * whether because the flag is off, the binding is absent, or the provider
 * threw — callers receive the AI_UNAVAILABLE sentinel. Callers must handle
 * that sentinel explicitly; they must not treat it as a normal null result.
 *
 * The sentinel is a plain branded object rather than a subclass of Error so it
 * can cross async boundaries cleanly and be narrowed with a simple type guard.
 */

import type { AIProvider } from "./provider";
import type { MatchingAI, MatchingProfile } from "./matching";
import type { AIExtractionOutput } from "./schemas";
import type { AIMatchResult } from "../matching/types";
import type { OpportunityRow } from "../opportunities/types";
import type { AIFeatureFlags } from "./flags";
import { DEFAULT_AI_FLAGS } from "./flags";

// ─── Sentinel type ───────────────────────────────────────────────────────────

/**
 * Returned by AIRouter when the AI layer is unavailable, disabled, or errored.
 * Distinct from `null` (which means "not an opportunity") so callers can log
 * and fall back gracefully without masking a real AI rejection.
 */
export interface AiUnavailableResult {
  readonly __aiUnavailable: true;
  /** Human-readable reason for observability / logging. */
  readonly reason: string;
}

/** Construct an unavailable result with a reason string. */
function unavailable(reason: string): AiUnavailableResult {
  return { __aiUnavailable: true, reason };
}

/** Type guard — narrows `AIExtractionOutput | AiUnavailableResult | null`. */
export function isAiUnavailable(
  value: unknown
): value is AiUnavailableResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as AiUnavailableResult).__aiUnavailable === true
  );
}

// ─── AIRouter ────────────────────────────────────────────────────────────────

/**
 * Fail-closed router for the extraction AI provider.
 *
 * Implements `AIProvider` so it can be used wherever a raw provider is
 * accepted, without changes to callers.
 */
export class AIRouter implements AIProvider {
  private readonly flags: AIFeatureFlags;

  constructor(
    private readonly inner: AIProvider,
    flags: Partial<AIFeatureFlags> = {}
  ) {
    this.flags = { ...DEFAULT_AI_FLAGS, ...flags };
  }

  async extractOpportunity(
    pageContent: string
  ): Promise<AIExtractionOutput | AiUnavailableResult | null> {
    if (!this.flags.enabled || !this.flags.extraction) {
      return unavailable("AI extraction disabled by feature flag");
    }

    try {
      return await this.inner.extractOpportunity(pageContent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AIRouter] extractOpportunity failed: ${msg}`);
      return unavailable(msg);
    }
  }

  async streamChat(messages: unknown[]): Promise<ReadableStream | string> {
    if (!this.flags.enabled) {
      return "AI chat is currently unavailable.";
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await this.inner.streamChat(messages as any[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AIRouter] streamChat failed: ${msg}`);
      return "AI chat is currently unavailable.";
    }
  }
}

// ─── MatchingAIRouter ────────────────────────────────────────────────────────

/**
 * Fail-closed router for the semantic matching AI.
 *
 * Implements `MatchingAI` so it can replace any matching AI instance.
 * On flag-off or provider error, returns `null` — the matching engine treats
 * null as "AI did not run" and falls back to the deterministic score, which is
 * the same behaviour as NullMatchingAI. No sentinel is needed here because the
 * matching engine already has correct fallback semantics for null.
 */
export class MatchingAIRouter implements MatchingAI {
  private readonly flags: AIFeatureFlags;

  constructor(
    private readonly inner: MatchingAI,
    flags: Partial<AIFeatureFlags> = {}
  ) {
    this.flags = { ...DEFAULT_AI_FLAGS, ...flags };
  }

  async evaluate(
    profile: MatchingProfile,
    opportunity: OpportunityRow
  ): Promise<AIMatchResult | null> {
    if (!this.flags.enabled || !this.flags.matching) {
      return null;
    }

    try {
      return await this.inner.evaluate(profile, opportunity);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MatchingAIRouter] evaluate failed: ${msg}`);
      return null;
    }
  }
}
