const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MAX_PREGNANCY_WEEK = 40;

/**
 * Returns the current pregnancy week, advancing automatically based on
 * how many weeks have passed since the week was originally recorded.
 */
export function getCurrentPregnancyWeek(
  storedWeek: number | null,
  setDate: string | null,
): number | null {
  if (!storedWeek) return null;
  if (!setDate) return storedWeek;

  const weeksPassed = Math.floor(
    (Date.now() - new Date(setDate).getTime()) / MS_PER_WEEK,
  );
  return Math.min(storedWeek + weeksPassed, MAX_PREGNANCY_WEEK);
}

/** Returns ordinal string: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", etc. */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
