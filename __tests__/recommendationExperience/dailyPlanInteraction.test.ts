import {
  shouldShowTaskActions,
  supportsRestTimer,
} from '../../src/services/recommendationExperience/DailyPlanInteractionPresenter';
import type { DailyPlanAction } from '../../src/types/recommendationExperience';

const action = (
  overrides: Partial<DailyPlanAction> = {},
): DailyPlanAction => ({
  key: 'daily-plan:primary:mary-shaded-rest',
  domain: 'activity',
  title: 'Take a 10-minute seated rest in shade',
  source: 'apiDailyPlan',
  state: 'pending',
  completed: false,
  backendReference: {
    kind: 'dailyPlanAction',
    actionId: 'mary-shaded-rest',
    bucket: 'primary',
  },
  ...overrides,
});

describe('daily plan action interactions', () => {
  it('shows task controls only for incomplete interactive actions', () => {
    expect(shouldShowTaskActions(action(), true)).toBe(true);
    expect(
      shouldShowTaskActions(
        action({ state: 'completed', completed: true }),
        true,
      ),
    ).toBe(false);
    expect(shouldShowTaskActions(action(), false)).toBe(false);
  });

  it('enables the rest timer only for the designated rest action', () => {
    expect(supportsRestTimer(action())).toBe(true);
    expect(
      supportsRestTimer(
        action({
          key: 'daily-plan:primary:walk',
          title: 'Short walk',
          backendReference: {
            kind: 'dailyPlanAction',
            actionId: 'walk',
            bucket: 'primary',
          },
        }),
      ),
    ).toBe(false);
    expect(supportsRestTimer(action({ domain: 'wellbeing' }))).toBe(false);
  });
});
