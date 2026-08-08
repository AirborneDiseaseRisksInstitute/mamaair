const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MAX_PREGNANCY_WEEK = 40;

const toUtcCalendarDay = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

const parseRecordedCalendarDay = (value: string): number | null => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;

  const parsed = Date.UTC(year, month - 1, day);
  const verified = new Date(parsed);
  if (
    verified.getUTCFullYear() !== year ||
    verified.getUTCMonth() !== month - 1 ||
    verified.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
};

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

  const recordedDay = parseRecordedCalendarDay(setDate);
  if (recordedDay === null) return storedWeek;

  // pregnancyWeekSetDate is a calendar date, not an exact timestamp. Compare
  // calendar days so UTC offsets and daylight-saving changes cannot advance a
  // freshly selected week early.
  const elapsedCalendarDays = toUtcCalendarDay(new Date()) - recordedDay;
  const weeksPassed = Math.max(
    0,
    Math.floor(elapsedCalendarDays / MS_PER_WEEK),
  );
  return Math.min(storedWeek + weeksPassed, MAX_PREGNANCY_WEEK);
}

/** Returns ordinal string: 1 → "1st", 2 → "2nd", 3 → "3rd", 4 → "4th", etc. */
export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
