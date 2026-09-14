import {
  buildEnvironmentalRiskObservation,
  buildMotherTwinChartModel,
} from '../../src/services/recommendationExperience/MotherTwinChartRepository';

describe('mother twin chart model', () => {
  const weekDates = [
    '2026-09-07',
    '2026-09-08',
    '2026-09-09',
    '2026-09-10',
    '2026-09-11',
    '2026-09-12',
    '2026-09-13',
  ];

  it('counts completed recommendations and uses audience-specific risk readings', () => {
    const model = buildMotherTwinChartModel({
      weekDates,
      currentDate: '2026-09-10',
      backendSummary: {
        mom_exposure: { exposure_level: 62 },
        baby_exposure: { exposure_level: 58 },
        risks_delta: { mom: -3, baby: -5 },
        exposure_history: {
          start_date: '2026-09-07',
          end_date: '2026-09-13',
          days_requested: 7,
          items: [
            { date: '2026-09-07', integrated_score: 55 },
            { date: '2026-09-08', integrated_score: 60 },
            { date: '2026-09-09', integrated_score: 59 },
          ],
        },
      },
      environmentalRiskObservations: {
        '2026-09-07': {
          date: '2026-09-07',
          mother: { predicted: 55, afterSelfCare: 49 },
          baby: { predicted: 54, afterSelfCare: 48 },
          updatedAt: '2026-09-07T10:00:00.000Z',
        },
      },
      actionCompletions: {
        '2026-09-07': {
          nutrition: {
            state: 'completed',
            completed: true,
            domain: 'diet',
            kind: 'primary',
            riskImpactValue: -4,
            updatedAt: '2026-09-07T08:00:00.000Z',
          },
          protection: {
            state: 'completed',
            completed: true,
            domain: 'behaviour',
            kind: 'extra',
            riskImpactValue: -2,
            updatedAt: '2026-09-07T09:00:00.000Z',
          },
        },
        '2026-09-08': {
          pendingActivity: {
            state: 'pending',
            completed: false,
            domain: 'activity',
            kind: 'primary',
            updatedAt: '2026-09-08T08:00:00.000Z',
          },
          support: {
            state: 'completed',
            completed: true,
            domain: 'service',
            kind: 'support',
            riskImpactValue: -10,
            updatedAt: '2026-09-08T08:00:00.000Z',
          },
        },
      },
    });

    expect(model.hasCareCompletionData).toBe(true);
    expect(model.careCompletion.diet.map(point => point.value)).toEqual([
      1, 0, 0, 0, 0, 0, 0,
    ]);
    expect(model.careCompletion.behaviour.map(point => point.value)).toEqual([
      1, 0, 0, 0, 0, 0, 0,
    ]);
    expect(model.careCompletion.activity.map(point => point.value)).toEqual([
      0, 0, 0, 0, 0, 0, 0,
    ]);

    expect(model.hasEnvironmentalRiskData.mother).toBe(true);
    expect(model.hasEnvironmentalRiskData.baby).toBe(true);
    expect(model.environmentalRisk.mother).toEqual([
      { date: '2026-09-07', predicted: 55, afterSelfCare: 49 },
      { date: '2026-09-10', predicted: 65, afterSelfCare: 62 },
    ]);
    expect(model.environmentalRisk.baby[1]).toEqual({
      date: '2026-09-10',
      predicted: 63,
      afterSelfCare: 58,
    });
  });

  it('does not present shared exposure history as mother or child risk history', () => {
    const model = buildMotherTwinChartModel({
      weekDates,
      currentDate: '2026-09-10',
      backendSummary: {
        exposure_history: {
          start_date: '2026-09-07',
          end_date: '2026-09-10',
          days_requested: 7,
          items: [
            { date: '2026-09-07', integrated_score: 55 },
            { date: '2026-09-08', integrated_score: 60 },
          ],
        },
      },
      environmentalRiskObservations: {},
      actionCompletions: {},
    });

    expect(model.hasEnvironmentalRiskData).toEqual({
      mother: false,
      baby: false,
    });
    expect(model.environmentalRisk).toEqual({ mother: [], baby: [] });
  });

  it('groups backend completion codes by care category for each day', () => {
    const model = buildMotherTwinChartModel({
      weekDates,
      currentDate: '2026-09-10',
      backendSummary: {
        task_completions: [
          {
            date: '2026-09-08',
            tasks: [
              'nutrition-hydration',
              'protection-ventilation',
              'activity-walk',
              'wellbeing-rest',
            ],
          },
        ],
      },
      environmentalRiskObservations: {},
      actionCompletions: {},
    });

    expect(model.careCompletion.diet[1].value).toBe(1);
    expect(model.careCompletion.behaviour[1].value).toBe(1);
    expect(model.careCompletion.activity[1].value).toBe(1);
    expect(model.careCompletion.wellbeing[1].value).toBe(1);
  });

  it('derives the predicted value from the API risk delta', () => {
    const observation = buildEnvironmentalRiskObservation(
      {
        snapshot_created_at: '2026-09-10T08:30:00.000Z',
        mom_exposure: { exposure_level: 4.2 },
        baby_exposure: { exposure_level: 3.8 },
        risks_delta: { mom: -1.3, baby: -0.7 },
      },
      '2026-09-09',
    );

    expect(observation).toMatchObject({
      date: '2026-09-10',
      mother: { predicted: 5.5, afterSelfCare: 4.2 },
      baby: { predicted: 4.5, afterSelfCare: 3.8 },
    });
  });
});
