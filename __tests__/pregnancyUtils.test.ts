import { getCurrentPregnancyWeek } from '../src/utils/pregnancyUtils';

describe('getCurrentPregnancyWeek', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps a week selected today unchanged', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 1, 23, 59));

    expect(getCurrentPregnancyWeek(1, '2026-08-01')).toBe(1);
  });

  it('advances only after seven calendar days', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 7, 7, 23, 59));
    expect(getCurrentPregnancyWeek(1, '2026-08-01')).toBe(1);

    jest.setSystemTime(new Date(2026, 7, 8, 0, 0));
    expect(getCurrentPregnancyWeek(1, '2026-08-01')).toBe(2);
  });
});
