import { LEGACY_LOCAL_ACTION_DOMAINS } from '../data/recommendations/legacyDailyActionDomains';
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

export const countCompletedActionsByDomain = (
  records: Record<string, DailyActionCompletionRecord>,
): DailyTaskDomainCounts =>
  Object.entries(records).reduce((counts, [actionKey, record]) => {
    const domain = record.domain ?? LEGACY_LOCAL_ACTION_DOMAINS[actionKey];
    if (record.completed && domain) {
      counts[domain] += 1;
    }
    return counts;
  }, emptyCounts());
