import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import type { TimestampTrigger } from '@notifee/react-native';

const CHANNEL_ID = 'mamaair_reminders';
// One trigger notification per day-of-week slot (Sun=0 ... Sat=6)
const REMINDER_IDS = ['r_sun', 'r_mon', 'r_tue', 'r_wed', 'r_thu', 'r_fri', 'r_sat'];

async function createChannel(): Promise<string> {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Health Reminders',
    importance: AndroidImportance.HIGH,
  });
}

async function hasPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
}

/**
 * Cancel and re-schedule weekly reminder notifications based on user settings.
 * days: 7-char string "1111111" — index 0=Sun, 1=Mon, ..., 6=Sat
 * Notification fires at fromHour:fromMinute on each enabled day, repeating weekly.
 */
export async function scheduleReminders(
  fromHour: number,
  fromMinute: number,
  days: string,
): Promise<void> {
  if (!(await hasPermission())) return;

  await cancelReminders();
  const channelId = await createChannel();
  const now = new Date();

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    if (days[dayIndex] !== '1') continue;

    const fireDate = new Date();
    fireDate.setHours(fromHour, fromMinute, 0, 0);

    const todayDay = now.getDay(); // 0=Sun ... 6=Sat
    let daysUntil = (dayIndex - todayDay + 7) % 7;
    // If today matches but time already passed, push to next week
    if (daysUntil === 0 && fireDate.getTime() <= now.getTime()) daysUntil = 7;
    fireDate.setDate(now.getDate() + daysUntil);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fireDate.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
    };

    await notifee.createTriggerNotification(
      {
        id: REMINDER_IDS[dayIndex],
        title: 'Mama Air 💚',
        body: 'Check your air quality and daily health tasks to stay protected.',
        android: { channelId, importance: AndroidImportance.HIGH },
        ios: { sound: 'default' },
      },
      trigger,
    );
  }
}

export async function cancelReminders(): Promise<void> {
  await Promise.all(
    REMINDER_IDS.map(id => notifee.cancelTriggerNotification(id).catch(() => {})),
  );
}
