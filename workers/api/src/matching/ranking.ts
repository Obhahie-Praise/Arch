import type { OpportunityRow } from "../opportunities/types";
import { MATCH_WEIGHTS, type ScoreBreakdown } from "./types";
import { isPastDeadline } from "../lib/dates";

function safeParseJsonArray(jsonStr: string | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
      experienceScore: 0,
      locationScore: 0,
      preferenceScore: 0,
      totalScore: 0,
      matchReasons: [],
      potentialMismatches,
    };
  }

  if (!profile) {
    // Basic baseline matching for anonymous or incomplete profile
    return {
      eligibilityScore: 70,
      skillsScore: 60,
      interestScore: 60,
      experienceScore: 50,
      locationScore: 80,
      preferenceScore: 70,
      totalScore: 65,
      matchReasons: ["Matches general opportunity pool"],
      potentialMismatches: ["Complete your profile for hyper-personalized AI scoring"],
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
  const oppReqs = safeParseJsonArray(opportunity.requirements).map((r) => r.toLowerCase().trim());
  const oppEligibility = safeParseJsonArray(opportunity.eligibility).map((e) =>
    e.toLowerCase().trim()
  );

  // 1. Eligibility Score (Weight 30%)
  let eligibilityScore = 85; // Default assumption if no strict criteria
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
    eligibilityScore = Math.max(50, Math.min(100, Math.round((metCount / oppEligibility.length) * 100)));
    if (eligibilityScore >= 80) {
      matchReasons.push("Meets key eligibility requirements");
    }
  } else {
    matchReasons.push("Open eligibility criteria");
  }

  // 2. Skills Score (Weight 20%)
  let skillsScore = 60;
  if (oppSkills.length > 0) {
    let matchedSkillsCount = 0;
    const matchedSkillNames: string[] = [];
    for (const s of oppSkills) {
      if (userSkillsSet.has(s) || Array.from(userSkillsSet).some((us) => us.includes(s) || s.includes(us))) {
        matchedSkillsCount++;
        matchedSkillNames.push(s);
      }
    }
    skillsScore = Math.max(40, Math.min(100, Math.round((matchedSkillsCount / Math.max(1, oppSkills.length)) * 100) + 30));
    if (matchedSkillNames.length > 0) {
      matchReasons.push(`Skill match on: ${matchedSkillNames.slice(0, 3).join(", ")}`);
    } else {
      potentialMismatches.push("Requires skills not explicitly listed on profile");
    }
  } else {
    skillsScore = 75;
  }

  // 3. Interest Score (Weight 15%)
  let interestScore = 70;
  const oppTypeNorm = opportunity.type.toLowerCase();
  const titleNorm = opportunity.title.toLowerCase();
  const orgNorm = opportunity.organization_name.toLowerCase();

  if (desiredTypes.length > 0 && desiredTypes.includes(oppTypeNorm)) {
    interestScore += 20;
    matchReasons.push(`Matches desired opportunity type (${opportunity.type})`);
  }

  if (desiredRoles.some((r) => titleNorm.includes(r))) {
    interestScore += 15;
    matchReasons.push("Matches your desired role target");
  }

  if (desiredIndustries.some((ind) => orgNorm.includes(ind) || titleNorm.includes(ind))) {
    interestScore += 10;
  }
  interestScore = Math.min(100, interestScore);

  // 4. Experience Score (Weight 10%)
  let experienceScore = 70;
  if (experiences.length > 0) {
    experienceScore = Math.min(100, 60 + experiences.length * 10);
    matchReasons.push(`Relevant background with ${experiences.length} listed experience entries`);
  }

  // 5. Location Score (Weight 5%)
  let locationScore = 80;
  if (opportunity.is_remote === 1) {
    locationScore = 100;
    matchReasons.push("Remote opportunity — work from anywhere");
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
  } else {
    locationScore = 60;
    potentialMismatches.push("Location may require relocation or on-site presence");
  }

  // 6. Preference Score (Weight 5%)
  const preferenceScore = 75;

  // Calculate weighted total score
  const totalScore = Math.round(
    eligibilityScore * MATCH_WEIGHTS.eligibility +
      skillsScore * MATCH_WEIGHTS.skills +
      interestScore * MATCH_WEIGHTS.interest +
      experienceScore * MATCH_WEIGHTS.experience +
      locationScore * MATCH_WEIGHTS.location +
      preferenceScore * MATCH_WEIGHTS.preference
  );

  return {
    eligibilityScore,
    skillsScore,
    interestScore,
    experienceScore,
    locationScore,
    preferenceScore,
    totalScore,
    matchReasons: Array.from(new Set(matchReasons)),
    potentialMismatches: Array.from(new Set(potentialMismatches)),
  };
}
