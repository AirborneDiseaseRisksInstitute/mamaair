jest.mock('../../src/store/useRecommendationExperienceStore', () => {
  const state = {
    ensureOwner: jest.fn(),
    setActionState: jest.fn(),
    actionCompletions: {},
    presentedActions: {},
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

jest.mock('../../src/services/api/DailyTasksService', () => ({
  DailyTasksService: {
    getDailyTasks: jest.fn(),
  },
}));

jest.mock('../../src/services/api/TaskCompletionService', () => ({
  TaskCompletionService: {
    getCompleted: jest.fn(),
    saveCompleted: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../../src/services/api/SummaryService', () => ({
  SummaryService: {
    getSummary: jest.fn(),
  },
}));

jest.mock('../../src/services/api/DailyPlanService', () => ({
  DailyPlanService: {
    getDailyPlan: jest.fn(),
    updateActionCompletion: jest.fn(() =>
      Promise.resolve({
        id: 'updated-action',
        completion_state: 'completed',
      }),
    ),
  },
}));

jest.mock('../../src/services/api/AdviceService', () => ({
  AdviceService: {
    getAdvice: jest.fn(),
  },
}));

jest.mock('../../src/services/api/RecommendationCompletionService', () => ({
  RecommendationCompletionService: {
    getCompletions: jest.fn(),
    markDone: jest.fn(),
  },
}));

import {
  composeBackendDailyPlan,
  composeDailyPlan,
  completedRiskImpactValue,
  isMedicalAttentionRecommendation,
  loadDailyPlanExperience,
  riskImpactCompletionPercent,
  updateDailyPlanActionCompletion,
  updateDailyPlanActionState,
} from '../../src/services/recommendationExperience/DailyPlanRepository';
import {
  DailyTasksService,
  type DailyTask,
} from '../../src/services/api/DailyTasksService';
import { TaskCompletionService } from '../../src/services/api/TaskCompletionService';
import {
  SummaryService,
  type SummaryRecommendation,
} from '../../src/services/api/SummaryService';
import { DailyPlanService } from '../../src/services/api/DailyPlanService';
import { AdviceService } from '../../src/services/api/AdviceService';
import { RecommendationCompletionService } from '../../src/services/api/RecommendationCompletionService';
import type { PlanInputReadiness } from '../../src/types/recommendationExperience';

const BACKEND_TASKS: DailyTask[] = [
  {
    code: 'cooking_smoke',
    title: 'Cooking Smoke',
    category: 'behavior',
    sort_order: 20,
  },
  {
    code: 'drink_water',
    title: 'Drink water',
    category: 'diet',
    sort_order: 10,
  },
  {
    code: 'morning_walk',
    title: 'Morning Walk',
    category: 'activity',
    sort_order: 30,
  },
];

const recommendation = (
  overrides: Partial<SummaryRecommendation>,
): SummaryRecommendation => ({
  id: 'rec.default.v1',
  rule_id: 'alert.pm25.daily',
  version: 1,
  severity: 'moderate',
  category: 'air_quality',
  priority: 30,
  title: 'PM2.5 is high',
  alert: 'Limit outdoor exposure today.',
  recommendation_diet: 'Drink water regularly.',
  recommendation_activity: 'Choose shorter outdoor trips.',
  recommendation_behavior: 'Reduce smoke exposure.',
  ttl_hours: 24,
  expires_at: '2026-07-25T00:00:00.000Z',
  sources: ['rules-engine'],
  engine_version: 'v1',
  message: 'Air quality guidance for today.',
  ...overrides,
});

const BASE_INPUT = {
  date: '2026-07-24',
  backendDailyTasks: BACKEND_TASKS,
  backendCompletedTaskCodes: [],
  localActionCompletions: {},
  recommendations: [],
};

const READY_PLAN_INPUTS: PlanInputReadiness = {
  ready: true,
  profileReady: true,
  checkInReady: true,
  missingProfileSteps: [],
};

describe('daily plan composition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (DailyTasksService.getDailyTasks as jest.Mock).mockResolvedValue(
      BACKEND_TASKS,
    );
    (TaskCompletionService.getCompleted as jest.Mock).mockResolvedValue([]);
    (SummaryService.getSummary as jest.Mock).mockResolvedValue({
      recommendations: [],
    });
    (DailyPlanService.getDailyPlan as jest.Mock).mockRejectedValue(
      new Error('not live'),
    );
    (AdviceService.getAdvice as jest.Mock).mockResolvedValue(null);
    (
      RecommendationCompletionService.getCompletions as jest.Mock
    ).mockResolvedValue([]);
    (RecommendationCompletionService.markDone as jest.Mock).mockImplementation(
      data =>
        Promise.resolve({
          id: 1,
          ...data,
          created_at: '2026-09-10T08:00:00.000Z',
          updated_at: '2026-09-10T08:00:00.000Z',
        }),
    );
  });

  it('does not request plan or recommendation data until inputs are ready', async () => {
    const result = await loadDailyPlanExperience(
      { backendUserId: '7' },
      BASE_INPUT.date,
      {
        inputReadiness: {
          ready: false,
          profileReady: false,
          checkInReady: false,
          missingProfileSteps: ['IntroStep07'],
        },
      },
    );

    expect(result.status).toBe('needsInput');
    expect(DailyPlanService.getDailyPlan).not.toHaveBeenCalled();
    expect(AdviceService.getAdvice).not.toHaveBeenCalled();
    expect(SummaryService.getSummary).not.toHaveBeenCalled();
    expect(RecommendationCompletionService.getCompletions).not.toHaveBeenCalled();
  });

  it('builds Today tasks from backend daily tasks ordered by sort_order', () => {
    const plan = composeDailyPlan(BASE_INPUT);

    expect(plan.primaryActions.map(action => action.key)).toEqual([
      'daily-task:drink_water',
      'daily-task:cooking_smoke',
      'daily-task:morning_walk',
    ]);
    expect(plan.primaryActions.map(action => action.domain)).toEqual([
      'diet',
      'behaviour',
      'activity',
    ]);
    expect(
      plan.primaryActions.every(action => action.source === 'apiDailyTask'),
    ).toBe(true);
    expect(plan.additionalActions).toEqual({
      diet: [],
      activity: [],
      behaviour: [],
      wellbeing: [],
      service: [],
    });
    expect(plan.supportActions).toEqual([]);
    expect(plan.source).toBe('legacy');
  });

  it('keeps backend task code as the completion identity and enriches UI copy', () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const hydration = plan.primaryActions[0];

    expect(hydration).toMatchObject({
      key: 'daily-task:drink_water',
      title: 'Drink water',
      purpose: expect.any(String),
      backendReference: {
        kind: 'dailyTask',
        code: 'drink_water',
      },
    });
  });

  it('uses backend task completion state as authoritative for completed habits', () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      backendCompletedTaskCodes: ['drink_water'],
    });

    expect(plan.primaryActions[0]).toMatchObject({
      key: 'daily-task:drink_water',
      state: 'completed',
      completed: true,
    });
  });

  it('distributes summary risk impact across active daily actions', () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      totalRiskImpact: -15,
    });

    expect(plan.riskImpact).toEqual({
      totalValue: -15,
      source: 'summaryRisksDelta',
      missingBackendActionValues: true,
    });
    expect(plan.primaryActions.map(action => action.riskImpact?.value)).toEqual(
      [-5, -5, -5],
    );
  });

  it('applies an action risk impact when that action is completed', async () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      totalRiskImpact: -15,
    });
    const hydration = plan.primaryActions[0];

    const result = await updateDailyPlanActionCompletion(
      { backendUserId: '7' },
      plan,
      hydration.key,
      true,
    );

    expect(completedRiskImpactValue(result.experience)).toBe(-5);
    expect(riskImpactCompletionPercent(result.experience)).toBe(33);
  });

  it('classifies high urgency medical metadata as medical attention', () => {
    expect(
      isMedicalAttentionRecommendation(
        recommendation({
          rule_id: 'risk.preeclampsia.daily',
          severity: 'urgent',
          category: 'medical',
          priority: 6,
        }),
      ),
    ).toBe(true);
  });

  it('does not treat severity alone as medical attention', () => {
    expect(
      isMedicalAttentionRecommendation(
        recommendation({
          rule_id: 'alert.pm25.daily',
          severity: 'high',
          category: 'air_quality',
          priority: 20,
        }),
      ),
    ).toBe(false);
  });

  it('separates recommendations into medical, important guidance, guidance, and optional support buckets', () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      recommendations: [
        recommendation({
          id: 'risk.preeclampsia.v1',
          rule_id: 'risk.preeclampsia.daily',
          severity: 'urgent',
          category: 'medical',
          priority: 6,
        }),
        recommendation({
          id: 'alert.no2.high.v1',
          rule_id: 'alert.no2.daily',
          category: 'air_quality',
          severity: 'high',
          priority: 20,
        }),
        recommendation({
          id: 'alert.pm25.moderate.v1',
          priority: 30,
        }),
        recommendation({
          id: 'info.sleep.v1',
          rule_id: 'info.sleep.daily',
          category: 'lifestyle',
          priority: 75,
        }),
      ],
    });

    expect(plan.medicalAttention.map(item => item.id)).toEqual([
      'risk.preeclampsia.v1',
    ]);
    expect(plan.importantGuidanceRecommendations.map(item => item.id)).toEqual([
      'alert.no2.high.v1',
    ]);
    expect(plan.guidanceRecommendations.map(item => item.id)).toEqual([
      'alert.pm25.moderate.v1',
    ]);
    expect(plan.optionalSupportRecommendations.map(item => item.id)).toEqual([
      'info.sleep.v1',
    ]);
  });

  it('orders recommendations deterministically using backend metadata', () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      recommendations: [
        recommendation({
          id: 'guidance.zeta.v1',
          rule_id: 'guidance.zeta.daily',
          severity: 'moderate',
          category: 'wellbeing',
          priority: 40,
        }),
        recommendation({
          id: 'guidance.alpha.v1',
          rule_id: 'guidance.alpha.daily',
          severity: 'high',
          category: 'wellbeing',
          priority: 40,
        }),
        recommendation({
          id: 'guidance.beta.v1',
          rule_id: 'guidance.beta.daily',
          severity: 'high',
          category: 'air_quality',
          priority: 40,
        }),
      ],
    });

    expect(plan.importantGuidanceRecommendations.map(item => item.id)).toEqual([
      'guidance.beta.v1',
      'guidance.alpha.v1',
    ]);
    expect(plan.guidanceRecommendations.map(item => item.id)).toEqual([
      'guidance.zeta.v1',
    ]);
  });

  it('keeps mental recommendations in the guidance buckets', () => {
    const plan = composeDailyPlan({
      ...BASE_INPUT,
      recommendations: [
        recommendation({
          id: 'mental.breathing.v1',
          rule_id: 'mental.breathing.daily',
          severity: 'moderate',
          category: 'mental_wellbeing',
          priority: 35,
          title: 'Take a breathing pause',
        }),
      ],
    });

    expect(plan.guidanceRecommendations.map(item => item.id)).toEqual([
      'mental.breathing.v1',
    ]);
  });

  it('keeps mental daily plan actions visible as wellbeing actions', () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-05',
        timezone: 'Europe/Prague',
        primary_actions: [
          {
            id: 'breathing',
            domain: 'mental',
            title: 'Breathing pause',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [
          {
            id: 'journal',
            domain: 'mental',
            title: 'Note one feeling',
            completion_state: 'not_done',
          },
        ],
        support_actions: [
          {
            id: 'clinic',
            domain: 'service',
            title: 'Review clinic contact options',
            completion_state: 'not_done',
          },
        ],
      },
      localActionCompletions: {},
    });

    expect(plan.primaryActions[0]).toMatchObject({
      key: 'daily-plan:primary:breathing',
      domain: 'wellbeing',
      backendDomain: 'mental',
    });
    expect(plan.additionalActions.wellbeing[0]).toMatchObject({
      key: 'daily-plan:additional:journal',
      domain: 'wellbeing',
      backendDomain: 'mental',
    });
    expect(plan.supportActions[0]).toMatchObject({
      key: 'daily-plan:support:clinic',
      domain: 'service',
    });
  });

  it('turns mental Advice content into a normal wellbeing Daily Action', () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-10',
        timezone: 'Europe/Prague',
        primary_actions: [
          {
            id: 'drink-water',
            domain: 'nutrition',
            title: 'Drink water',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [],
        support_actions: [],
      },
      localActionCompletions: {},
      recommendationSnapshotId: 91,
      recommendations: [
        recommendation({
          rule_id: 'mental.wellbeing.distressed',
          title: 'Give yourself a quiet moment',
          category: 'mental_wellbeing',
          recommendation_diet: '',
          recommendation_activity: '',
          recommendation_behavior: '',
          recommendation_mental: 'Take five slow breaths in a quiet place.',
        }),
      ],
    });

    expect(plan.primaryActions).toHaveLength(1);
    expect(plan.primaryActions[0]).toMatchObject({
      domain: 'wellbeing',
      source: 'apiRecommendation',
      title: 'Give yourself a quiet moment',
      purpose: 'Take five slow breaths in a quiet place.',
      backendReference: {
        kind: 'recommendation',
        snapshotId: 91,
        ruleId: 'mental.wellbeing.distressed',
        dimension: 'mental',
      },
    });
  });

  it('uses backend action impact values before allocating remaining summary impact', () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-05',
        timezone: 'Europe/Prague',
        primary_actions: [
          {
            id: 'hydration',
            domain: 'nutrition',
            title: 'Drink water with breakfast',
            completion_state: 'completed',
            risk_impact_percent: -4,
          },
          {
            id: 'walk',
            domain: 'activity',
            title: 'Short walk',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [
          {
            id: 'optional-walk',
            domain: 'activity',
            title: 'Optional short walk',
            completion_state: 'not_done',
          },
        ],
        support_actions: [],
      },
      localActionCompletions: {},
      totalRiskImpact: -10,
    });

    expect(plan.riskImpact).toEqual({
      totalValue: -10,
      source: 'summaryRisksDelta',
      missingBackendActionValues: true,
    });
    expect(plan.primaryActions[0].riskImpact).toEqual({
      value: -4,
      source: 'backendAction',
    });
    expect(plan.primaryActions[1].riskImpact).toEqual({
      value: -6,
      source: 'allocatedSummary',
    });
    expect(plan.additionalActions.activity[0].riskImpact).toBeUndefined();
    expect(completedRiskImpactValue(plan)).toBe(-4);
    expect(riskImpactCompletionPercent(plan)).toBe(40);
  });

  it('does not replace an unavailable Daily Plan with legacy Daily Tasks', async () => {
    (SummaryService.getSummary as jest.Mock).mockResolvedValue({
      recommendations: [],
      risks_delta: { mom: -6, baby: -9 },
    });
    (AdviceService.getAdvice as jest.Mock).mockResolvedValue({
      id: 42,
      recommendations: [
        recommendation({
          id: 'alert.preeclampsia.v1',
          rule_id: 'preeclampsia.warning',
          category: 'pregnancy',
          priority: 10,
          severity: 'urgent',
          recommendation_diet: '',
          recommendation_activity: '',
          recommendation_behavior: '',
        }),
      ],
    });

    const result = await loadDailyPlanExperience(
      { backendUserId: '7' },
      BASE_INPUT.date,
      { inputReadiness: READY_PLAN_INPUTS },
    );

    expect(result.status).toBe('unavailable');
    expect(DailyTasksService.getDailyTasks).not.toHaveBeenCalled();
    expect(TaskCompletionService.getCompleted).not.toHaveBeenCalled();
    expect(result.experience.primaryActions).toEqual([]);
    expect(result.experience.additionalActions).toEqual({
      diet: [],
      activity: [],
      behaviour: [],
      wellbeing: [],
      service: [],
    });
    expect(result.experience.medicalAttention).toHaveLength(1);
    expect(result.experience.guidanceRecommendations).toEqual([]);
  });

  it('preserves plan-improvement Advice when Daily Plan is unavailable', async () => {
    (AdviceService.getAdvice as jest.Mock).mockResolvedValue({
      id: 43,
      recommendations: [
        recommendation({
          id: 'info.complete_data.v1',
          rule_id: 'fallback.complete_data',
          severity: 'info',
          category: 'general',
          priority: 72,
          title: 'Complete your data',
          message: 'Add your sleep hours and weekly activity.',
          recommendation_diet: '',
          recommendation_activity: '',
          recommendation_behavior: '',
        }),
      ],
    });

    const result = await loadDailyPlanExperience(
      { backendUserId: '7' },
      BASE_INPUT.date,
      { inputReadiness: READY_PLAN_INPUTS },
    );

    expect(result.status).toBe('unavailable');
    expect(result.experience.primaryActions).toEqual([]);
    expect(result.experience.optionalSupportRecommendations).toHaveLength(1);
    expect(result.experience.optionalSupportRecommendations[0]).toMatchObject({
      title: 'Complete your data',
      message: 'Add your sleep hours and weekly activity.',
    });
    expect(DailyTasksService.getDailyTasks).not.toHaveBeenCalled();
  });

  it('uses active Advice actions first and retains non-overlapping Daily Plan actions once', async () => {
    (SummaryService.getSummary as jest.Mock).mockResolvedValue({
      recommendations: [],
    });
    (AdviceService.getAdvice as jest.Mock).mockResolvedValue({
      id: 84,
      recommendations: [
        recommendation({ id: 'alert.pm25.v1' }),
        recommendation({
          id: 'alert.preeclampsia.v1',
          rule_id: 'preeclampsia.warning',
          category: 'pregnancy',
          priority: 10,
          severity: 'urgent',
          recommendation_diet: '',
          recommendation_activity: '',
          recommendation_behavior: '',
        }),
      ],
    });
    (DailyPlanService.getDailyPlan as jest.Mock).mockResolvedValue({
      date: '2026-09-05',
      timezone: 'Europe/Prague',
      primary_actions: [
        {
          id: 'hydration',
          domain: 'nutrition',
          title: 'Drink water with breakfast',
          purpose: 'Backend nutrition context',
          completion_state: 'completed',
          timing: {
            label: 'Morning',
          },
          duration_minutes: 5,
          context: {
            label: 'At home',
          },
        },
        {
          id: 'walk',
          domain: 'activity',
          title: 'Short walk',
          completion_state: 'skipped',
          timing: {
            start_time: '17:00',
            end_time: '17:20',
          },
          duration: 20,
          context_label: 'When AQI improves',
        },
      ],
      additional_actions: [
        {
          id: 'ventilation',
          domain: 'behavior',
          title: 'Ventilate the kitchen',
          completion_state: 'not_done',
          scheduled_time: '12:00',
        },
        {
          id: 'breathing',
          domain: 'mental',
          title: 'Breathing pause',
          completion_state: 'not_done',
          context: ['Quiet room', 'After lunch'],
        },
      ],
      support_actions: [
        {
          id: 'clinic',
          domain: 'service',
          title: 'Review clinic contact options',
          completion_state: 'not_done',
          duration: 'Same day',
        },
      ],
    });

    const result = await loadDailyPlanExperience(
      { backendUserId: '7' },
      BASE_INPUT.date,
      { inputReadiness: READY_PLAN_INPUTS },
    );

    expect(DailyPlanService.getDailyPlan).toHaveBeenCalledWith(BASE_INPUT.date);
    expect(DailyTasksService.getDailyTasks).not.toHaveBeenCalled();
    expect(TaskCompletionService.getCompleted).not.toHaveBeenCalled();
    expect(result.status).toBe('available');
    expect(result.experience).toMatchObject({
      date: '2026-09-05',
      timezone: 'Europe/Prague',
      source: 'unifiedApi',
      backendCompletedTaskCodes: ['hydration'],
    });
    expect(result.experience.primaryActions.map(action => action.key)).toEqual([
      'advice:84:alert.pm25.daily:1:diet',
      'advice:84:alert.pm25.daily:1:activity',
      'advice:84:alert.pm25.daily:1:behavior',
      'daily-plan:primary:hydration',
    ]);
    expect(result.experience.primaryActions[0]).toMatchObject({
      domain: 'diet',
      source: 'apiRecommendation',
      completed: false,
      title: 'Drink water regularly.',
      purpose: undefined,
      contextLabel: 'PM2.5 is high · Limit outdoor exposure today.',
      backendReference: {
        kind: 'recommendation',
        snapshotId: 84,
        dimension: 'diet',
      },
    });
    expect(result.experience.primaryActions[1]).toMatchObject({
      domain: 'activity',
      source: 'apiRecommendation',
      completed: false,
    });
    expect(result.experience.primaryActions[2]).toMatchObject({
      domain: 'behaviour',
      source: 'apiRecommendation',
    });
    expect(
      Object.values(result.experience.additionalActions)
        .flat()
        .map(action => action.key),
    ).toEqual([
      'daily-plan:primary:walk',
      'daily-plan:additional:ventilation',
      'daily-plan:additional:breathing',
    ]);
    expect(result.experience.supportActions).toHaveLength(1);
    expect(result.experience.supportActions[0]).toMatchObject({
      key: 'daily-plan:support:clinic',
      domain: 'service',
      durationLabel: 'Same day',
      backendReference: {
        kind: 'dailyPlanAction',
        bucket: 'support',
      },
    });
    expect(result.experience.medicalAttention).toHaveLength(1);
    expect(result.experience.medicalAttention[0].id).toBe(
      'alert.preeclampsia.v1',
    );
    expect(result.experience.importantGuidanceRecommendations).toEqual([]);
    expect(result.experience.guidanceRecommendations).toEqual([]);
    expect(result.experience.optionalSupportRecommendations).toEqual([]);
  });

  it('promotes personalized Daily Plan additions above legacy seeds and keeps information-only Advice', () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-11',
        timezone: 'UTC',
        primary_actions: [
          {
            id: 'water',
            domain: 'nutrition',
            title: 'Drink water',
            completion_state: 'not_done',
          },
          {
            id: 'smoke',
            domain: 'behavior',
            title: 'Cooking Smoke',
            completion_state: 'not_done',
          },
          {
            id: 'walk',
            domain: 'activity',
            title: 'Morning Walk',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [
          {
            id: 'low-activity-diet',
            domain: 'nutrition',
            title: 'Low weekly activity',
            description:
              'Hydrate before/during/after activity; balanced meals to support moderate exercise.',
            completion_state: 'not_done',
          },
          {
            id: 'low-activity-movement',
            domain: 'activity',
            title: 'Low weekly activity',
            description:
              'Build to 150 min/week (e.g., brisk walking, swimming); include pelvic-floor and light resistance work; avoid high-risk sports.',
            completion_state: 'not_done',
          },
          {
            id: 'low-activity-behavior',
            domain: 'behavior',
            title: 'Low weekly activity',
            description:
              'Use timing around cleaner air/cooler hours; plan 30-min sessions 5 days/week.',
            completion_state: 'not_done',
          },
        ],
        support_actions: [
          {
            id: 'service',
            domain: 'service',
            title: 'Request care',
          },
        ],
      },
      localActionCompletions: {},
      recommendationSnapshotId: 101,
      recommendations: [
        recommendation({
          id: 'info.complete_data.v1',
          rule_id: 'fallback.complete_data',
          severity: 'info',
          category: 'general',
          priority: 72,
          title: 'Complete your data',
          message: 'Add your sleep hours and weekly activity.',
          recommendation_diet: '',
          recommendation_activity: '',
          recommendation_behavior: '',
        }),
      ],
    });

    expect(plan.primaryActions.map(action => action.title)).toEqual([
      'Hydrate before/during/after activity',
      'Build to 150 min/week',
      'Use timing around cleaner air/cooler hours',
    ]);
    expect(plan.primaryActions.map(action => action.contextLabel)).toEqual([
      'Low weekly activity',
      'Low weekly activity',
      'Low weekly activity',
    ]);
    expect(plan.primaryActions.map(action => action.purpose)).toEqual([
      'Balanced meals to support moderate exercise.',
      '(e.g., brisk walking, swimming); include pelvic-floor and light resistance work; avoid high-risk sports.',
      'Plan 30-min sessions 5 days/week.',
    ]);
    expect(
      Object.values(plan.additionalActions)
        .flat()
        .map(action => action.title),
    ).toEqual(['Drink water', 'Morning Walk', 'Cooking Smoke']);
    expect(plan.optionalSupportRecommendations).toHaveLength(1);
    expect(plan.optionalSupportRecommendations[0]).toMatchObject({
      title: 'Complete your data',
      message: 'Add your sleep hours and weekly activity.',
    });
    expect(
      [
        ...plan.primaryActions,
        ...Object.values(plan.additionalActions).flat(),
      ].some(action => action.domain === 'service'),
    ).toBe(false);
  });

  it('keeps four highest-priority personalized actions in Today and moves remaining backend actions to More', () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-11',
        timezone: 'UTC',
        primary_actions: [
          {
            id: 'water',
            domain: 'nutrition',
            title: 'Drink water',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [],
        support_actions: [],
      },
      localActionCompletions: {},
      recommendationSnapshotId: 102,
      recommendations: [
        recommendation({ id: 'alert.pm25.v1', priority: 20 }),
        recommendation({
          id: 'sleep.support.v1',
          rule_id: 'sleep.support.daily',
          title: 'Sleep support',
          priority: 30,
          recommendation_diet: 'Choose a light evening snack.',
          recommendation_activity: '',
          recommendation_behavior: '',
          recommendation_mental: 'Take five slow breaths before sleep.',
        }),
      ],
    });

    expect(plan.primaryActions).toHaveLength(4);
    expect(
      plan.primaryActions.every(
        action => action.source === 'apiRecommendation',
      ),
    ).toBe(true);
    expect(plan.additionalActions.wellbeing).toHaveLength(1);
    expect(plan.additionalActions.wellbeing[0]).toMatchObject({
      source: 'apiRecommendation',
      title: 'Take five slow breaths before sleep.',
    });
    expect(
      plan.primaryActions.some(action => action.title === 'Drink water'),
    ).toBe(false);
    expect(plan.additionalActions.diet).toEqual([
      expect.objectContaining({
        source: 'apiDailyPlan',
        title: 'Drink water',
      }),
    ]);
  });

  it('keeps completion connected when a basic Daily Plan action moves to More', async () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-11',
        timezone: 'UTC',
        primary_actions: [
          {
            id: 'water',
            domain: 'nutrition',
            title: 'Drink water',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [],
        support_actions: [],
      },
      localActionCompletions: {},
      recommendationSnapshotId: 103,
      recommendations: [recommendation({ id: 'alert.pm25.v1' })],
    });
    const action = plan.additionalActions.diet[0];

    const result = await updateDailyPlanActionState(
      { backendUserId: '7' },
      plan,
      action.key,
      'completed',
    );

    expect(DailyPlanService.updateActionCompletion).toHaveBeenCalledWith(
      'water',
      'completed',
    );
    expect(result.experience.additionalActions.diet[0]).toMatchObject({
      state: 'completed',
      completed: true,
    });
  });

  it('saves backend task completion before showing a task as completed', async () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const hydration = plan.primaryActions[0];
    const result = await updateDailyPlanActionCompletion(
      { backendUserId: '7' },
      plan,
      hydration.key,
      true,
    );

    expect(TaskCompletionService.saveCompleted).toHaveBeenCalledWith(
      BASE_INPUT.date,
      ['drink_water'],
    );
    expect(result.experience.primaryActions[0].completed).toBe(true);
    expect(
      jest.requireMock('../../src/store/useRecommendationExperienceStore')
        .__testState.setActionState,
    ).toHaveBeenCalledWith(BASE_INPUT.date, hydration.key, 'completed', {
      domain: hydration.domain,
      kind: 'primary',
    });
  });

  it('does not mark a backend task complete when the completion API fails', async () => {
    (TaskCompletionService.saveCompleted as jest.Mock).mockRejectedValueOnce(
      new Error('network'),
    );
    const plan = composeDailyPlan(BASE_INPUT);

    await expect(
      updateDailyPlanActionCompletion(
        { backendUserId: '7' },
        plan,
        plan.primaryActions[0].key,
        true,
      ),
    ).rejects.toThrow('network');
    expect(
      jest.requireMock('../../src/store/useRecommendationExperienceStore')
        .__testState.setActionState,
    ).not.toHaveBeenCalled();
  });

  it('keeps planned reminders local without reporting task completion', async () => {
    const plan = composeDailyPlan(BASE_INPUT);
    const action = plan.primaryActions[2];
    const result = await updateDailyPlanActionState(
      { backendUserId: '7' },
      plan,
      action.key,
      'planned',
    );

    expect(TaskCompletionService.saveCompleted).not.toHaveBeenCalled();
    expect(
      result.experience.primaryActions.find(item => item.key === action.key)
        ?.state,
    ).toBe('planned');
  });

  it('persists Advice action completion through recommendation-completion', async () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-10',
        timezone: 'Europe/Prague',
        primary_actions: [],
        additional_actions: [],
        support_actions: [],
      },
      localActionCompletions: {},
      recommendationSnapshotId: 84,
      recommendations: [recommendation({ id: 'alert.pm25.v1' })],
    });
    const action = plan.primaryActions[0];

    const result = await updateDailyPlanActionState(
      { backendUserId: '7' },
      plan,
      action.key,
      'completed',
    );

    expect(RecommendationCompletionService.markDone).toHaveBeenCalledWith({
      snapshot_id: 84,
      rule_id: 'alert.pm25.daily',
      rule_version: 1,
      dimension: 'diet',
      status: 'done',
    });
    expect(DailyPlanService.updateActionCompletion).not.toHaveBeenCalled();
    expect(result.experience.primaryActions[0]).toMatchObject({
      state: 'completed',
      completed: true,
    });
  });

  it('persists mental Daily Plan API action completion through the backend completion API', async () => {
    const plan = composeBackendDailyPlan({
      plan: {
        date: '2026-09-05',
        timezone: 'Europe/Prague',
        primary_actions: [
          {
            id: 'breathing',
            domain: 'mental',
            title: 'Breathing pause',
            completion_state: 'not_done',
          },
        ],
        additional_actions: [],
        support_actions: [],
      },
      localActionCompletions: {},
    });
    const mentalAction = plan.primaryActions[0];

    const result = await updateDailyPlanActionState(
      { backendUserId: '7' },
      plan,
      mentalAction.key,
      'completed',
    );

    expect(DailyPlanService.updateActionCompletion).toHaveBeenCalledWith(
      'breathing',
      'completed',
    );
    expect(TaskCompletionService.saveCompleted).not.toHaveBeenCalled();
    expect(
      jest.requireMock('../../src/store/useRecommendationExperienceStore')
        .__testState.setActionState,
    ).toHaveBeenCalledWith('2026-09-05', mentalAction.key, 'completed', {
      domain: 'wellbeing',
      kind: 'primary',
    });
    expect(result.experience.primaryActions[0]).toMatchObject({
      state: 'completed',
      completed: true,
      backendCompletionState: 'completed',
    });
  });
});
