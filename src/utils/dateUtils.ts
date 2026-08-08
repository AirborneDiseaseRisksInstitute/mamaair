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

export const formatLocalIsoTimestamp = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absoluteOffset / 60));
  const offsetRemainderMinutes = pad(absoluteOffset % 60);

  return `${formatLocalDate(date)}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}${offsetSign}${offsetHours}:${offsetRemainderMinutes}`;
};
