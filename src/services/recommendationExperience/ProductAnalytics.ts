import { createMMKV } from 'react-native-mmkv';
import type {
  AnalyticsEventName,
  ProductAnalyticsEvent,
  RecommendationExperienceIdentity,
} from '../../types/recommendationExperience';
import { resolveOwnerNamespace } from './ownership';

const analyticsStorage = createMMKV({
  id: 'mamaair-product-analytics',
});
const MAX_QUEUED_EVENTS = 250;

const ALLOWED_PROPERTIES: Record<
  AnalyticsEventName,
  readonly string[]
> = {
  application_session_start: ['pregnancyWeek', 'trimester'],
  daily_flow_start: ['source'],
  daily_flow_complete: ['durationSeconds'],
  session_duration: ['durationSeconds'],
  feeling_checkin_complete: [
    'hasSymptoms',
    'moodCount',
    'feelingCount',
  ],
  task_complete: ['kind', 'domain'],
  domain_participation: ['domain', 'completedCount'],
  streak_progress: ['days', 'freezeAvailable'],
  streak_freeze_used: ['weekKey'],
  focus_boost_start: ['durationMinutes'],
  focus_boost_complete: ['durationMinutes'],
  week_checkpoint_reached: ['pregnancyWeek'],
  weekly_report_opened: ['pregnancyWeek', 'mode'],
  share_preview_opened: ['pregnancyWeek'],
  share_initiated: ['pregnancyWeek'],
  share_completed: ['pregnancyWeek'],
  review_mode_opened: ['pregnancyWeek'],
  pregnancy_chapter_progression: ['pregnancyWeek', 'trimester'],
};

let eventCounter = 0;

const queueKey = (
  identity: RecommendationExperienceIdentity,
): string => `queue:${resolveOwnerNamespace(identity).key}`;

const sanitizeProperties = (
  name: AnalyticsEventName,
  properties: Record<string, unknown>,
): ProductAnalyticsEvent['properties'] => {
  const allowed = new Set(ALLOWED_PROPERTIES[name]);
  return Object.entries(properties).reduce(
    (safe, [key, value]) => {
      if (
        allowed.has(key) &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === null)
      ) {
        safe[key] = value;
      }
      return safe;
    },
    {} as ProductAnalyticsEvent['properties'],
  );
};

const readQueue = (
  identity: RecommendationExperienceIdentity,
): ProductAnalyticsEvent[] => {
  const raw = analyticsStorage.getString(queueKey(identity));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as ProductAnalyticsEvent[])
      : [];
  } catch {
    return [];
  }
};

export const ProductAnalytics = {
  track: (
    identity: RecommendationExperienceIdentity,
    name: AnalyticsEventName,
    properties: Record<string, unknown> = {},
  ): ProductAnalyticsEvent => {
    const occurredAt = new Date().toISOString();
    eventCounter += 1;
    const event: ProductAnalyticsEvent = {
      id: `${occurredAt}:${eventCounter}`,
      name,
      occurredAt,
      properties: sanitizeProperties(name, properties),
    };
    const queue = [...readQueue(identity), event].slice(
      -MAX_QUEUED_EVENTS,
    );
    analyticsStorage.set(queueKey(identity), JSON.stringify(queue));
    return event;
  },
  getPending: (
    identity: RecommendationExperienceIdentity,
  ): ProductAnalyticsEvent[] => readQueue(identity),
  clearPending: (
    identity: RecommendationExperienceIdentity,
  ): void => {
    analyticsStorage.remove(queueKey(identity));
  },
};
