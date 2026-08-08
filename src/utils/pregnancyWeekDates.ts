import { formatLocalDate } from './dateUtils';

function parseRecordedDate(value: string): Date {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Date(dateOnly ? `${value}T12:00:00` : value);
}

/**
 * Maps a pregnancy week to its surrounding calendar week (Monday–Sunday).
 *
 * pregnancyWeekSetDate is the date on which profileWeek was recorded, not
 * necessarily the first day of that pregnancy week.
 */
export function getPregnancyWeekDates(
  profileWeek: number | null | undefined,
  pregnancyWeekSetDate: string | null | undefined,
  targetWeek: number,
  referenceDate = new Date(),
): string[] {
  const recordedDate = pregnancyWeekSetDate
    ? parseRecordedDate(pregnancyWeekSetDate)
    : referenceDate;
  const safeRecordedDate = Number.isNaN(recordedDate.getTime())
    ? referenceDate
    : recordedDate;
  const anchorWeek = profileWeek ?? targetWeek;
  const targetDate = new Date(safeRecordedDate);

  targetDate.setDate(
    safeRecordedDate.getDate() + (targetWeek - anchorWeek) * 7,
  );

  const day = targetDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatLocalDate(date);
  });
}
