import i18n from '../i18n';
import type { ActionReminderRecord } from '../types/recommendationExperience';

export interface ReminderDelay {
  totalMinutes: number;
  days: number;
  hours: number;
  minutes: number;
}

export type ActionReminderUiState = 'active' | 'expired' | 'inactive';

export const getActionReminderUiState = (
  reminder: ActionReminderRecord | undefined,
  now = Date.now(),
): ActionReminderUiState => {
  if (!reminder || reminder.status !== 'scheduled') return 'inactive';
  const scheduledAt = new Date(reminder.scheduledFor).getTime();
  if (!Number.isFinite(scheduledAt)) return 'inactive';
  return scheduledAt > now ? 'active' : 'expired';
};

export const getSuggestedReminderTime = (
  now = Date.now(),
): { hour: number; minute: number } => {
  const suggested = new Date(now + 60 * 60 * 1000);
  suggested.setMinutes(Math.ceil(suggested.getMinutes() / 5) * 5, 0, 0);
  return {
    hour: suggested.getHours(),
    minute: suggested.getMinutes(),
  };
};

export const getReminderDelay = (
  scheduledFor: string,
  now = Date.now(),
): ReminderDelay => {
  const scheduledAt = new Date(scheduledFor).getTime();
  const totalMinutes = Math.max(
    1,
    Math.ceil((scheduledAt - now) / (60 * 1000)),
  );
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { totalMinutes, days, hours, minutes };
};

export const formatReminderConfirmation = (
  scheduledFor: string,
  time: string,
  now = Date.now(),
): string => {
  const delay = getReminderDelay(scheduledFor, now);
  let relativeTime: string;

  if (delay.days > 0) {
    relativeTime = String(
      i18n.t('today.reminder_delay_days_hours_minutes', {
        count: delay.days,
        days: delay.days,
        hours: delay.hours,
        minutes: delay.minutes,
      }),
    );
  } else if (delay.hours > 0 && delay.minutes > 0) {
    relativeTime = String(
      i18n.t('today.reminder_delay_hours_minutes', {
        hours: delay.hours,
        minutes: delay.minutes,
      }),
    );
  } else if (delay.hours > 0) {
    relativeTime = String(
      i18n.t('today.reminder_delay_hours', { count: delay.hours }),
    );
  } else {
    relativeTime = String(
      i18n.t('today.reminder_delay_minutes', { count: delay.minutes }),
    );
  }

  return String(
    i18n.t('today.reminder_set_relative', {
      delay: relativeTime,
      time,
    }),
  );
};
