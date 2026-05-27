import notifee, {
  TriggerType,
  AndroidImportance,
  TimestampTrigger,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { useUserStore } from '../../store/useUserStore';
import { SummaryService } from '../api/SummaryService';
import { WEEK_DESCRIPTIONS } from '../../data/weekDescriptions';
import { appLogger } from '../logger/AppLogger';

const CHANNEL_ID = 'daily_recommendations';
const NOTIFICATION_GROUP = 'mamaair_daily';

// Notification IDs prefixed so we can cancel them by pattern
const NOTIF_ID_PREFIX = 'daily_rec_';

interface ScheduledContent {
  title: string;
  body: string;
}

/**
 * Generates notification content based on available data.
 * Tries summary recommendations first, falls back to week description.
 */
async function getNotificationContent(pregnancyWeek: number | null): Promise<ScheduledContent> {
  // Try to fetch fresh recommendations from backend
  try {
    const summary = await SummaryService.getSummary();
    if (summary.recommendations && Array.isArray(summary.recommendations) && summary.recommendations.length > 0) {
      // Pick a random recommendation
      const rec = summary.recommendations[Math.floor(Math.random() * summary.recommendations.length)];
      const body = typeof rec === 'string' ? rec : (rec.text || rec.message || rec.description || JSON.stringify(rec));
      return {
        title: `Week ${summary.week_info?.week || pregnancyWeek || '?'} — Today's Tip`,
        body,
      };
    }
  } catch (err: any) {
    appLogger.warn('NotifScheduler', `Failed to fetch recommendations: ${err?.message}`);
  }

  // Fallback: use local week description
  const week = pregnancyWeek || 19;
  const description = WEEK_DESCRIPTIONS[week] || WEEK_DESCRIPTIONS[19];
  return {
    title: `Week ${week} — Your Baby's Development`,
    body: description,
  };
}

/**
 * Ensures the notification channel exists (Android only).
 */
async function ensureChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Daily Recommendations',
      description: 'Daily health tips and task reminders for your pregnancy',
      importance: AndroidImportance.HIGH,
    });
  }
}

/**
 * Cancels all previously scheduled daily recommendation notifications.
 */
async function cancelAllScheduled() {
  const triggerIds = await notifee.getTriggerNotificationIds();
  const dailyIds = triggerIds.filter(id => id.startsWith(NOTIF_ID_PREFIX));
  for (const id of dailyIds) {
    await notifee.cancelTriggerNotification(id);
  }
  appLogger.info('NotifScheduler', `Cancelled ${dailyIds.length} scheduled notifications`);
}

/**
 * Picks a random time (minute-level) within the [fromH:fromM, toH:toM] window.
 */
function randomTimeInWindow(
  fromH: number, fromM: number,
  toH: number, toM: number,
): { hour: number; minute: number } {
  const fromTotal = fromH * 60 + fromM;
  const toTotal = toH * 60 + toM;
  if (toTotal <= fromTotal) {
    return { hour: fromH, minute: fromM };
  }
  const randomMinute = fromTotal + Math.floor(Math.random() * (toTotal - fromTotal));
  return {
    hour: Math.floor(randomMinute / 60),
    minute: randomMinute % 60,
  };
}

/**
 * Main entry point: schedule notifications for the next 7 days
 * based on user's preferred time window and active days.
 */
export async function scheduleNotifications() {
  try {
    const profile = useUserStore.getState().profile;

    const fromH = profile.notifTimeFromHour ?? 9;
    const fromM = profile.notifTimeFromMinute ?? 0;
    const toH = profile.notifTimeToHour ?? 21;
    const toM = profile.notifTimeToMinute ?? 0;
    const days = profile.notifDays || '1111111'; // Sun=0 .. Sat=6

    await ensureChannel();
    await cancelAllScheduled();

    // Get content for notifications
    const content = await getNotificationContent(profile.pregnancyWeek);

    const now = new Date();
    let scheduled = 0;

    // Schedule for next 7 days
    for (let offset = 0; offset < 7; offset++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + offset);

      const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat
      if (days[dayOfWeek] !== '1') {
        continue; // User disabled this day
      }

      const { hour, minute } = randomTimeInWindow(fromH, fromM, toH, toM);
      targetDate.setHours(hour, minute, 0, 0);

      // Skip if this time is already in the past
      if (targetDate.getTime() <= now.getTime()) {
        continue;
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: targetDate.getTime(),
      };

      const notifId = `${NOTIF_ID_PREFIX}${offset}`;

      // Per-iteration try/catch — one OEM (e.g. MIUI 14 without SCHEDULE_EXACT_ALARM)
      // throwing on createTriggerNotification must NOT abort the remaining 6 days.
      // We omit `trigger.alarmManager` entirely so notifee uses inexact alarms by
      // default, which don't require the SCHEDULE_EXACT_ALARM permission on Android 12+.
      try {
        appLogger.info('NotifScheduler', `Scheduling #${offset} (id=${notifId})`);
        await notifee.createTriggerNotification(
          {
            id: notifId,
            title: content.title,
            body: content.body,
            android: {
              channelId: CHANNEL_ID,
              smallIcon: 'ic_launcher',
              pressAction: { id: 'default' },
              importance: AndroidImportance.HIGH,
            },
            ios: {
              sound: 'default',
            },
          },
          trigger,
        );

        scheduled++;
        appLogger.info(
          'NotifScheduler',
          `Scheduled #${offset} for ${targetDate.toLocaleDateString()} ${hour}:${String(minute).padStart(2, '0')}`,
        );
      } catch (err: any) {
        appLogger.warn('NotifScheduler', `createTriggerNotification #${offset} failed: ${err?.message || err}`);
      }
    }

    appLogger.info('NotifScheduler', `Total scheduled: ${scheduled} notifications`);
  } catch (err: any) {
    appLogger.error('NotifScheduler', `scheduleNotifications failed: ${err?.message}`);
  }
}

/**
 * Call this when notification settings change to reschedule immediately.
 */
export async function rescheduleNotifications() {
  appLogger.info('NotifScheduler', 'Rescheduling notifications due to settings change');
  await scheduleNotifications();
}
