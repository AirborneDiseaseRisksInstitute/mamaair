import { getPregnancyWeekDates } from '../src/utils/pregnancyWeekDates';

describe('getPregnancyWeekDates', () => {
  const thursday = new Date('2026-07-30T12:00:00');

  it('moves unanchored pregnancy weeks instead of repeating the current dates', () => {
    expect(getPregnancyWeekDates(1, null, 1, thursday)).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]);
    expect(getPregnancyWeekDates(1, null, 2, thursday)).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ]);
  });

  it('treats the recorded date as an anchor day and keeps Monday–Sunday rows', () => {
    expect(
      getPregnancyWeekDates(11, '2026-07-30', 10, thursday),
    ).toEqual([
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25',
      '2026-07-26',
    ]);
  });
});
