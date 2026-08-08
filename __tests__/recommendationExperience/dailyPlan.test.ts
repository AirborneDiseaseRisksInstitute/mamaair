jest.mock('../../src/store/useRecommendationExperienceStore', () => {
  const state = {
    ensureOwner: jest.fn(),
    setActionState: jest.fn(),
    actionCompletions: {},
    presentedActions: {},
    getCheckIn: jest.fn(() => null),
    savePresentedActions: jest.fn(),
  };
  return {
    useRecommendationExperienceStore: {
      getState: () => state,
    },
    __testState: state,
  };
});

jest.mock('../../src/config/dev', () => ({
  DEV_LOCAL_SESSION: false,
  DEV_LOCAL_SESSION_RESET_TOKEN: 0,
}));

jest.mock('../../src/store/useUserStore', () => ({
  useUserStore: {
    getState: () => ({
      profile: {
        pregnancyWeek: 19,
        cookingMethod: null,
        ventilation: null,
      },
    }),
  },
}));

jest.mock('../../src/services/api/DailyTasksService', () => ({
  DailyTasksService: {
    getDailyTasks: jest.fn(),
  },
}));

jest.mock('../../src/services/api/TaskCompletionService', () => ({
  TaskCompletionService: {
    getCompletedStrict: jest.fn(),
    saveCompleted: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../src/services/api/SummaryService', () => ({
  SummaryService: {
    getSummary: jest.fn(),
  },
}));

jest.mock(
  '../../src/services/api/RecommendationCompletionService',
  () => ({
    RecommendationCompletionService: {
      getCompletions: jest.fn(),
      markDone: jest.fn(() => Promise.resolve()),
    },
  }),
);

import {
  composeDailyPlan,
  loadDailyPlanExperience,
  updateDailyPlanActionCompletion,
  updateDailyPlanActionState,
} from '../../src/services/recommendationExperience/DailyPlanRepository';
import { DAILY_PLAN_SAMPLE_ACTIONS } from '../../src/data/recommendations/dailyPlanFallback';
import { DailyTasksService } from '../../src/services/api/DailyTasksService';
import { TaskCompletionService } from '../../src/services/api/TaskCompletionService';
import { SummaryService } from '../../src/services/api/SummaryService';
import en from '../../src/i18n/locales/en.json';
import fr from '../../src/i18n/locales/fr.json';
import sw from '../../src/i18n/locales/sw.json';
import type {
  FeelingCheckInRecord,
} from '../../src/types/recommendationExperience';

const BASE_INPUT = {
  date: '2026-07-24',
  localActionCompletions: {},
  checkIn: null,
};

describe('daily plan composition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SummaryService.getSummary as jest.Mock).mockResolvedValue(null);
  });

  it('limits the focused plan to three prioritized care domains', () => {
    const plan = composeDailyPlan(BASE_INPUT);

    expect(plan.primaryActions).toHaveLength(3);
    expect(plan.primaryActions.map(action => action.domain)).toEqual([
      'diet',
      'behaviour',
      'activity',
    ]);
    expect(plan.additionalActions.wellbeing.length).toBeGreaterThan(0);
  });

  it('provides typed sample tasks in all four care domains', () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const actions = [
      ...plan.primaryActions,
      ...Object.values(plan.additionalActions).flat(),
    ];

    expect(new Set(actions.map(action => action.domain))).toEqual(
      new Set(['diet', 'activity', 'behaviour', 'wellbeing']),
    );
    expect(
      actions.every(action => action.source === 'sample'),
    ).toBe(true);
  });

  it('provides every sample task in all supported languages', () => {
    [en, fr, sw].forEach(locale => {
      DAILY_PLAN_SAMPLE_ACTIONS.forEach(action => {
        const content =
          locale.daily_plan_samples[
            action.translationKey as keyof typeof locale.daily_plan_samples
          ];

        expect(content?.title).toEqual(expect.any(String));
        expect(content?.purpose).toEqual(expect.any(String));
      });
    });
  });

  it('resolves localized sample content without changing task identity', () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      translate: key => `translated:${key}`,
    });

    expect(plan.primaryActions[0]).toMatchObject({
      key: 'local:mary-hydration-300',
      title:
        'translated:daily_plan_samples.mary_hydration_300.title',
      purpose:
        'translated:daily_plan_samples.mary_hydration_300.purpose',
    });
  });

  it('does not request task lists or task completion from the API', async () => {
    const result = await loadDailyPlanExperience(
      { backendUserId: '7' },
      BASE_INPUT.date,
    );

    expect(DailyTasksService.getDailyTasks).not.toHaveBeenCalled();
    expect(
      TaskCompletionService.getCompletedStrict,
    ).not.toHaveBeenCalled();
    expect(
      result.experience.primaryActions.every(
        action => action.source === 'sample',
      ),
    ).toBe(true);
  });

  it('promotes the distress-specific mental wellbeing action', () => {
    const checkIn: FeelingCheckInRecord = {
      date: BASE_INPUT.date,
      recordedAt: '2026-07-24T08:00:00.000Z',
      updatedAt: '2026-07-24T08:00:00.000Z',
      mommySymptomKeys: [],
      moodKeys: ['fallback:mood:anxious-worried'],
      feelingKeys: [],
      waterIncrementMl: 0,
      writeStatus: {
        mommySymptoms: 'skipped',
        wellbeing: 'skipped',
        dailyCheckIn: 'skipped',
      },
    };

    const plan = composeDailyPlan({
      ...BASE_INPUT,
      checkIn,
    });

    expect(plan.primaryActions).toHaveLength(3);
    expect(
      plan.primaryActions.find(
        action => action.domain === 'wellbeing',
      )?.title,
    ).toBe('Take one quiet minute in clean air');
  });

  it('rotates reviewed local actions after recent presentation', () => {
    const first = composeDailyPlan(BASE_INPUT);
    const next = composeDailyPlan({
      ...BASE_INPUT,
      date: '2026-07-25',
      recentPresentedActionKeys: first.primaryActions.map(
        action => action.key,
      ),
    });

    expect(next.primaryActions).toHaveLength(3);
    expect(
      next.primaryActions.map(action => action.key),
    ).not.toEqual(first.primaryActions.map(action => action.key));
  });

  it('persists local completion immediately without sending a local key', async () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const localAction = plan.primaryActions[0];
    const result = updateDailyPlanActionCompletion(
      { backendUserId: '7' },
      plan,
      localAction.key,
      true,
    );

    expect(result.experience.primaryActions[0].completed).toBe(true);
    expect(
      jest.requireMock(
        '../../src/store/useRecommendationExperienceStore',
      ).__testState.setActionState,
    ).toHaveBeenCalledWith(
      BASE_INPUT.date,
      localAction.key,
      'completed',
      {
        domain: localAction.domain,
        kind: 'primary',
      },
    );
    await result.sync;
    expect(TaskCompletionService.saveCompleted).not.toHaveBeenCalled();
  });

  it('keeps planned actions local without reporting completion', async () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const action = plan.primaryActions.find(
      item => item.domain === 'activity',
    )!;
    const result = updateDailyPlanActionState(
      { backendUserId: '7' },
      plan,
      action.key,
      'planned',
    );

    expect(
      result.experience.primaryActions.find(
        item => item.key === action.key,
      )?.state,
    ).toBe('planned');
    expect(
      result.experience.primaryActions.find(
        item => item.key === action.key,
      )?.completed,
    ).toBe(false);
    await result.sync;
    expect(TaskCompletionService.saveCompleted).not.toHaveBeenCalled();
  });

  it('never sends a completed sample task to the task API', async () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const sampleAction = plan.primaryActions[0];
    const result = updateDailyPlanActionCompletion(
      { backendUserId: '7' },
      plan,
      sampleAction.key,
      true,
    );

    await result.sync;
    expect(TaskCompletionService.saveCompleted).not.toHaveBeenCalled();
  });
});
