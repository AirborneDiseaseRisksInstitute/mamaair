import type { WeeklyRiskSummary } from '../../types/recommendationExperience';

export type WeeklyRiskDirection = 'lower' | 'higher' | 'stable';
export type WeeklyRiskOverview =
  | WeeklyRiskDirection
  | 'mixed'
  | 'available';

export interface WeeklyRiskChange {
  audience: 'mother' | 'child';
  value: number;
  direction: WeeklyRiskDirection;
}

export interface WeeklyRiskSummaryViewModel {
  overview: WeeklyRiskOverview;
  changes: WeeklyRiskChange[];
  completedCareReduction: number | null;
  hasCompletedCareImpact: boolean;
  trackedFactorCount: number;
}

const directionFor = (value: number): WeeklyRiskDirection =>
  value < 0 ? 'lower' : value > 0 ? 'higher' : 'stable';

const overviewFor = (
  changes: WeeklyRiskChange[],
): WeeklyRiskOverview => {
  if (changes.length === 0) return 'available';

  const directions = new Set(changes.map(change => change.direction));
  if (directions.has('lower') && directions.has('higher')) return 'mixed';
  if (directions.has('higher')) return 'higher';
  if (directions.has('lower')) return 'lower';
  return 'stable';
};

export const buildWeeklyRiskSummaryViewModel = (
  summary: WeeklyRiskSummary,
): WeeklyRiskSummaryViewModel => {
  const changes: WeeklyRiskChange[] = [];

  if (summary.motherRiskDelta !== undefined) {
    changes.push({
      audience: 'mother',
      value: Math.abs(summary.motherRiskDelta),
      direction: directionFor(summary.motherRiskDelta),
    });
  }
  if (summary.babyRiskDelta !== undefined) {
    changes.push({
      audience: 'child',
      value: Math.abs(summary.babyRiskDelta),
      direction: directionFor(summary.babyRiskDelta),
    });
  }

  return {
    overview: overviewFor(changes),
    changes,
    completedCareReduction:
      summary.completedActionImpact < 0
        ? Math.abs(summary.completedActionImpact)
        : null,
    hasCompletedCareImpact: summary.completedActionImpact !== 0,
    trackedFactorCount: summary.identifiedRisks.length,
  };
};
