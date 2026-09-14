import type { DailyPlanAction } from '../../types/recommendationExperience';

const REST_TIMER_ACTION_IDS = new Set(['mary-shaded-rest']);

const actionIdentifier = (action: DailyPlanAction): string | null => {
  if (action.backendReference?.kind === 'dailyPlanAction') {
    return action.backendReference.actionId;
  }
  if (action.backendReference?.kind === 'dailyTask') {
    return action.backendReference.code;
  }
  return action.key.startsWith('local:') ? action.key.slice(6) : null;
};

export const supportsRestTimer = (action: DailyPlanAction): boolean =>
  action.domain === 'activity' &&
  REST_TIMER_ACTION_IDS.has(actionIdentifier(action) ?? '');

export const shouldShowTaskActions = (
  action: DailyPlanAction,
  interactive: boolean,
): boolean => interactive && !action.completed;
