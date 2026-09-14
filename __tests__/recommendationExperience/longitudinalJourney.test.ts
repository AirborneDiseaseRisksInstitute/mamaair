import {
  isWeeklyCheckpointAvailable,
  resolveLongitudinalJourneyStep,
} from '../../src/services/recommendationExperience/LongitudinalJourneyRepository';
import type { DailyPlanExperience } from '../../src/types/recommendationExperience';

const plan = (completedKeys: string[] = []): DailyPlanExperience => ({
  date: '2026-07-26',
  backendCompletedTaskCodes: [],
  additionalActions: {
    diet: [],
    activity: [],
    behaviour: [],
    wellbeing: [],
    service: [],
  },
  supportActions: [],
  medicalAttention: [],
  importantGuidanceRecommendations: [],
  guidanceRecommendations: [],
  optionalSupportRecommendations: [],
  primaryActions: [
    {
      key: 'diet',
      domain: 'diet',
      title: 'Drink water',
      purpose: 'Stay hydrated',
      priority: 1,
      source: 'localFallback',
      state: completedKeys.includes('diet') ? 'completed' : 'pending',
      completed: completedKeys.includes('diet'),
    },
    {
      key: 'activity',
      domain: 'activity',
      title: 'Take a short rest',
      purpose: 'Pause',
      priority: 2,
      source: 'localFallback',
      state: completedKeys.includes('activity') ? 'completed' : 'pending',
      completed: completedKeys.includes('activity'),
    },
  ],
});

describe('longitudinal journey resolver', () => {
  it('starts with a check-in when neither API nor local state has one', () => {
    expect(
      resolveLongitudinalJourneyStep({
        hasSavedCheckIn: false,
        plan: plan(),
        reminders: {},
        restTimers: {},
        weeklyCheckpointAvailable: false,
      }),
    ).toEqual({ kind: 'checkIn' });
  });

  it('resumes a running timer before another unfinished action', () => {
    expect(
      resolveLongitudinalJourneyStep({
        hasSavedCheckIn: true,
        plan: plan(),
        reminders: {},
        restTimers: {
          activity: {
            actionKey: 'activity',
            date: '2026-07-26',
            durationSeconds: 600,
            startedAt: '2026-07-26T10:00:00.000Z',
            endsAt: '2026-07-26T10:10:00.000Z',
            status: 'running',
            updatedAt: '2026-07-26T10:00:00.000Z',
          },
        },
        weeklyCheckpointAvailable: false,
      }),
    ).toEqual({
      kind: 'action',
      actionKey: 'activity',
      reason: 'timer',
    });
  });

  it('uses the weekly checkpoint only after primary actions are done', () => {
    expect(
      resolveLongitudinalJourneyStep({
        hasSavedCheckIn: true,
        plan: plan(['diet', 'activity']),
        reminders: {},
        restTimers: {},
        weeklyCheckpointAvailable: true,
      }),
    ).toEqual({ kind: 'weeklySummary' });
  });

  it('recognizes Sunday as the weekly checkpoint without changing state', () => {
    expect(isWeeklyCheckpointAvailable('2026-07-26')).toBe(true);
    expect(isWeeklyCheckpointAvailable('2026-07-25')).toBe(false);
  });
});
