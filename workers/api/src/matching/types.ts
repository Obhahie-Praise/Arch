export const MATCH_WEIGHTS = {
  eligibility: 0.30,
  skills: 0.20,
  interest: 0.15,
  goals: 0.15,
  experience: 0.10,
  location: 0.05,
  preference: 0.05,
} as const;

/**
 * Weight split between deterministic and AI semantic scoring.
 * Deterministic: 70%, AI: 30%
 */
export const SCORE_BLEND = {
  deterministic: 0.70,
  ai: 0.30,
} as const;

/**
 * Maximum candidates passed to AI to control cost.
 * After deterministic filtering, at most this many are AI-evaluated.
 */
export const AI_CANDIDATE_LIMIT = 50;

/**
 * There is no per-user opportunity quota.
 * Users see every opportunity the matching engine determines is relevant to them.
 *
 * @deprecated This constant is no longer used. Kept as a tombstone to prevent
 * accidental re-introduction of an arbitrary limit.
 */
// export const WEEKLY_QUOTA = 30;

/**
 * Eligibility status: deterministic hard-check outcome.
 *  1  = eligible
 * -1  = ineligible
 *  0  = unknown (insufficient information)
 */
export type EligibilityStatus = 1 | -1 | 0;

export interface ScoreBreakdown {
  eligibilityScore: number;
  skillsScore: number;
  interestScore: number;
  goalsScore: number;
  experienceScore: number;
  locationScore: number;
  preferenceScore: number;
  deterministicTotal: number;
  matchReasons: string[];
  potentialMismatches: string[];
}

export interface AIMatchResult {
  score: number;        // 0–1
  strengths: string[];
  gaps: string[];
  reason: string;
  confidence: number;   // 0–1
}

export interface FinalScoreInput {
  deterministicScore: number;   // 0–100
  aiScore: number | null;       // 0–100, null if AI did not run
  eligibilityStatus: EligibilityStatus;
  deadlineUrgency: number;      // 0–100, higher = more urgent
  freshness: number;            // 0–100, higher = more recently discovered
}

export interface FinalScore {
  score: number;    // 0–100, final blended+adjusted
  aiRan: boolean;
}
