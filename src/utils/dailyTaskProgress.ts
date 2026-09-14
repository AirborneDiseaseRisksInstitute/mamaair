import { DAILY_PLAN_SAMPLE_ACTIONS } from '../data/recommendations/dailyPlanFallback';
import type {
  DailyActionCompletionRecord,
  DailyActionDomain,
} from '../types/recommendationExperience';

export type DailyTaskDomainCounts = Record<DailyActionDomain, number>;

const emptyCounts = (): DailyTaskDomainCounts => ({
  diet: 0,
  activity: 0,
  behaviour: 0,
  wellbeing: 0,
  service: 0,
});

const sampleActionDomains = new Map<string, DailyActionDomain>(
  DAILY_PLAN_SAMPLE_ACTIONS.map(action => [
    `local:${action.id}`,
    action.domain,
  ] as const),
);

export const countCompletedActionsByDomain = (
  records: Record<string, DailyActionCompletionRecord>,
): DailyTaskDomainCounts =>
  Object.entries(records).reduce((counts, [actionKey, record]) => {
    const domain = record.domain ?? sampleActionDomains.get(actionKey);
    if (record.completed && domain) {
      counts[domain] += 1;
    }
    return counts;
  }, emptyCounts());
