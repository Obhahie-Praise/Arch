/**
 * Date helper utilities for Opportunity Engine
 */

export function getNowIso(): string {
  return new Date().toISOString();
}

/**
 * Returns ISO date string (YYYY-MM-DD) for the Monday of the current ISO week.
 */
export function getIsoWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust when day is Sunday (0 -> 7)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

/**
 * Checks if a given ISO deadline string has passed.
 */
export function isPastDeadline(deadline?: string | null): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return false;
  return deadlineDate.getTime() < Date.now();
}

/**
 * Checks if a deadline is approaching (e.g. within 7 days).
 */
export function isApproachingDeadline(deadline?: string | null, days: number = 7): boolean {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return false;
  const now = Date.now();
  const diffMs = deadlineDate.getTime() - now;
  return diffMs > 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}
