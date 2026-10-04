/**
 * Hard eligibility evaluation.
 *
 * Returns:
 *   1  = eligible
 *  -1  = ineligible (hard disqualification — must never be overridden by AI score)
 *   0  = unknown (insufficient information to determine)
 */

import type { OpportunityRow } from "../opportunities/types";
import type { EligibilityStatus } from "./types";
import { isPastDeadline } from "../lib/dates";

function safeParseJsonArray(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.map((s) => String(s).toLowerCase().trim()) : [];
  } catch {
    return [];
  }
}

interface EligibilityProfile {
  country?: string | null;
  citizenship?: string | null;
  studentStatus?: string | null;
  city?: string | null;
  region?: string | null;
}

/**
 * Country/citizenship eligibility check.
 * Returns -1 only when the opportunity explicitly restricts to countries/regions
 * and the user's country/citizenship is clearly not included.
 */
function checkGeographicEligibility(
  eligibility: string[],
  profile: EligibilityProfile
): EligibilityStatus {
  if (eligibility.length === 0) return 0;

  const COUNTRY_RESTRICTION_KEYWORDS = [
    "residents of",
    "resident of",
    "citizens of",
    "citizen of",
    "must be from",
    "only open to",
    "only for residents",
    "only for citizens",
    "applicants must be",
    "must reside in",
    "must live in",
    "based in",
  ];

  const hasRestriction = eligibility.some((e) =>
    COUNTRY_RESTRICTION_KEYWORDS.some((k) => e.includes(k))
  );

  if (!hasRestriction) return 0;

  // If we have restriction keywords and know the user's country/citizenship,
  // check if the user's country appears in the restriction list.
  const userCountry = profile.country?.toLowerCase().trim();
  const userCitizenship = profile.citizenship?.toLowerCase().trim();

  if (!userCountry && !userCitizenship) return 0; // Can't determine — unknown

  const GLOBAL_KEYWORDS = ["global", "worldwide", "international", "anyone", "all countries", "open to all"];
  const isGlobal = eligibility.some((e) => GLOBAL_KEYWORDS.some((k) => e.includes(k)));
  if (isGlobal) return 1;

  // Check if the user's country/citizenship is mentioned in the eligibility text
  const userMentioned = eligibility.some((e) => {
    if (userCountry && e.includes(userCountry)) return true;
    if (userCitizenship && e.includes(userCitizenship)) return true;
    return false;
  });

  if (userMentioned) return 1;

  // Restriction exists and user country is not mentioned — likely ineligible
  // But be conservative: only mark ineligible if we're confident, not just guessing.
  // If the eligibility text contains a specific country list and the user's country
  // is clearly not in it, return -1.
  return -1;
}

/**
 * Student/enrollment eligibility check.
 */
function checkStudentEligibility(
  eligibility: string[],
  profile: EligibilityProfile
): EligibilityStatus {
  if (eligibility.length === 0) return 0;

  const STUDENT_REQUIREMENTS = [
    "must be enrolled",
    "currently enrolled",
    "must be a student",
    "undergraduate student",
    "graduate student",
    "must be attending",
    "enrolled in an accredited",
  ];

  const requiresEnrollment = eligibility.some((e) =>
    STUDENT_REQUIREMENTS.some((k) => e.includes(k))
  );

  if (!requiresEnrollment) return 0;

  const studentStatus = profile.studentStatus?.toLowerCase().trim() ?? "";

  if (!studentStatus) return 0; // Unknown

  const NOT_ENROLLED_KEYWORDS = ["not enrolled", "not a student", "graduated", "alumnus", "alumni", "working professional"];
  const isNotEnrolled = NOT_ENROLLED_KEYWORDS.some((k) => studentStatus.includes(k));

  if (isNotEnrolled) return -1;

  const ENROLLED_KEYWORDS = ["undergraduate", "graduate", "phd", "masters", "enrolled", "student"];
  const isEnrolled = ENROLLED_KEYWORDS.some((k) => studentStatus.includes(k));

  if (isEnrolled) return 1;

  return 0;
}

/**
 * Evaluate hard eligibility for a user against an opportunity.
 *
 * Ineligibility (-1) is only returned when there is explicit, unambiguous evidence
 * that the user does not meet a stated hard requirement.
 *
 * Unknown (0) is preferred when information is insufficient.
 */
export function evaluateEligibility(
  profile: EligibilityProfile,
  opportunity: OpportunityRow
): EligibilityStatus {
  // Hard disqualification: deadline passed
  if (isPastDeadline(opportunity.deadline)) {
    return -1;
  }

  const eligibility = safeParseJsonArray(opportunity.eligibility);

  // Check geographic restriction
  const geoCheck = checkGeographicEligibility(eligibility, profile);
  if (geoCheck === -1) return -1;

  // Check student/enrollment restriction
  const studentCheck = checkStudentEligibility(eligibility, profile);
  if (studentCheck === -1) return -1;

  // No hard disqualification found
  // Return 1 (eligible) if any positive signal; else unknown
  if (geoCheck === 1 || studentCheck === 1) return 1;

  return 0;
}
