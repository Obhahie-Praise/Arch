/**
 * Formats an ISO date string as a human-readable deadline date.
 * e.g. "2026-10-12T00:00:00.000Z" → "12th Oct, 2026"
 * Returns null if the input is null/undefined/invalid.
 */
export function formatDeadline(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  const day = d.getUTCDate();
  const suffix = ordinalSuffix(day);
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  const year = d.getUTCFullYear();

  return `${day}${suffix} ${month}, ${year}`;
}

function ordinalSuffix(n: number): string {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
