/**
 * Unit tests for the AI Provider Router (AIRouter, MatchingAIRouter).
 *
 * Verifies:
 * - Happy path: router forwards calls to the inner provider unchanged.
 * - Fail-closed: provider errors are caught and returned as the
 *   AiUnavailableResult sentinel (never re-thrown).
 * - Feature flags: disabled flags bypass the inner provider entirely.
 * - isAiUnavailable type guard: correct narrowing.
 * - MatchingAIRouter: returns null on flag-off or provider error.
 *
 * Run with: pnpm vitest (once vitest is added to devDependencies)
 *
 * All tests are standalone — they import only from the ai/ layer and use
 * the same hand-rolled assertion helpers as matching.test.ts.
 */

import { AIRouter, MatchingAIRouter, isAiUnavailable } from "../ai/router";
import { WorkersAIProvider, NullAIProvider } from "../ai/provider";
import { WorkersAIMatchingProvider, NullMatchingAI } from "../ai/matching";
import type { AIProvider } from "../ai/provider";
import type { MatchingAI, MatchingProfile } from "../ai/matching";
import type { AIExtractionOutput } from "../ai/schemas";
import type { AIMatchResult } from "../matching/types";
import type { OpportunityRow } from "../opportunities/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `ASSERTION FAILED: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`
    );
  }
}

/** A minimal valid extraction output that a well-behaved provider would return. */
function makeExtractionOutput(overrides: Partial<AIExtractionOutput> = {}): AIExtractionOutput {
  return {
    isOpportunity: true,
    title: "Software Engineer",
    organizationName: "TestCorp",
    description: "Build great things.",
    ...overrides,
  };
}

/** A minimal valid AI match result. */
function makeMatchResult(overrides: Partial<AIMatchResult> = {}): AIMatchResult {
  return {
    score: 0.8,
    strengths: ["Strong TypeScript experience"],
    gaps: [],
    reason: "Good technical fit.",
    confidence: 0.9,
    ...overrides,
  };
}

/** Minimal OpportunityRow for matching tests. */
function makeOpp(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  return {
    id: crypto.randomUUID(),
    title: "Software Engineer",
    slug: "software-engineer",
    organization_name: "TestCorp",
    organization_url: null,
    type: "job",
    description: "A great opportunity",
    application_url: "https://example.com/apply",
    source_url: "https://example.com",
    location: null,
    country: null,
    region: null,
    city: null,
    is_remote: 1,
    deadline: null,
    start_date: null,
    end_date: null,
    eligibility: null,
    requirements: null,
    skills: null,
    benefits: null,
    compensation: null,
    funding_amount: null,
    status: "active",
    first_seen_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
    expires_at: null,
    content_hash: "abc",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Stub AIProvider that resolves with a fixed extraction output.
 * Use `makeStubProvider(null)` to simulate an AI "not an opportunity" result.
 */
function makeStubProvider(result: AIExtractionOutput | null): AIProvider {
  return {
    extractOpportunity: async () => result,
    streamChat: async () => "stub chat response",
  };
}

/**
 * Stub AIProvider that throws on every extractOpportunity call.
 */
function makeThrowingProvider(message = "Workers AI exploded"): AIProvider {
  return {
    extractOpportunity: async () => {
      throw new Error(message);
    },
    streamChat: async () => {
      throw new Error(message);
    },
  };
}

/**
 * Stub MatchingAI that resolves with a fixed match result.
 */
function makeStubMatchingAI(result: AIMatchResult | null): MatchingAI {
  return {
    evaluate: async () => result,
  };
}

/**
 * Stub MatchingAI that throws on every evaluate call.
 */
function makeThrowingMatchingAI(): MatchingAI {
  return {
    evaluate: async () => {
      throw new Error("matching AI exploded");
    },
  };
}

// ─── isAiUnavailable type guard ──────────────────────────────────────────────

function testTypeGuardReturnsFalseForNull(): void {
  assert(!isAiUnavailable(null), "null should not be AI unavailable");
}

function testTypeGuardReturnsFalseForUndefined(): void {
  assert(!isAiUnavailable(undefined), "undefined should not be AI unavailable");
}

function testTypeGuardReturnsFalseForExtractOutput(): void {
  const output = makeExtractionOutput();
  assert(!isAiUnavailable(output), "AIExtractionOutput should not be AI unavailable");
}

function testTypeGuardReturnsTrueForSentinel(): void {
  const sentinel = { __aiUnavailable: true as const, reason: "test" };
  assert(isAiUnavailable(sentinel), "Sentinel with __aiUnavailable=true should be detected");
}

function testTypeGuardReturnsFalseForFakeFlag(): void {
  // Object with __aiUnavailable as a string rather than the exact boolean `true`
  const fake = { __aiUnavailable: "yes", reason: "sneaky" };
  // The branded property must be exactly the boolean `true` — a truthy string
  // value must NOT pass the guard, otherwise callers could accidentally produce
  // a sentinel without using the internal `unavailable()` constructor.
  assert(!isAiUnavailable(fake), "A truthy string for __aiUnavailable should NOT satisfy the type guard");
}

// ─── AIRouter: happy path ────────────────────────────────────────────────────

async function testRouterForwardsExtractionResult(): Promise<void> {
  const output = makeExtractionOutput();
  const router = new AIRouter(makeStubProvider(output));
  const result = await router.extractOpportunity("some page content");
  assert(!isAiUnavailable(result), "Should not return unavailable on success");
  assert(result !== null, "Should not return null on success");
  assertEquals(
    (result as AIExtractionOutput).title,
    "Software Engineer",
    "Should return the inner provider result unchanged"
  );
}

async function testRouterForwardsNullResult(): Promise<void> {
  // null means "not an opportunity" — the router must not convert this to a sentinel
  const router = new AIRouter(makeStubProvider(null));
  const result = await router.extractOpportunity("some page content");
  assertEquals(result, null, "null from provider should be forwarded as-is");
}

async function testRouterForwardsStreamChatResult(): Promise<void> {
  const stub: AIProvider = {
    extractOpportunity: async () => null,
    streamChat: async () => "hello from AI",
  };
  const router = new AIRouter(stub);
  const result = await router.streamChat([{ role: "user", content: "hi" }]);
  assertEquals(result as string, "hello from AI", "streamChat should forward provider result");
}

// ─── AIRouter: fail-closed ───────────────────────────────────────────────────

async function testRouterNeverThrowsOnProviderError(): Promise<void> {
  const router = new AIRouter(makeThrowingProvider("Workers AI CUDA OOM"));
  // Must resolve — must NOT reject
  let resolved = false;
  let rejected = false;
  await router.extractOpportunity("page").then(
    () => { resolved = true; },
    () => { rejected = true; }
  );
  assert(resolved, "Router should resolve rather than reject on provider error");
  assert(!rejected, "Router must not propagate provider errors as rejection");
}

async function testRouterReturnsUnavailableSentinelOnProviderError(): Promise<void> {
  const errorMsg = "timeout after 20000ms (extractOpportunity)";
  const router = new AIRouter(makeThrowingProvider(errorMsg));
  const result = await router.extractOpportunity("page");
  assert(isAiUnavailable(result), "Error from provider should produce AiUnavailableResult sentinel");
  assert(
    typeof (result as import("../ai/router").AiUnavailableResult).reason === "string",
    "Sentinel should carry a reason string"
  );
}

async function testRouterStreamChatFallsBackOnError(): Promise<void> {
  const router = new AIRouter(makeThrowingProvider());
  const result = await router.streamChat([]);
  assert(
    typeof result === "string" && result.length > 0,
    "streamChat should return a fallback string on provider error"
  );
}

// ─── AIRouter: feature flags ─────────────────────────────────────────────────

async function testRouterDisabledByMasterFlag(): Promise<void> {
  // enabled: false should bypass the inner provider entirely
  const router = new AIRouter(makeThrowingProvider("should not be called"), {
    enabled: false,
  });
  const result = await router.extractOpportunity("page");
  assert(isAiUnavailable(result), "Disabled master flag should return unavailable sentinel");
}

async function testRouterDisabledByExtractionFlag(): Promise<void> {
  const router = new AIRouter(makeThrowingProvider("should not be called"), {
    enabled: true,
    extraction: false,
  });
  const result = await router.extractOpportunity("page");
  assert(isAiUnavailable(result), "Disabled extraction flag should return unavailable sentinel");
}

async function testRouterEnabledFlagPassesThroughNormally(): Promise<void> {
  const output = makeExtractionOutput({ title: "Grant Writer" });
  const router = new AIRouter(makeStubProvider(output), { enabled: true, extraction: true });
  const result = await router.extractOpportunity("page");
  assert(!isAiUnavailable(result) && result !== null, "Enabled flags should forward to inner provider");
  assertEquals((result as AIExtractionOutput).title, "Grant Writer", "Should return provider result");
}

async function testRouterStreamChatDisabledByMasterFlag(): Promise<void> {
  const router = new AIRouter(makeThrowingProvider("should not be called"), {
    enabled: false,
  });
  const result = await router.streamChat([]);
  assert(
    typeof result === "string" && result.includes("unavailable"),
    "Disabled master flag should return unavailable string for chat"
  );
}

// ─── MatchingAIRouter: happy path ────────────────────────────────────────────

async function testMatchingRouterForwardsResult(): Promise<void> {
  const match = makeMatchResult();
  const router = new MatchingAIRouter(makeStubMatchingAI(match));
  const result = await router.evaluate({} as MatchingProfile, makeOpp());
  assert(result !== null, "Should return result from inner provider");
  assertEquals(result!.score, 0.8, "Should forward score unchanged");
}

async function testMatchingRouterForwardsNull(): Promise<void> {
  // null means AI didn't run or no useful result
  const router = new MatchingAIRouter(makeStubMatchingAI(null));
  const result = await router.evaluate({} as MatchingProfile, makeOpp());
  assertEquals(result, null, "null from provider should be forwarded as-is");
}

// ─── MatchingAIRouter: fail-closed ───────────────────────────────────────────

async function testMatchingRouterNeverThrowsOnProviderError(): Promise<void> {
  const router = new MatchingAIRouter(makeThrowingMatchingAI());
  let resolved = false;
  let rejected = false;
  await router.evaluate({} as MatchingProfile, makeOpp()).then(
    () => { resolved = true; },
    () => { rejected = true; }
  );
  assert(resolved, "MatchingAIRouter should resolve on provider error");
  assert(!rejected, "MatchingAIRouter must not propagate provider errors");
}

async function testMatchingRouterReturnsNullOnProviderError(): Promise<void> {
  const router = new MatchingAIRouter(makeThrowingMatchingAI());
  const result = await router.evaluate({} as MatchingProfile, makeOpp());
  assertEquals(result, null, "Provider error should produce null (deterministic fallback)");
}

// ─── MatchingAIRouter: feature flags ─────────────────────────────────────────

async function testMatchingRouterDisabledByMasterFlag(): Promise<void> {
  const router = new MatchingAIRouter(makeThrowingMatchingAI(), { enabled: false });
  const result = await router.evaluate({} as MatchingProfile, makeOpp());
  assertEquals(result, null, "Disabled master flag should return null without calling provider");
}

async function testMatchingRouterDisabledByMatchingFlag(): Promise<void> {
  const router = new MatchingAIRouter(makeThrowingMatchingAI(), {
    enabled: true,
    matching: false,
  });
  const result = await router.evaluate({} as MatchingProfile, makeOpp());
  assertEquals(result, null, "Disabled matching flag should return null");
}

// ─── Integration: createAIProvider returns router-wrapped instance ────────────

async function testCreateAIProviderWithNullBindingReturnsRouterWrapped(): Promise<void> {
  const { createAIProvider } = await import("../ai/provider");
  const provider = createAIProvider(null);
  // With null binding the inner provider is NullAIProvider which returns null —
  // not a sentinel. The router wraps NullAIProvider; because NullAIProvider never
  // throws, the result should be null (not unavailable).
  const result = await provider.extractOpportunity("page content");
  assertEquals(result, null, "NullAIProvider wrapped in router should return null");
}

async function testCreateAIProviderWithFlagDisabledReturnsSentinel(): Promise<void> {
  const { createAIProvider } = await import("../ai/provider");
  // Pass a fake binding object so WorkersAIProvider is selected, but disable the flag
  const provider = createAIProvider({ run: async () => { throw new Error("never called"); } }, {
    enabled: false,
  });
  const result = await provider.extractOpportunity("page content");
  assert(isAiUnavailable(result), "Disabled flag via createAIProvider should produce unavailable sentinel");
}

async function testCreateMatchingAIWithFlagDisabledReturnsNull(): Promise<void> {
  const { createMatchingAI } = await import("../ai/matching");
  const matchingAI = createMatchingAI(
    { run: async () => { throw new Error("never called"); } },
    { enabled: false }
  );
  const result = await matchingAI.evaluate({} as MatchingProfile, makeOpp());
  assertEquals(result, null, "Disabled flag via createMatchingAI should return null");
}

// ─── NullAIProvider / NullMatchingAI unaffected by router change ─────────────

async function testNullProviderBehaviourUnchanged(): Promise<void> {
  // NullAIProvider is still directly instantiable — behaviour must not change
  const provider = new NullAIProvider();
  const result = await provider.extractOpportunity("page");
  assertEquals(result, null, "NullAIProvider should still return null directly");
}

async function testNullMatchingAIBehaviourUnchanged(): Promise<void> {
  const ai = new NullMatchingAI();
  const result = await ai.evaluate({} as MatchingProfile, makeOpp());
  assertEquals(result, null, "NullMatchingAI should still return null directly");
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

type TestFn = () => void | Promise<void>;

async function runTests(): Promise<void> {
  const tests: [string, TestFn][] = [
    // Type guard
    ["[guard] false for null", testTypeGuardReturnsFalseForNull],
    ["[guard] false for undefined", testTypeGuardReturnsFalseForUndefined],
    ["[guard] false for extraction output", testTypeGuardReturnsFalseForExtractOutput],
    ["[guard] true for branded sentinel", testTypeGuardReturnsTrueForSentinel],
    ["[guard] true for truthy __aiUnavailable", testTypeGuardReturnsFalseForFakeFlag],

    // AIRouter happy path
    ["[router] forwards extraction result unchanged", testRouterForwardsExtractionResult],
    ["[router] forwards null result unchanged", testRouterForwardsNullResult],
    ["[router] forwards streamChat result unchanged", testRouterForwardsStreamChatResult],

    // AIRouter fail-closed
    ["[router] never throws on provider error", testRouterNeverThrowsOnProviderError],
    ["[router] returns unavailable sentinel on provider error", testRouterReturnsUnavailableSentinelOnProviderError],
    ["[router] streamChat returns fallback string on error", testRouterStreamChatFallsBackOnError],

    // AIRouter feature flags
    ["[router:flags] master flag disabled → sentinel", testRouterDisabledByMasterFlag],
    ["[router:flags] extraction flag disabled → sentinel", testRouterDisabledByExtractionFlag],
    ["[router:flags] enabled flags pass through normally", testRouterEnabledFlagPassesThroughNormally],
    ["[router:flags] chat disabled by master flag", testRouterStreamChatDisabledByMasterFlag],

    // MatchingAIRouter happy path
    ["[matching-router] forwards match result", testMatchingRouterForwardsResult],
    ["[matching-router] forwards null result", testMatchingRouterForwardsNull],

    // MatchingAIRouter fail-closed
    ["[matching-router] never throws on provider error", testMatchingRouterNeverThrowsOnProviderError],
    ["[matching-router] returns null on provider error", testMatchingRouterReturnsNullOnProviderError],

    // MatchingAIRouter feature flags
    ["[matching-router:flags] master flag disabled → null", testMatchingRouterDisabledByMasterFlag],
    ["[matching-router:flags] matching flag disabled → null", testMatchingRouterDisabledByMatchingFlag],

    // Factory integration
    ["[factory] null binding returns router-wrapped null", testCreateAIProviderWithNullBindingReturnsRouterWrapped],
    ["[factory] disabled flag via createAIProvider → sentinel", testCreateAIProviderWithFlagDisabledReturnsSentinel],
    ["[factory] disabled flag via createMatchingAI → null", testCreateMatchingAIWithFlagDisabledReturnsNull],

    // Regression: concrete providers unaffected
    ["[regression] NullAIProvider still returns null directly", testNullProviderBehaviourUnchanged],
    ["[regression] NullMatchingAI still returns null directly", testNullMatchingAIBehaviourUnchanged],
  ];

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
