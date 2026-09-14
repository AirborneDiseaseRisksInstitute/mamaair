import type { DailyActionDomain } from '../../types/recommendationExperience';

export interface DailyTaskEnrichment {
  purpose: string;
  priority: number;
  domain?: DailyActionDomain;
}

export const DAILY_TASK_ENRICHMENT: Record<string, DailyTaskEnrichment> = {
  drink_water: {
    domain: 'diet',
    purpose: 'Keep hydration visible today with one small water step.',
    priority: 10,
  },
  cooking_smoke: {
    domain: 'behaviour',
    purpose:
      'Reduce smoke exposure by choosing the cleanest cooking setup available.',
    priority: 20,
  },
  morning_walk: {
    domain: 'activity',
    purpose: 'Use a short, comfortable walk while the day is still cooler.',
    priority: 30,
  },
};

export const DAILY_TASK_DOMAIN_PURPOSE: Record<DailyActionDomain, string> = {
  diet: 'A practical nutrition step selected for today.',
  activity: 'A manageable movement or rest step for today.',
  behaviour: 'A small routine change that can make today feel safer.',
  wellbeing: 'A supportive step for rest and emotional wellbeing.',
  service: 'A care-service step for today.',
};
