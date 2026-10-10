import i18n from '../src/i18n';
import {
  formatReminderConfirmation,
  getActionReminderUiState,
  getReminderDelay,
  getSuggestedReminderTime,
} from '../src/utils/reminderTime';
import type { ActionReminderRecord } from '../src/types/recommendationExperience';

describe('reminder confirmation timing', () => {
  const now = new Date('2026-09-10T10:00:00.000Z').getTime();

  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('reports an exact one-hour delay', () => {
    expect(
      getReminderDelay('2026-09-10T11:00:00.000Z', now),
    ).toEqual({ totalMinutes: 60, days: 0, hours: 1, minutes: 0 });
    expect(
      formatReminderConfirmation(
        '2026-09-10T11:00:00.000Z',
        '11:00',
        now,
      ),
    ).toBe('Reminder set for 1 hour from now (at 11:00).');
  });

  it('keeps both hours and minutes for a mixed delay', () => {
    expect(
      getReminderDelay('2026-09-10T11:25:00.000Z', now),
    ).toEqual({ totalMinutes: 85, days: 0, hours: 1, minutes: 25 });
  });

  it('rounds up partial minutes so async work does not understate the delay', () => {
    expect(
      getReminderDelay('2026-09-10T10:01:01.000Z', now),
    ).toEqual({ totalMinutes: 2, days: 0, hours: 0, minutes: 2 });
  });

  it('stops presenting a passed reminder as active', () => {
    const reminder: ActionReminderRecord = {
      actionKey: 'drink-water',
      date: '2026-09-10',
      notificationId: 'action_20260910_water',
      hour: 11,
      minute: 0,
      scheduledFor: '2026-09-10T11:00:00.000Z',
      status: 'scheduled',
      updatedAt: '2026-09-10T10:00:00.000Z',
    };

    expect(getActionReminderUiState(reminder, now)).toBe('active');
    expect(
      getActionReminderUiState(
        reminder,
        new Date('2026-09-10T11:00:01.000Z').getTime(),
      ),
    ).toBe('expired');
  });

  it('suggests a rounded future time when reminding again', () => {
    expect(
      getSuggestedReminderTime(
        new Date(2026, 8, 10, 10, 3, 30).getTime(),
      ),
    ).toEqual({ hour: 11, minute: 5 });
  });
});
