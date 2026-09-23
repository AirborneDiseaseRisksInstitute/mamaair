import {
  selectPresentationDay,
  selectPresentationExposureHistory,
  selectPresentationWeek,
  selectPresentationWeekSummary,
  toPresentationDayRecord,
} from '../../src/services/recommendationExperience/PresentationDataProvider';
import compactTrajectory from '../../src/data/mamaairReferenceTrajectory.json';

describe('reference trajectory provider', () => {
  it('ships only the compact week and day values used by the app', () => {
    const serialized = JSON.stringify(compactTrajectory);
    const weeks = compactTrajectory as unknown as Array<
      [number, unknown, unknown[]]
    >;

    expect(weeks).toHaveLength(40);
    expect(weeks.every(week => week[2].length === 7)).toBe(true);
    expect(serialized).not.toMatch(
      /sourceTrackId|sourceDataset|sourcePersonaArchetype|containsExactGps/i,
    );
  });

  it.each([1, 11, 19, 28, 40])(
    'selects the requested gestational week %i',
    pregnancyWeek => {
      const day = selectPresentationDay(pregnancyWeek, '2026-07-27');
      const summary = selectPresentationWeekSummary(pregnancyWeek);

      expect(day.pregnancyWeek).toBe(pregnancyWeek);
      expect(summary.pregnancyWeek).toBe(pregnancyWeek);
      expect(day.nutrition.waterGoalMl).toBe(1500);
    },
  );

  it('selects Monday and Sunday from local day of week', () => {
    const monday = selectPresentationDay(19, '2026-07-27');
    const sunday = selectPresentationDay(19, '2026-08-02');

    expect(monday.dayOfWeek).toBe(1);
    expect(monday.environment.pm25).toBe(36.7);
    expect(sunday.dayOfWeek).toBe(7);
    expect(sunday.environment.pm25).toBe(42.7);
  });

  it('uses the same selected day across Today and seven-day history', () => {
    const today = selectPresentationDay(19, '2026-07-28');
    const week = selectPresentationWeek(19, '2026-07-28');
    const history = selectPresentationExposureHistory(19, '2026-07-28');

    expect(week).toHaveLength(7);
    expect(history).toHaveLength(7);
    expect(week[6]).toEqual(today);
    expect(history[6]).toMatchObject({
      date: today.date,
      pm25: today.environment.pm25,
      temperature: today.environment.temperature,
      humidity: today.environment.humidity,
      uvi: today.environment.uvi,
    });
  });

  it('is deterministic for the same week and local date', () => {
    const first = selectPresentationWeek(28, '2026-08-02');
    const second = selectPresentationWeek(28, '2026-08-02');

    expect(second).toEqual(first);
  });

  it('exposes weekly participation aggregates from the selected week', () => {
    const summary = selectPresentationWeekSummary(19);

    expect(summary).toMatchObject({
      activeDays: 5,
      hydrationDays: 1,
      restDays: 5,
      sleepDays: 2,
      engagementDays: 3,
    });
  });

  it('maps engagement only when a daily prompt was sent', () => {
    const monday = toPresentationDayRecord(
      selectPresentationDay(19, '2026-07-27'),
    );
    const sunday = toPresentationDayRecord(
      selectPresentationDay(19, '2026-08-02'),
    );

    expect(monday.primaryTotal).toBe(0);
    expect(monday.primaryCompleted).toBe(0);
    expect(sunday.primaryTotal).toBe(1);
    expect(sunday.primaryCompleted).toBe(1);
  });
});
