import {
  clampDailyHours,
  MAX_ACTIVE_HOURS,
  MAX_SLEEP_HOURS,
  MIN_DAILY_HOURS,
} from '../src/utils/lifestyleHours';

describe('lifestyle hour limits', () => {
  it('caps legacy sleep and activity values at their new maximums', () => {
    expect(clampDailyHours(24, MAX_SLEEP_HOURS)).toBe(16);
    expect(clampDailyHours(24, MAX_ACTIVE_HOURS)).toBe(8);
  });

  it('keeps values inside the allowed range unchanged', () => {
    expect(clampDailyHours(7.5, MAX_SLEEP_HOURS)).toBe(7.5);
    expect(clampDailyHours(3, MAX_ACTIVE_HOURS)).toBe(3);
  });

  it('prevents values below the slider minimum', () => {
    expect(clampDailyHours(0, MAX_SLEEP_HOURS)).toBe(MIN_DAILY_HOURS);
  });
});
