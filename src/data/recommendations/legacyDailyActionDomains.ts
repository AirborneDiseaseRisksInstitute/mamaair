import type { DailyActionDomain } from '../../types/recommendationExperience';

/**
 * Domain metadata for local action records created before domains were stored
 * with each completion. Keep these IDs stable so existing histories remain
 * reconstructable after upgrades.
 */
export const LEGACY_LOCAL_ACTION_DOMAINS: Readonly<
  Record<string, DailyActionDomain>
> = {
  'local:mary-hydration-300': 'diet',
  'local:mary-shift-midday-work': 'behaviour',
  'local:mary-shaded-rest': 'activity',
  'local:wellbeing-clean-air-breathing': 'wellbeing',
  'local:wellbeing-gentle-wind-down': 'wellbeing',
  'local:wellbeing-cool-pause': 'wellbeing',
  'local:diet-vitamin-c-pairing': 'diet',
  'local:behaviour-cleaner-cooking-window': 'behaviour',
  'local:activity-shaded-route': 'activity',
  'local:behaviour-ventilate-when-air-clears': 'behaviour',
  'local:activity-gentle-mobility-pause': 'activity',
  'local:wellbeing-grounding-senses': 'wellbeing',
};
