export const MIN_DAILY_HOURS = 1;
export const MAX_SLEEP_HOURS = 16;
export const MAX_ACTIVE_HOURS = 8;

export const DEFAULT_SLEEP_HOURS = 8;
export const DEFAULT_ACTIVE_HOURS = 2;

export const clampDailyHours = (value: number, max: number): number => {
  if (!Number.isFinite(value)) return MIN_DAILY_HOURS;
  return Math.min(max, Math.max(MIN_DAILY_HOURS, value));
};
