jest.mock('../../src/store/useRecommendationExperienceStore', () => {
  const presentationDays: Record<string, any> = {};
  const state = {
    ensureOwner: jest.fn(),
    presentationDays,
    checkIns: {},
    actionCompletions: {},
    restTimers: {},
    dailyMoments: {},
    getPresentationDay: jest.fn(
      (date: string) => presentationDays[date] ?? null,
    ),
    savePresentationDay: jest.fn((record: any) => {
      presentationDays[record.date] = record;
    }),
  };
  return {
    useRecommendationExperienceStore: {
      getState: () => state,
    },
  };
});

import {
  selectPresentationDay,
  toPresentationDayRecord,
} from '../../src/services/recommendationExperience/PresentationDataProvider';
import {
  completeTodayPresentation,
  loadWeeklySummaryExperience,
  selectWeekPathDay,
} from '../../src/services/recommendationExperience/PresentationJourneyRepository';

describe('reference journey history', () => {
  it('builds stable week-aware records for the same calendar date', () => {
    const first = toPresentationDayRecord(
      selectPresentationDay(19, '2026-07-20'),
    );
    const second = toPresentationDayRecord(
      selectPresentationDay(19, '2026-07-20'),
    );

    expect(second).toEqual(first);
    expect(first.pregnancyWeek).toBe(19);
    expect(first.active).toBe(true);
    expect(first.primaryTotal).toBe(0);
  });

  it('leaves a reference-only week empty without recorded metrics', () => {
    const summary = loadWeeklySummaryExperience({
      identity: { backendUserId: 'context-only-user' },
      pregnancyWeek: 19,
      endDate: '2026-07-26',
      milestone: 'Week 19',
      localData: {
        checkIns: {},
        actionCompletions: {},
        restTimers: {},
        dailyMoments: {},
      },
    });

    expect(summary.dataMode).toBe('careContext');
    expect(summary.activeDays).toBe(0);
    expect(summary.primaryCompleted).toBe(0);
    expect(summary.primaryTotal).toBe(0);
    expect(summary.hydrationDays).toBe(0);
    expect(summary.restSessions).toBe(0);
    expect(summary.sleepNights).toBe(0);
    expect(summary.symptomTrend).toBe('');
    expect(summary.symptomLevels).toEqual([]);
    expect(summary.riskSummary).toBeNull();
  });

  it('keeps evening wind-down outside Daily Win and weekly progress', () => {
    const summary = loadWeeklySummaryExperience({
      identity: { backendUserId: 'wind-down-only-user' },
      pregnancyWeek: 19,
      endDate: '2026-07-26',
      milestone: 'Week 19',
      localData: {
        checkIns: {},
        actionCompletions: {},
        restTimers: {},
        dailyMoments: {
          '2026-07-26': {
            'evening-stretch': {
              key: 'evening-stretch',
              date: '2026-07-26',
              kind: 'stretch',
              completed: true,
              recordedAt: '2026-07-26T20:00:00.000Z',
              updatedAt: '2026-07-26T20:00:00.000Z',
            },
            'evening-sleep': {
              key: 'evening-sleep',
              date: '2026-07-26',
              kind: 'sleep',
              completed: true,
              recordedAt: '2026-07-26T21:00:00.000Z',
              updatedAt: '2026-07-26T21:00:00.000Z',
            },
          },
        },
      },
    });

    expect(summary.dataMode).toBe('careContext');
    expect(summary.activeDays).toBe(0);
    expect(summary.primaryCompleted).toBe(0);
    expect(summary.restSessions).toBe(0);
    expect(summary.sleepNights).toBe(0);
    expect(summary.streakDays).toBe(0);
  });

  it('keeps the selected day environment and hydration coherent', () => {
    const day = selectPresentationDay(19, '2026-07-20');

    expect(day.dayOfWeek).toBe(1);
    expect(day.environment.pm25).toBe(36.7);
    expect(day.environment.temperature).toBe(33.9);
    expect(day.nutrition.waterMl).toBe(1146);
    expect(day.nutrition.waterGoalMl).toBe(1500);
  });

  it('preserves valid zero readings and recorded zero activity', () => {
    const completed = completeTodayPresentation({
      identity: { backendUserId: 'zero-value-user' },
      date: '2026-07-26',
      pregnancyWeek: 19,
      summary: {
        mom_exposure: { exposure_level: 0, risks: {} },
        baby_exposure: { exposure_level: 0, risks: {} },
        risks_delta: { mom: 0, baby: 0 },
        week_info: { week: 11, text: 'Different week' },
        daily_exposure_level: '',
        recommendations: [],
      },
      airExposure: {
        id: 0,
        timestamp: '',
        latitude: 0,
        longitude: 0,
        pm25: 0,
        pm10: 0,
        no2: 0,
        so2: 0,
        co: 0,
        o3: 0,
        aqi: 0,
        temperature: 0,
        humidity: 0,
        pressure: 0,
        uvi: 0,
        uvi_level: '',
        wind_speed: 0,
        exposure_minutes: 0,
        activity_level: '',
        indoor: false,
      },
      lifestyle: { hydration_target_ml_per_day: 0 },
      checkIn: {
        recordState: 'recorded',
        waterDailyTotalMl: 0,
        waterGoalMl: 0,
        selection: {
          mommySymptomKeys: [],
          babySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [],
        },
      } as any,
    });

    expect(completed.airExposure?.aqi).toBe(0);
    expect(completed.airExposure?.exposure_minutes).toBe(0);
    expect(completed.summary.week_info?.week).toBe(19);
    expect(completed.summary.week_info?.text).toBeUndefined();
    expect(completed.lifestyle.hydration_target_ml_per_day).toBeUndefined();
    expect(completed.checkIn.waterDailyTotalMl).toBe(0);
    expect(completed.sourceFlags.motherBabyContext).toBe(false);
  });

  it('does not invent health or environment values without backend data', () => {
    const completed = completeTodayPresentation({
      identity: { backendUserId: 'missing-fields-user' },
      date: '2026-07-26',
      pregnancyWeek: 19,
      summary: null,
      airExposure: null,
      lifestyle: null,
      checkIn: {
        recordState: 'unknown',
        waterDailyTotalMl: 0,
        selection: {
          mommySymptomKeys: [],
          moodKeys: [],
          feelingKeys: [],
          waterIncrementMl: 0,
        },
        mommySymptoms: [],
        moods: [],
        feelings: [],
        capabilities: {},
      } as any,
    });

    expect(completed.checkIn.recordState).toBe('unknown');
    expect(completed.checkIn.selection.mommySymptomKeys).toEqual([]);
    expect(completed.checkIn.selection.moodKeys).toEqual([]);
    expect(completed.checkIn.selection.feelingKeys).toEqual([]);
    expect(completed.checkIn.waterDailyTotalMl).toBe(0);
    expect(completed.airExposure).toBeNull();
    expect(completed.lifestyle.hydration_target_ml_per_day).toBeUndefined();
    expect(completed.summary.risks_delta).toBeUndefined();
    expect(completed.sourceFlags.motherBabyContext).toBe(true);
  });

  it('keeps an explicit symptom-free check-in ahead of scenario history', () => {
    const summary = loadWeeklySummaryExperience({
      identity: { backendUserId: 'symptom-free-user' },
      pregnancyWeek: 19,
      endDate: '2026-07-26',
      milestone: 'Week 19',
      localData: {
        checkIns: {
          '2026-07-26': {
            date: '2026-07-26',
            mommySymptomKeys: [],
            moodKeys: [],
            feelingKeys: [],
            waterIncrementMl: 0,
            waterDailyTotalMl: 0,
            recordedAt: '2026-07-26T08:00:00.000Z',
            updatedAt: '2026-07-26T08:00:00.000Z',
            writeStatus: {
              mommySymptoms: 'saved',
              wellbeing: 'saved',
              dailyCheckIn: 'saved',
            },
          },
        },
        actionCompletions: {},
        restTimers: {},
        dailyMoments: {},
      },
    });

    expect(summary.days[6].symptomLabel).toBe('No physical changes reported');
    expect(summary.days[6].hydrationMl).toBe(0);
    expect(summary.dataMode).toBe('recorded');
    expect(summary.activeDays).toBe(1);
    expect(summary.days.slice(0, 6).every(day => !day.active)).toBe(true);
    expect(
      summary.days
        .slice(0, 6)
        .every(day => day.primaryCompleted === 0 && day.primaryTotal === 0),
    ).toBe(true);
    expect(summary.symptomTrend).toBe('');
    expect(summary.symptomLevels).toEqual([]);
  });

  it('keeps persisted Week Path actions ahead of reference activity', () => {
    const pending = selectWeekPathDay({
      pregnancyWeek: 19,
      date: '2026-07-27',
      actionRecords: {
        'diet-action': {
          state: 'pending',
          completed: false,
          domain: 'diet',
          kind: 'primary',
          updatedAt: '2026-07-27T08:00:00.000Z',
        },
      },
    });
    const completed = selectWeekPathDay({
      pregnancyWeek: 19,
      date: '2026-07-27',
      actionRecords: {
        'diet-action': {
          state: 'completed',
          completed: true,
          domain: 'diet',
          kind: 'primary',
          updatedAt: '2026-07-27T08:00:00.000Z',
        },
      },
    });

    expect(pending).toEqual({ active: false, domains: [] });
    expect(completed).toEqual({
      active: true,
      domains: ['diet'],
    });
  });

  it('keeps a valid Week Path history day ahead of local state', () => {
    const day = selectWeekPathDay({
      pregnancyWeek: 19,
      date: '2026-07-27',
      backendActive: true,
      actionRecords: {
        'diet-action': {
          state: 'pending',
          completed: false,
          domain: 'diet',
          kind: 'primary',
          updatedAt: '2026-07-27T08:00:00.000Z',
        },
      },
    });

    expect(day).toEqual({
      active: true,
      domains: ['activity'],
    });
  });

  it('keeps valid summary participation ahead of persisted and reference values', () => {
    const summary = loadWeeklySummaryExperience({
      identity: { backendUserId: 'summary-user' },
      pregnancyWeek: 19,
      endDate: '2026-07-26',
      milestone: 'Week 19',
      backendSummary: {
        daily_checkins: ['2026-07-26'],
        task_completions: [
          {
            date: '2026-07-26',
            tasks: ['diet-hydration'],
          },
        ],
      },
      localData: {
        checkIns: {},
        actionCompletions: {
          '2026-07-26': {
            'activity-action': {
              state: 'pending',
              completed: false,
              domain: 'activity',
              kind: 'primary',
              updatedAt: '2026-07-26T08:00:00.000Z',
            },
          },
        },
        restTimers: {},
        dailyMoments: {},
      },
    });

    expect(summary.days[6]).toMatchObject({
      active: true,
      primaryCompleted: 1,
      primaryTotal: 1,
      domains: {
        diet: true,
        activity: false,
        behaviour: false,
        wellbeing: false,
      },
    });
    expect(summary.dataMode).toBe('recorded');
    expect(summary.days.slice(0, 6).every(day => !day.active)).toBe(true);
  });

  it('summarizes only available action, symptom level, and risk data', () => {
    const summary = loadWeeklySummaryExperience({
      identity: { backendUserId: 'summary-user' },
      pregnancyWeek: 19,
      endDate: '2026-07-26',
      milestone: 'Week 19',
      backendSummary: {
        mom_exposure: {
          risks: {
            preeclampsia: true,
            ignored: false,
          },
        },
        baby_exposure: {
          risks: {
            growth_restriction: true,
          },
        },
        risks_delta: { mom: -6, baby: -9 },
        mommy_symptom_statistics_classes: {
          classes: [
            { symptom_class: 1, quantity: 2 },
            { symptom_class: 2, quantity: 1 },
          ],
        },
        baby_symptom_statistics_classes: {
          classes: [{ symptom_class: 3, quantity: 1 }],
        },
      } as any,
      localData: {
        checkIns: {},
        actionCompletions: {
          '2026-07-26': {
            'diet-action': {
              state: 'completed',
              completed: true,
              domain: 'diet',
              kind: 'primary',
              riskImpactValue: -5,
              updatedAt: '2026-07-26T08:00:00.000Z',
            },
            'activity-action': {
              state: 'pending',
              completed: false,
              domain: 'activity',
              kind: 'primary',
              updatedAt: '2026-07-26T08:00:00.000Z',
            },
            'mental-action': {
              state: 'completed',
              completed: true,
              domain: 'wellbeing',
              kind: 'extra',
              riskImpactValue: -2,
              updatedAt: '2026-07-26T08:00:00.000Z',
            },
          },
        },
        restTimers: {},
        dailyMoments: {},
      },
    });

    expect(summary.actionSummary).toMatchObject({
      diet: { recommended: 1, completed: 1 },
      activity: { recommended: 1, completed: 0 },
      behaviour: { recommended: 0, completed: 0 },
      wellbeing: { recommended: 1, completed: 1 },
    });
    expect(summary.symptomLevels).toEqual([
      { level: 1, mommyCount: 2, babyCount: 0, total: 2 },
      { level: 2, mommyCount: 1, babyCount: 0, total: 1 },
      { level: 3, mommyCount: 0, babyCount: 1, total: 1 },
    ]);
    expect(summary.symptomTrend).toBe('Level 1: 2 · Level 2: 1 · Level 3: 1');
    expect(summary.riskSummary).toEqual({
      identifiedRisks: ['Mother: preeclampsia', 'Baby: growth restriction'],
      completedActionImpact: -7,
      motherRiskDelta: -6,
      babyRiskDelta: -9,
    });
    expect(summary.motherProgress).toContain('Completed action impact: -7%.');
  });
});
