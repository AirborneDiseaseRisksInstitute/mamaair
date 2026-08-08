import type {
  ActionReminderRecord,
  DailyPlanExperience,
  LongitudinalJourneyStep,
  RestTimerRecord,
} from '../../types/recommendationExperience';

interface ResolveLongitudinalJourneyInput {
  hasSavedCheckIn: boolean;
  plan: DailyPlanExperience | null;
  reminders: Record<string, ActionReminderRecord>;
  restTimers: Record<string, RestTimerRecord>;
  weeklyCheckpointAvailable: boolean;
}

const reminderTime = (record?: ActionReminderRecord): number =>
  record ? new Date(record.scheduledFor).getTime() : Number.MAX_SAFE_INTEGER;

export const isWeeklyCheckpointAvailable = (
  date: string,
): boolean => new Date(`${date}T12:00:00`).getDay() === 0;

export const resolveLongitudinalJourneyStep = ({
  hasSavedCheckIn,
  plan,
  reminders,
  restTimers,
  weeklyCheckpointAvailable,
}: ResolveLongitudinalJourneyInput): LongitudinalJourneyStep => {
  if (!hasSavedCheckIn) {
    return { kind: 'checkIn' };
  }

  const unfinished = (plan?.primaryActions ?? []).filter(
    action => !action.completed,
  );
  if (unfinished.length > 0) {
    const timed = unfinished.find(action => {
      const timer = restTimers[action.key];
      return timer?.status === 'running' || timer?.status === 'ready';
    });
    if (timed) {
      return {
        kind: 'action',
        actionKey: timed.key,
        reason: 'timer',
      };
    }

    const reminded = [...unfinished]
      .filter(action => reminders[action.key])
      .sort(
        (left, right) =>
          reminderTime(reminders[left.key]) -
          reminderTime(reminders[right.key]),
      )[0];
    if (reminded) {
      return {
        kind: 'action',
        actionKey: reminded.key,
        reason: 'reminder',
      };
    }

    return {
      kind: 'action',
      actionKey: unfinished[0].key,
      reason: 'unfinished',
    };
  }

  if (weeklyCheckpointAvailable) {
    return { kind: 'weeklySummary' };
  }

  return { kind: 'dailyProgress' };
};

