import { buildWeeklyRiskSummaryViewModel } from '../../src/services/recommendationExperience/WeeklyRiskSummaryPresenter';

describe('weekly risk summary presenter', () => {
  it('presents separate mother and child reductions without exposing raw labels', () => {
    const viewModel = buildWeeklyRiskSummaryViewModel({
      identifiedRisks: [
        'Mother: preeclampsia',
        'Baby: growth restriction',
      ],
      completedActionImpact: -7,
      motherRiskDelta: -6,
      babyRiskDelta: -9,
    });

    expect(viewModel).toEqual({
      overview: 'lower',
      changes: [
        { audience: 'mother', value: 6, direction: 'lower' },
        { audience: 'child', value: 9, direction: 'lower' },
      ],
      completedCareReduction: 7,
      hasCompletedCareImpact: true,
      trackedFactorCount: 2,
    });
  });

  it('distinguishes mixed, higher, stable, and reading-only summaries', () => {
    expect(
      buildWeeklyRiskSummaryViewModel({
        identifiedRisks: [],
        completedActionImpact: 0,
        motherRiskDelta: -2,
        babyRiskDelta: 1,
      }).overview,
    ).toBe('mixed');
    expect(
      buildWeeklyRiskSummaryViewModel({
        identifiedRisks: [],
        completedActionImpact: 0,
        motherRiskDelta: 2,
      }).overview,
    ).toBe('higher');
    expect(
      buildWeeklyRiskSummaryViewModel({
        identifiedRisks: [],
        completedActionImpact: 0,
        motherRiskDelta: 0,
        babyRiskDelta: 0,
      }).overview,
    ).toBe('stable');
    expect(
      buildWeeklyRiskSummaryViewModel({
        identifiedRisks: ['Mother: GDM'],
        completedActionImpact: 0,
      }).overview,
    ).toBe('available');
  });
});
