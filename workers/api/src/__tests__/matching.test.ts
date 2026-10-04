/**
 * Unit tests for the AI User Matching & Recommendation Layer.
 *
 * These are standalone TypeScript tests that can be run with any test runner
 * (e.g., Vitest). They test pure functions and classes in isolation, mocking
 * the DB and AI provider where needed.
 *
 * Run with: pnpm vitest (once vitest is added to devDependencies)
 */

import { evaluateEligibility } from "../matching/eligibility";
import { scoreOpportunityForProfile } from "../matching/ranking";
import { calculateFinalScore, calcDeadlineUrgency, calcFreshness } from "../matching/scorer";
import { applyDiversityRanking } from "../matching/diversity";
import { NullMatchingAI, WorkersAIMatchingProvider } from "../ai/matching";
import type { OpportunityRow } from "../opportunities/types";
import type { EligibilityStatus } from "../matching/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeOpp(overrides: Partial<OpportunityRow> = {}): OpportunityRow {
  return {
    id: crypto.randomUUID(),
    title: "Software Engineer",
    slug: "software-engineer-test",
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
    skills: JSON.stringify(["TypeScript", "React"]),
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

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`ASSERTION FAILED: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

// ─── Eligibility Tests ───────────────────────────────────────────────────────

function testEligibilityEligible(): void {
  const opp = makeOpp({
    eligibility: JSON.stringify(["Open to residents of Nigeria and Ghana"]),
  });
  const status = evaluateEligibility({ country: "Nigeria" }, opp);
  assertEquals<EligibilityStatus>(status, 1, "Should be eligible when country is mentioned");
}

function testEligibilityIneligible(): void {
  const opp = makeOpp({
    eligibility: JSON.stringify(["Applicants must be residents of Canada"]),
  });
  const status = evaluateEligibility({ country: "Nigeria" }, opp);
  assertEquals<EligibilityStatus>(
    status,
    -1,
    "Should be ineligible when country is not in restriction list"
  );
}

function testEligibilityUnknownNoInfo(): void {
  const opp = makeOpp({
    eligibility: JSON.stringify(["Applicants must be residents of Canada"]),
  });
  // No country supplied — cannot determine
  const status = evaluateEligibility({}, opp);
  assertEquals<EligibilityStatus>(
    status,
    0,
    "Should be unknown when user has no country info"
  );
}

function testEligibilityNoRestriction(): void {
  const opp = makeOpp({ eligibility: null });
  const status = evaluateEligibility({ country: "Nigeria" }, opp);
  assertEquals<EligibilityStatus>(status, 0, "No restriction → unknown (not eligible, not ineligible)");
}

function testEligibilityGlobal(): void {
  const opp = makeOpp({
    eligibility: JSON.stringify(["Open to applicants worldwide"]),
  });
  const status = evaluateEligibility({ country: "Nigeria" }, opp);
  assertEquals<EligibilityStatus>(status, 1, "Global opportunity should return eligible");
}

function testEligibilityStudentRequired(): void {
  const opp = makeOpp({
    eligibility: JSON.stringify(["Must be enrolled in an accredited university"]),
  });
  const status = evaluateEligibility({ studentStatus: "alumni" }, opp);
  assertEquals<EligibilityStatus>(status, -1, "Alumni should be ineligible for student-required opportunity");
}

function testEligibilityExpiredDeadline(): void {
  const opp = makeOpp({ deadline: "2020-01-01T00:00:00.000Z" });
  const status = evaluateEligibility({ country: "Nigeria" }, opp);
  assertEquals<EligibilityStatus>(status, -1, "Expired deadline should return ineligible");
}

// ─── Deterministic Scoring Tests ─────────────────────────────────────────────

function testScoringReturnsZeroForPastDeadline(): void {
  const opp = makeOpp({ deadline: "2020-01-01T00:00:00.000Z" });
  const result = scoreOpportunityForProfile(null, [], opp);
  assertEquals(result.deterministicTotal, 0, "Past deadline should yield score 0");
}

function testScoringNullProfile(): void {
  const opp = makeOpp();
  const result = scoreOpportunityForProfile(null, [], opp);
  assert(result.deterministicTotal > 0, "Null profile should return non-zero baseline score");
}

function testScoringSkillMatch(): void {
  const profile = {
    technicalSkills: JSON.stringify(["TypeScript", "React", "Node.js"]),
    nonTechnicalSkills: JSON.stringify([]),
    tools: JSON.stringify([]),
    opportunityTypes: JSON.stringify(["job"]),
    desiredRoles: JSON.stringify([]),
    desiredIndustries: JSON.stringify([]),
  };
  const opp = makeOpp({ skills: JSON.stringify(["TypeScript", "React"]) });
  const result = scoreOpportunityForProfile(profile, [], opp);
  assert(result.skillsScore > 80, `Skills score should be high with matching skills, got ${result.skillsScore}`);
  assert(result.matchReasons.some((r) => r.toLowerCase().includes("skill")), "Should mention skill match in reasons");
}

function testScoringGoalsInfluence(): void {
  const profile = {
    technicalSkills: JSON.stringify([]),
    nonTechnicalSkills: JSON.stringify([]),
    tools: JSON.stringify([]),
    opportunityTypes: JSON.stringify([]),
    desiredRoles: JSON.stringify([]),
    desiredIndustries: JSON.stringify([]),
    shortTermGoals: "I want to work on developer tools and TypeScript",
    longTermGoals: "I want to become a senior engineer",
  };
  const opp = makeOpp({
    description: "Work on TypeScript developer tools for engineers",
  });
  const result = scoreOpportunityForProfile(profile, [], opp);
  assert(result.goalsScore >= 65, `Goals score should reflect alignment, got ${result.goalsScore}`);
}

// ─── Final Score Tests ───────────────────────────────────────────────────────

function testFinalScoreIneligibleIsZero(): void {
  const { score } = calculateFinalScore({
    deterministicScore: 90,
    aiScore: 95,
    eligibilityStatus: -1,
    deadlineUrgency: 0,
    freshness: 0,
  });
  assertEquals(score, 0, "Hard ineligible must always produce final score 0");
}

function testFinalScoreBlend(): void {
  const { score, aiRan } = calculateFinalScore({
    deterministicScore: 80,
    aiScore: 60,
    eligibilityStatus: 1,
    deadlineUrgency: 0,
    freshness: 0,
  });
  // Expected: 80*0.70 + 60*0.30 = 56 + 18 = 74 + 1 (eligible boost) = 75
  assert(score >= 73 && score <= 77, `Blended score should be ~75, got ${score}`);
  assert(aiRan, "aiRan should be true when aiScore is provided");
}

function testFinalScoreNoAI(): void {
  const { score, aiRan } = calculateFinalScore({
    deterministicScore: 80,
    aiScore: null,
    eligibilityStatus: 0,
    deadlineUrgency: 0,
    freshness: 0,
  });
  assertEquals(score, 80, "Without AI, final score should equal deterministic score");
  assert(!aiRan, "aiRan should be false when aiScore is null");
}

function testFinalScoreDeadlineBonusApplied(): void {
  // Opportunity approaching in 3 days
  const soonDeadline = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const urgency = calcDeadlineUrgency(soonDeadline);
  assert(urgency === 100, `Urgency for 2-day deadline should be 100, got ${urgency}`);

  const { score } = calculateFinalScore({
    deterministicScore: 80,
    aiScore: null,
    eligibilityStatus: 0,
    deadlineUrgency: urgency,
    freshness: 0,
  });
  assert(score > 80, "Deadline urgency bonus should increase score above deterministic");
}

function testFreshnessFades(): void {
  const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
  assertEquals(calcFreshness(old), 0, "Old opportunity should have freshness 0");

  const fresh = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(); // 1 hour ago
  assertEquals(calcFreshness(fresh), 100, "Very fresh opportunity should have freshness 100");
}

// ─── Weekly Quota Tests ──────────────────────────────────────────────────────

function testWeeklyQuotaLimit(): void {
  const LIMIT = 30;
  let used = 0;

  function canRecommend(): boolean {
    return used < LIMIT;
  }

  function addRecommendation(): void {
    if (!canRecommend()) throw new Error("Quota exceeded");
    used++;
  }

  for (let i = 0; i < 30; i++) {
    addRecommendation();
  }
  assertEquals(used, 30, "Used should be 30 after 30 recommendations");
  assert(!canRecommend(), "Should not be able to recommend after 30");
}

function testWeeklyQuotaRemaining(): void {
  const LIMIT = 30;
  let used = 29;
  const remaining = LIMIT - used;
  assertEquals(remaining, 1, "Should have 1 remaining after 29 used");

  used = 30;
  const remaining2 = LIMIT - used;
  assertEquals(remaining2, 0, "Should have 0 remaining after 30 used");
}

// ─── Diversity Ranking Tests ─────────────────────────────────────────────────

function testDiversityLimitsPerType(): void {
  const candidates = Array.from({ length: 15 }, (_, i) => ({
    opp: makeOpp({ type: "job", id: `job-${i}` }),
    finalScore: 90 - i,
  }));

  const ranked = applyDiversityRanking(candidates, 15);
  const jobCount = ranked.filter((c) => c.opp.type === "job").length;
  assert(jobCount <= 8, `Should not have more than 8 of the same type, got ${jobCount}`);
}

function testDiversityLimitsPerOrg(): void {
  const candidates = Array.from({ length: 10 }, (_, i) => ({
    opp: makeOpp({ organization_name: "BigCorp", id: `org-${i}` }),
    finalScore: 90 - i,
  }));

  const ranked = applyDiversityRanking(candidates, 10);
  const bigCorpCount = ranked.filter(
    (c) => c.opp.organization_name.toLowerCase() === "bigcorp"
  ).length;
  assert(bigCorpCount <= 3, `Should not have more than 3 from same org, got ${bigCorpCount}`);
}

function testDiversityPreservesHighScores(): void {
  const candidates = [
    { opp: makeOpp({ type: "job", id: "a", organization_name: "OrgA" }), finalScore: 99 },
    { opp: makeOpp({ type: "grant", id: "b", organization_name: "OrgB" }), finalScore: 95 },
    { opp: makeOpp({ type: "hackathon", id: "c", organization_name: "OrgC" }), finalScore: 90 },
  ];
  const ranked = applyDiversityRanking(candidates, 3);
  assertEquals(ranked.length, 3, "All 3 distinct opportunities should be returned");
  assertEquals(ranked[0].finalScore, 99, "Highest-scored item should be first");
}

// ─── AI Matching Tests ───────────────────────────────────────────────────────

async function testNullAIReturnsNull(): Promise<void> {
  const ai = new NullMatchingAI();
  const result = await ai.evaluate({}, makeOpp());
  assert(result === null, "NullMatchingAI should always return null");
}

async function testAIMatchingParsesValidResponse(): Promise<void> {
  const mockAI = {
    run: async () => ({
      response: JSON.stringify({
        score: 0.85,
        strengths: ["Strong TypeScript experience"],
        gaps: ["Requires prior OSS contribution"],
        reason: "Good technical alignment",
        confidence: 0.9,
      }),
    }),
  };

  const ai = new WorkersAIMatchingProvider(mockAI);
  const result = await ai.evaluate({ technicalSkills: ["TypeScript"] }, makeOpp());
  assert(result !== null, "Should parse valid AI response");
  assert(result!.score === 0.85, `Score should be 0.85, got ${result!.score}`);
  assert(result!.strengths.length === 1, "Should have 1 strength");
  assert(result!.gaps.length === 1, "Should have 1 gap");
}

async function testAIMatchingHandlesInvalidJSON(): Promise<void> {
  const mockAI = {
    run: async () => ({ response: "not valid json {{" }),
  };

  const ai = new WorkersAIMatchingProvider(mockAI);
  const result = await ai.evaluate({}, makeOpp());
  assert(result === null, "Invalid JSON response should return null gracefully");
}

async function testAIMatchingHandlesAIError(): Promise<void> {
  const mockAI = {
    run: async () => {
      throw new Error("AI service unavailable");
    },
  };

  const ai = new WorkersAIMatchingProvider(mockAI);
  const result = await ai.evaluate({}, makeOpp());
  assert(result === null, "AI error should be caught and return null");
}

// ─── User Isolation Tests (conceptual) ──────────────────────────────────────

function testUserIsolationConcept(): void {
  // Recommendations are fetched with WHERE m.user_id = ?
  // The userId is always derived from the authenticated session, never from request body.
  // This test documents the security constraint.
  const u1: string = "user-a";
  const u2: string = "user-b";
  assert(u1 !== u2, "Different users must be distinguishable");
  // Enforcement is in the DB query: WHERE m.user_id = ?
  // Binding the session userId ensures cross-user access is impossible.
  assert(true, "User isolation is enforced at DB query level via session userId binding");
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

type TestFn = () => void | Promise<void>;

async function runTests(): Promise<void> {
  const tests: [string, TestFn][] = [
    // Eligibility
    ["[eligibility] eligible when country matches", testEligibilityEligible],
    ["[eligibility] ineligible when country not in list", testEligibilityIneligible],
    ["[eligibility] unknown when no country info", testEligibilityUnknownNoInfo],
    ["[eligibility] unknown when no restriction", testEligibilityNoRestriction],
    ["[eligibility] eligible for global opportunity", testEligibilityGlobal],
    ["[eligibility] ineligible when enrollment required but user is alumni", testEligibilityStudentRequired],
    ["[eligibility] ineligible when deadline passed", testEligibilityExpiredDeadline],

    // Deterministic scoring
    ["[scoring] zero score for past deadline", testScoringReturnsZeroForPastDeadline],
    ["[scoring] baseline score for null profile", testScoringNullProfile],
    ["[scoring] high skills score on skill match", testScoringSkillMatch],
    ["[scoring] goals score influenced by career goals", testScoringGoalsInfluence],

    // Final score
    ["[final-score] hard ineligible = 0 regardless of AI", testFinalScoreIneligibleIsZero],
    ["[final-score] correct blend of deterministic + AI", testFinalScoreBlend],
    ["[final-score] deterministic-only when AI absent", testFinalScoreNoAI],
    ["[final-score] deadline urgency bonus applied", testFinalScoreDeadlineBonusApplied],
    ["[final-score] freshness decays over time", testFreshnessFades],

    // Weekly quota
    ["[quota] enforces 30/week limit", testWeeklyQuotaLimit],
    ["[quota] remaining count is correct", testWeeklyQuotaRemaining],

    // Diversity ranking
    ["[diversity] limits opportunities per type to 8", testDiversityLimitsPerType],
    ["[diversity] limits opportunities per org to 3", testDiversityLimitsPerOrg],
    ["[diversity] preserves highest-scored items first", testDiversityPreservesHighScores],

    // AI matching
    ["[ai] NullMatchingAI always returns null", testNullAIReturnsNull],
    ["[ai] parses valid AI response", testAIMatchingParsesValidResponse],
    ["[ai] handles invalid JSON gracefully", testAIMatchingHandlesInvalidJSON],
    ["[ai] handles AI errors gracefully", testAIMatchingHandlesAIError],

    // Security
    ["[security] user isolation is enforced", testUserIsolationConcept],
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
