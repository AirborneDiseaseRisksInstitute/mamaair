/**
 * Formats a Date as a `YYYY-MM-DD` string using the device's LOCAL calendar day.
 *
 * Use this instead of `date.toISOString().split('T')[0]`: `toISOString()` converts
 * to UTC first, so for users east of UTC (e.g. Kenya UTC+3, Nigeria UTC+1) a local
 * date near midnight — or a date picked at local midnight — rolls back to the
 * previous day. This keeps the date on the user's actual calendar day.
 */
export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (
  value: string | null | undefined,
): Date | null => {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const formatLocalIsoTimestamp = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absoluteOffset / 60));
  const offsetRemainderMinutes = pad(absoluteOffset % 60);

  return `${formatLocalDate(date)}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(
    date.getSeconds(),
  )}${offsetSign}${offsetHours}:${offsetRemainderMinutes}`;
};
