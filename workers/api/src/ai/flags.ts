/**
 * AI Feature Flags
 *
 * Controls which parts of the AI layer are active. Flags are evaluated at
 * call time so they can be changed without redeploying (e.g. passed in from
 * env vars, a KV flag store, or set directly in tests).
 *
 * Fail-closed semantics: when `enabled` is false the router returns the
 * AI-unavailable sentinel immediately without touching the underlying provider.
 * Individual flags (`extraction`, `matching`) gate each sub-feature
 * independently so one path can be disabled while the other stays live.
 */
export interface AIFeatureFlags {
  /** Master switch. When false, all AI calls return the unavailable sentinel. */
  readonly enabled: boolean;
  /** Allow AI extraction inside the discovery pipeline. */
  readonly extraction: boolean;
  /** Allow AI semantic matching in the recommendation engine. */
  readonly matching: boolean;
}

/**
 * Default flags: all AI features active.
 * Workers AI is the only provider and its current behaviour is preserved exactly.
 */
export const DEFAULT_AI_FLAGS: AIFeatureFlags = {
  enabled: true,
  extraction: true,
  matching: true,
};
