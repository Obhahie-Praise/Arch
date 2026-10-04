/**
 * Final score calculator.
 *
 * Combines deterministic matching score (70%) with AI semantic score (30%),
 * then applies ranking adjustments for deadline urgency and freshness.
 *
 * Hard-ineligible opportunities receive a score of 0, regardless of AI score.
 */

import type { FinalScoreInput, FinalScore } from "./types";
import { SCORE_BLEND } from "./types";
import { isApproachingDeadline } from "../lib/dates";

const URGENCY_BONUS = 3;       // Points added if deadline is within 7 days
const FRESHNESS_BONUS = 2;     // Points added if discovered in last 48 hours

/**
 * Returns a deadline urgency score 0–100.
 * Higher = more urgent (approaching deadline).
 */
export function calcDeadlineUrgency(deadline?: string | null): number {
  if (!deadline) return 0;
  if (isApproachingDeadline(deadline, 3)) return 100;
  if (isApproachingDeadline(deadline, 7)) return 70;
  if (isApproachingDeadline(deadline, 14)) return 40;
  return 0;
}

/**
 * Returns a freshness score 0–100 based on when the opportunity was first seen.
 */
export function calcFreshness(firstSeenAt: string): number {
  const ageMs = Date.now() - new Date(firstSeenAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 2) return 100;
  if (ageDays < 7) return 70;
  if (ageDays < 14) return 40;
  if (ageDays < 30) return 20;
  return 0;
}

/**
 * Calculate the blended final match score.
 *
 * Formula:
 *   base = (deterministicScore * 0.70) + (aiScore * 0.30)
 *   base += deadline urgency bonus (if applicable)
 *   base += freshness bonus (if applicable)
 *   Hard-ineligible = 0
 *   Clamped to 0–100
 */
export function calculateFinalScore(input: FinalScoreInput): FinalScore {
  const { deterministicScore, aiScore, eligibilityStatus, deadlineUrgency, freshness } = input;

  // Hard ineligible — never recommend
  if (eligibilityStatus === -1) {
    return { score: 0, aiRan: aiScore !== null };
  }

  let base: number;
  const aiRan = aiScore !== null;

  if (aiRan && aiScore !== null) {
    base =
      deterministicScore * SCORE_BLEND.deterministic +
      aiScore * SCORE_BLEND.ai;
  } else {
    // AI did not run — full weight on deterministic
    base = deterministicScore;
  }

  // Ranking bonuses (small, can't flip relevance ranking)
  if (deadlineUrgency >= 70) base += URGENCY_BONUS;
  if (freshness >= 70) base += FRESHNESS_BONUS;

  // Eligibility confidence boost: known-eligible scores slightly above unknown
  if (eligibilityStatus === 1) base += 1;

  return {
    score: Math.max(0, Math.min(100, Math.round(base))),
    aiRan,
  };
}
