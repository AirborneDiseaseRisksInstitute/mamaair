import {
  buildCompleteApiSymptomClassTrend,
  buildDevelopmentSymptomClassTrend,
  getApiSymptomClassMetadata,
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
  it('rejects a partial API week instead of drawing failed days as zero', () => {
    const completeDay = {
      classes: [{ symptom_class: 1, quantity: 2 }],
    };
    expect(
      buildCompleteApiSymptomClassTrend([
        completeDay,
        completeDay,
        null,
        completeDay,
        completeDay,
        completeDay,
        completeDay,
      ]),
    ).toBeNull();
  });

  it('builds daily class points only for a complete API week', () => {
    const trend = buildCompleteApiSymptomClassTrend(
      Array.from({ length: 7 }, (_, index) => ({
        classes: [{ symptom_class: 2, quantity: index }],
      })),
    );

    expect(trend?.class2.map(point => point.value)).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
    expect(trend?.class1.every(point => point.value === 0)).toBe(true);
  });

  it('uses API class names and rejects recorded classes the chart cannot represent', () => {
    const supportedDay = {
      classes: [
        {
          symptom_class: 1,
          class_name: 'Acute & Emergency Indicators',
          color_flag: 'critical_red',
          quantity: 1,
        },
      ],
    };
    const results = Array.from({ length: 7 }, () => supportedDay);

    expect(getApiSymptomClassMetadata(results)).toEqual({
      1: {
        className: 'Acute & Emergency Indicators',
        colorFlag: 'critical_red',
      },
    });
    expect(
      buildCompleteApiSymptomClassTrend([
        ...results.slice(0, 6),
        { classes: [{ symptom_class: 5, quantity: 1 }] },
      ]),
    ).toBeNull();
  });

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
