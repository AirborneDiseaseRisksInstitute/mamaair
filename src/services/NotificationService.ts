import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { createMMKV } from 'react-native-mmkv';
import { useUserStore } from '../store/useUserStore';

const CHANNEL_ID = 'mamaair_reminders';
const PENDING_ACTION_REMINDER_KEY = 'pending-action-reminder';
const notificationNavigationStorage = createMMKV({
  id: 'mamaair-notification-navigation',
});
// One trigger notification per day-of-week slot (Sun=0 ... Sat=6)
const REMINDER_IDS = ['r_sun', 'r_mon', 'r_tue', 'r_wed', 'r_thu', 'r_fri', 'r_sat'];
const CARE_CADENCE_PREFIX = 'care_';
const REST_TIMER_PREFIX = 'rest_';

export type ActionReminderScheduleStatus =
  | 'scheduled'
  | 'permissionDenied'
  | 'failed';

export interface ActionReminderPressPayload {
  date: string;
  actionKey: string;
}

const actionReminderPayload = (
  data: Record<string, unknown> | undefined,
): ActionReminderPressPayload | null => {
  const date = data?.date;
  const actionKey = data?.actionKey;
  return data?.kind === 'actionReminder' &&
    typeof date === 'string' &&
    typeof actionKey === 'string'
    ? { date, actionKey }
    : null;
};

const rememberActionReminderPress = (
  payload: ActionReminderPressPayload,
): void => {
  notificationNavigationStorage.set(
    PENDING_ACTION_REMINDER_KEY,
    JSON.stringify(payload),
  );
};

export const consumePendingActionReminderPress =
  (): ActionReminderPressPayload | null => {
    const storedValue = notificationNavigationStorage.getString(
      PENDING_ACTION_REMINDER_KEY,
    );
    if (!storedValue) return null;

    notificationNavigationStorage.remove(PENDING_ACTION_REMINDER_KEY);
    try {
      const storedPayload = JSON.parse(storedValue) as Record<string, unknown>;
      return actionReminderPayload({
        kind: 'actionReminder',
        date: storedPayload.date,
        actionKey: storedPayload.actionKey,
      });
    } catch {
      return null;
    }
  };

export const registerActionReminderBackgroundHandler = (): void => {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS) return;
    const payload = actionReminderPayload(
      detail.notification?.data as
        | Record<string, unknown>
        | undefined,
    );
    if (payload) rememberActionReminderPress(payload);
  });
};

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

const stableHash = (value: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    // FNV-1a keeps reminder IDs stable across app launches and releases.
    // eslint-disable-next-line no-bitwise
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  // eslint-disable-next-line no-bitwise
  return Math.abs(hash >>> 0).toString(36);
};

export const actionReminderId = (
  date: string,
  actionKey: string,
): string => `action_${date.replace(/-/g, '')}_${stableHash(actionKey)}`;

const requestReminderPermission = async (): Promise<boolean> => {
  if (await hasPermission()) return true;
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
};

const minutesOfDay = (hour: number, minute: number): number =>
  hour * 60 + minute;

const clampToNotificationWindow = (
  hour: number,
  minute: number,
): { hour: number; minute: number } => {
  const profile = useUserStore.getState().profile;
  const from = minutesOfDay(
    profile.notifTimeFromHour ?? 9,
    profile.notifTimeFromMinute ?? 0,
  );
  const to = minutesOfDay(
    profile.notifTimeToHour ?? 21,
    profile.notifTimeToMinute ?? 0,
  );
  const requested = minutesOfDay(hour, minute);
  if (requested >= from && requested <= to) {
    return { hour, minute };
  }
  return {
    hour: Math.floor(from / 60),
    minute: from % 60,
  };
};

export async function scheduleActionReminder({
  date,
  actionKey,
  title,
  hour,
  minute,
}: {
  date: string;
  actionKey: string;
  title: string;
  hour: number;
  minute: number;
}): Promise<{
  status: ActionReminderScheduleStatus;
  notificationId: string;
  scheduledFor: string;
}> {
  const notificationId = actionReminderId(date, actionKey);
  const allowedTime = clampToNotificationWindow(hour, minute);
  const fireDate = new Date(`${date}T00:00:00`);
  fireDate.setHours(
    allowedTime.hour,
    allowedTime.minute,
    0,
    0,
  );
  if (fireDate.getTime() <= Date.now()) {
    fireDate.setDate(fireDate.getDate() + 1);
  }

  try {
    if (!(await requestReminderPermission())) {
      return {
        status: 'permissionDenied',
        notificationId,
        scheduledFor: fireDate.toISOString(),
      };
    }

    const channelId = await createChannel();
    await notifee.cancelTriggerNotification(notificationId).catch(() => {});
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: 'MamaAir',
        body: title,
        data: {
          kind: 'actionReminder',
          date,
          actionKey,
        },
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: fireDate.getTime(),
      },
    );
    return {
      status: 'scheduled',
      notificationId,
      scheduledFor: fireDate.toISOString(),
    };
  } catch {
    return {
      status: 'failed',
      notificationId,
      scheduledFor: fireDate.toISOString(),
    };
  }
}

export const getInitialActionReminderPress =
  async (): Promise<ActionReminderPressPayload | null> => {
    const initial = await notifee.getInitialNotification();
    const initialPayload = actionReminderPayload(
      initial?.notification.data as
        | Record<string, unknown>
        | undefined,
    );
    if (initialPayload) {
      consumePendingActionReminderPress();
      return initialPayload;
    }
    return consumePendingActionReminderPress();
  };

export const subscribeToActionReminderPress = (
  onPress: (payload: ActionReminderPressPayload) => void,
): (() => void) =>
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type !== EventType.PRESS) return;
    const payload = actionReminderPayload(
      detail.notification?.data as
        | Record<string, unknown>
        | undefined,
    );
    if (payload) onPress(payload);
  });

export async function cancelActionReminder(
  notificationId: string,
): Promise<void> {
  await notifee.cancelTriggerNotification(notificationId).catch(() => {});
}

export async function scheduleRestTimerNotification({
  date,
  actionKey,
  title,
  endsAt,
}: {
  date: string;
  actionKey: string;
  title: string;
  endsAt: string;
}): Promise<ActionReminderScheduleStatus> {
  if (!(await hasPermission())) return 'permissionDenied';
  const notificationId = `${REST_TIMER_PREFIX}${stableHash(
    `${date}:${actionKey}`,
  )}`;
  try {
    const channelId = await createChannel();
    await notifee
      .cancelTriggerNotification(notificationId)
      .catch(() => {});
    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: 'Your rest is complete',
        body: `${title} — take a moment before moving on.`,
        data: {
          kind: 'actionReminder',
          date,
          actionKey,
        },
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
        },
        ios: { sound: 'default' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: new Date(endsAt).getTime(),
      },
    );
    return 'scheduled';
  } catch {
    return 'failed';
  }
}

export async function cancelRestTimerNotification(
  date: string,
  actionKey: string,
): Promise<void> {
  await notifee
    .cancelTriggerNotification(
      `${REST_TIMER_PREFIX}${stableHash(`${date}:${actionKey}`)}`,
    )
    .catch(() => {});
}

export async function cancelEveningCareReminder(
  date: string,
): Promise<void> {
  await notifee
    .cancelTriggerNotification(
      `${CARE_CADENCE_PREFIX}evening_${date.replace(/-/g, '')}`,
    )
    .catch(() => {});
}

const cancelNotificationsWithPrefix = async (
  prefix: string,
): Promise<void> => {
  const ids = await notifee
    .getTriggerNotificationIds()
    .catch(() => [] as string[]);
  await Promise.all(
    ids
      .filter(id => id.startsWith(prefix))
      .map(id =>
        notifee.cancelTriggerNotification(id).catch(() => {}),
      ),
  );
};

export async function scheduleCareCadence({
  fromHour,
  fromMinute,
  toHour,
  toMinute,
  days,
}: {
  fromHour: number;
  fromMinute: number;
  toHour: number;
  toMinute: number;
  days: string;
}): Promise<void> {
  if (!(await hasPermission())) return;
  await cancelNotificationsWithPrefix(CARE_CADENCE_PREFIX);
  const channelId = await createChannel();
  const now = new Date();
  const from = minutesOfDay(fromHour, fromMinute);
  const to = minutesOfDay(toHour, toMinute);
  const evening = Math.max(from, to - 60);

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const dayIndex = date.getDay();
    if (days[dayIndex] !== '1') continue;
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');
    const schedules = [
      {
        id: `${CARE_CADENCE_PREFIX}checkin_${dateKey}`,
        at: from,
        body: 'A gentle check-in can help shape today’s plan.',
      },
      ...(to - from >= 120
        ? [
            {
              id: `${CARE_CADENCE_PREFIX}evening_${dateKey}`,
              at: evening,
              body: 'If it feels useful, one small action can keep your rhythm going.',
            },
          ]
        : []),
    ];

    for (const schedule of schedules) {
      const fireDate = new Date(date);
      fireDate.setHours(
        Math.floor(schedule.at / 60),
        schedule.at % 60,
        0,
        0,
      );
      if (fireDate.getTime() <= now.getTime()) continue;
      await notifee.createTriggerNotification(
        {
          id: schedule.id,
          title: 'MamaAir',
          body: schedule.body,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
          },
          ios: { sound: 'default' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: fireDate.getTime(),
        },
      );
    }
  }

  const recapDate = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  recapDate.setDate(now.getDate() + daysUntilSunday);
  recapDate.setHours(fromHour, fromMinute, 0, 0);
  await notifee.createTriggerNotification(
    {
      id: `${CARE_CADENCE_PREFIX}weekly_recap`,
      title: 'Your week is ready to review',
      body: 'Take a calm look at your care rhythm and baby’s week.',
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
      ios: { sound: 'default' },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: recapDate.getTime(),
      repeatFrequency: RepeatFrequency.WEEKLY,
    },
  );
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
  toHour = 21,
  toMinute = 0,
): Promise<void> {
  await cancelReminders();
  await scheduleCareCadence({
    fromHour,
    fromMinute,
    toHour,
    toMinute,
    days,
  });
}

export async function cancelReminders(): Promise<void> {
  await Promise.all(
    REMINDER_IDS.map(id => notifee.cancelTriggerNotification(id).catch(() => {})),
  );
  await cancelNotificationsWithPrefix(CARE_CADENCE_PREFIX);
}
