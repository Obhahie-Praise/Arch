export const MATCH_WEIGHTS = {
  eligibility: 0.30,
  skills: 0.20,
  interest: 0.15,
  goals: 0.15,
  experience: 0.10,
  location: 0.05,
  preference: 0.05,
} as const;

export interface ScoreBreakdown {
  eligibilityScore: number;
  skillsScore: number;
  interestScore: number;
  experienceScore: number;
  locationScore: number;
  preferenceScore: number;
  totalScore: number;
  matchReasons: string[];
  potentialMismatches: string[];
}
