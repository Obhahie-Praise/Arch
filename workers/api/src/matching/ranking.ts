import type { OpportunityRow } from "../opportunities/types";
import { MATCH_WEIGHTS, type ScoreBreakdown } from "./types";
import { isPastDeadline } from "../lib/dates";

function safeParseJsonArray(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Deterministic opportunity scoring against a user profile.
 * Scores range 0–100 per dimension, then weighted into a total.
 *
 * Dimensions (weights from MATCH_WEIGHTS):
 *   eligibility  30%
 *   skills       20%
 *   interest     15%
 *   goals        15%
 *   experience   10%
 *   location      5%
 *   preference    5%
 */
export function scoreOpportunityForProfile(
  profile: Record<string, unknown> | null,
  experiences: Record<string, unknown>[],
  opportunity: OpportunityRow
): ScoreBreakdown {
  const matchReasons: string[] = [];
  const potentialMismatches: string[] = [];

  // Hard disqualification: deadline passed
  if (isPastDeadline(opportunity.deadline)) {
    potentialMismatches.push("Deadline has passed");
    return {
      eligibilityScore: 0,
      skillsScore: 0,
      interestScore: 0,
      goalsScore: 0,
      experienceScore: 0,
      locationScore: 0,
      preferenceScore: 0,
      deterministicTotal: 0,
      matchReasons: [],
      potentialMismatches,
    };
  }

  if (!profile) {
    return {
      eligibilityScore: 70,
      skillsScore: 60,
      interestScore: 60,
      goalsScore: 60,
      experienceScore: 50,
      locationScore: 80,
      preferenceScore: 70,
      deterministicTotal: 65,
      matchReasons: ["Matches general opportunity pool"],
      potentialMismatches: ["Complete your profile for personalized AI scoring"],
    };
  }

  // Parse profile fields
  const techSkills = safeParseJsonArray(profile.technicalSkills as string);
  const nonTechSkills = safeParseJsonArray(profile.nonTechnicalSkills as string);
  const tools = safeParseJsonArray(profile.tools as string);
  const userSkillsSet = new Set(
    [...techSkills, ...nonTechSkills, ...tools].map((s) => s.toLowerCase().trim())
  );

  const desiredTypes = safeParseJsonArray(profile.opportunityTypes as string).map((t) =>
    t.toLowerCase().trim()
  );
  const desiredRoles = safeParseJsonArray(profile.desiredRoles as string).map((r) =>
    r.toLowerCase().trim()
  );
  const desiredIndustries = safeParseJsonArray(profile.desiredIndustries as string).map((i) =>
    i.toLowerCase().trim()
  );

  // Parse opportunity fields
  const oppSkills = safeParseJsonArray(opportunity.skills).map((s) => s.toLowerCase().trim());
  const oppEligibility = safeParseJsonArray(opportunity.eligibility).map((e) =>
    e.toLowerCase().trim()
  );

  const oppTitleLower = opportunity.title.toLowerCase();
  const oppOrgLower = opportunity.organization_name.toLowerCase();
  const oppDescLower = (opportunity.description ?? "").toLowerCase();
  const oppFullText = `${oppTitleLower} ${oppOrgLower} ${oppDescLower}`;

  // 1. Eligibility Score (30%)
  let eligibilityScore = 85;
  if (oppEligibility.length > 0) {
    let metCount = 0;
    for (const el of oppEligibility) {
      const isMet =
        (profile.citizenship && el.includes((profile.citizenship as string).toLowerCase())) ||
        (profile.country && el.includes((profile.country as string).toLowerCase())) ||
        (profile.studentStatus && el.includes((profile.studentStatus as string).toLowerCase())) ||
        el.includes("open") ||
        el.includes("global") ||
        el.includes("anyone") ||
        el.includes("experience");
      if (isMet) metCount++;
    }
    eligibilityScore = Math.max(
      50,
      Math.min(100, Math.round((metCount / oppEligibility.length) * 100))
    );
    if (eligibilityScore >= 80) {
      matchReasons.push("Meets key eligibility requirements");
    }
  } else {
    matchReasons.push("Open eligibility criteria");
  }

  // 2. Skills Score (20%)
  let skillsScore = 60;
  if (oppSkills.length > 0) {
    let matchedCount = 0;
    const matchedNames: string[] = [];
    for (const s of oppSkills) {
      if (
        userSkillsSet.has(s) ||
        Array.from(userSkillsSet).some((us) => us.includes(s) || s.includes(us))
      ) {
        matchedCount++;
        matchedNames.push(s);
      }
    }
    skillsScore = Math.max(
      40,
      Math.min(100, Math.round((matchedCount / Math.max(1, oppSkills.length)) * 100) + 30)
    );
    if (matchedNames.length > 0) {
      matchReasons.push(`Skill match: ${matchedNames.slice(0, 3).join(", ")}`);
    } else {
      potentialMismatches.push("Requires skills not explicitly listed on profile");
    }
  } else {
    skillsScore = 75;
  }

  // 3. Interest Score (15%)
  let interestScore = 70;
  if (desiredTypes.length > 0 && desiredTypes.includes(opportunity.type.toLowerCase())) {
    interestScore += 20;
    matchReasons.push(`Matches desired opportunity type (${opportunity.type})`);
  }
  if (desiredRoles.some((r) => oppTitleLower.includes(r))) {
    interestScore += 15;
    matchReasons.push("Aligns with your desired role");
  }
  if (desiredIndustries.some((ind) => oppOrgLower.includes(ind) || oppTitleLower.includes(ind))) {
    interestScore += 10;
    matchReasons.push("Matches a desired industry");
  }
  interestScore = Math.min(100, interestScore);

  // 4. Goals Score (15%)
  let goalsScore = 65;
  const shortGoals = ((profile.shortTermGoals as string) ?? "").toLowerCase();
  const longGoals = ((profile.longTermGoals as string) ?? "").toLowerCase();
  const careerGoals = `${shortGoals} ${longGoals}`.trim();

  if (careerGoals.length > 10) {
    // Check if opportunity type or description text aligns with stated goals
    const goalKeywords = careerGoals
      .split(/[\s,.\-]+/)
      .filter((w) => w.length > 4)
      .slice(0, 20);
    const goalMatches = goalKeywords.filter((kw) => oppFullText.includes(kw));
    if (goalMatches.length >= 2) {
      goalsScore = Math.min(100, 65 + goalMatches.length * 5);
      matchReasons.push("Aligns with your stated career goals");
    } else if (goalMatches.length === 1) {
      goalsScore = 75;
    }
  }

  // 5. Experience Score (10%)
  let experienceScore = 70;
  if (experiences.length > 0) {
    experienceScore = Math.min(100, 60 + experiences.length * 10);
    matchReasons.push(
      `${experiences.length} experience entr${experiences.length === 1 ? "y" : "ies"} on your profile`
    );
  }

  // 6. Location Score (5%)
  let locationScore = 80;
  if (opportunity.is_remote === 1) {
    locationScore = 100;
    matchReasons.push("Remote — work from anywhere");
  } else if (
    profile.city &&
    opportunity.location &&
    opportunity.location.toLowerCase().includes((profile.city as string).toLowerCase())
  ) {
    locationScore = 100;
    matchReasons.push(`Located near ${profile.city}`);
  } else if (
    profile.country &&
    opportunity.country &&
    opportunity.country.toLowerCase() === (profile.country as string).toLowerCase()
  ) {
    locationScore = 90;
    matchReasons.push(`Located in ${profile.country}`);
  } else if (opportunity.location || opportunity.country) {
    locationScore = 60;
    potentialMismatches.push("Location may require on-site presence or relocation");
  }

  // 7. Preference Score (5%)
  const preferenceScore = 75;

  // Weighted deterministic total (0–100)
  const deterministicTotal = Math.round(
    eligibilityScore * MATCH_WEIGHTS.eligibility +
      skillsScore * MATCH_WEIGHTS.skills +
      interestScore * MATCH_WEIGHTS.interest +
      goalsScore * MATCH_WEIGHTS.goals +
      experienceScore * MATCH_WEIGHTS.experience +
      locationScore * MATCH_WEIGHTS.location +
      preferenceScore * MATCH_WEIGHTS.preference
  );

  return {
    eligibilityScore,
    skillsScore,
    interestScore,
    goalsScore,
    experienceScore,
    locationScore,
    preferenceScore,
    deterministicTotal,
    matchReasons: Array.from(new Set(matchReasons)),
    potentialMismatches: Array.from(new Set(potentialMismatches)),
  };
}
