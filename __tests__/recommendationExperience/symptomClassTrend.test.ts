import {
  buildDevelopmentSymptomClassTrend,
  getSymptomClass,
} from '../../src/services/recommendationExperience/SymptomClassTrendRepository';
import type { FeelingCheckInRecord } from '../../src/types/recommendationExperience';

const emptyRecord = (
  date: string,
  mommySymptomKeys: string[],
): FeelingCheckInRecord => ({
  date,
  mommySymptomKeys,
  moodKeys: [],
  feelingKeys: [],
  waterIncrementMl: 0,
  recordedAt: '2026-08-09T09:00:00.000Z',
  updatedAt: '2026-08-09T09:00:00.000Z',
  writeStatus: {
    mommySymptoms: 'skipped',
    wellbeing: 'skipped',
    dailyCheckIn: 'skipped',
  },
});

describe('symptom class trend', () => {
  it.each([
    ['Vaginal bleeding', 'class1'],
    ['Persistent fatigue or weakness', 'class2'],
    ['Reduced fetal movement', 'class3'],
    ['Abdominal or back pain', 'class4'],
  ] as const)('maps %s to %s from the reviewed rules', (name, expected) => {
    expect(getSymptomClass(name)).toBe(expected);
  });

  it('uses the development pattern only when a day has no saved check-in', () => {
    const dates = [
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
      '2026-08-09',
    ];
    const trend = buildDevelopmentSymptomClassTrend(dates, {
      '2026-08-03': emptyRecord('2026-08-03', [
        'fallback:warning:vaginal-bleeding',
      ]),
      '2026-08-04': emptyRecord('2026-08-04', []),
    });

    expect(trend.class1.map(point => point.value)).toEqual([
      1,
      0,
      0,
      0,
      1,
      0,
      0,
    ]);
    expect(trend.class4[0].value).toBe(0);
    expect(trend.class2[1].value).toBe(0);
  });
});
