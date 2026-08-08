import {
  FOCUS_BOOST_DURATION_MINUTES,
  WEEKLY_BADGE_PARTICIPATION_DAYS,
} from '../../config/recommendationExperience';
import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type {
  FocusBoostRecord,
  PregnancyProgression,
  RecommendationExperienceIdentity,
  StreakProgress,
  WeeklyBadge,
  WeeklyCheckpointRecord,
  WeeklySummaryExperience,
} from '../../types/recommendationExperience';
import { formatLocalDate } from '../../utils/dateUtils';
import { ProductAnalytics } from './ProductAnalytics';

const atMidnight = (date: string): Date =>
  new Date(`${date}T00:00:00`);

const addDays = (date: string, amount: number): string => {
  const next = atMidnight(date);
  next.setDate(next.getDate() + amount);
  return formatLocalDate(next);
};

export const getWeekKey = (date: string): string => {
  const value = atMidnight(date);
  const mondayOffset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - mondayOffset);
  return formatLocalDate(value);
};

export const resolvePregnancyProgression = (
  rawWeek: number,
): PregnancyProgression => {
  const pregnancyWeek = Math.min(40, Math.max(1, rawWeek));
  const trimester: 1 | 2 | 3 =
    pregnancyWeek <= 13 ? 1 : pregnancyWeek <= 27 ? 2 : 3;
  return {
    pregnancyWeek,
    trimester,
    chapterLabel: `Trimester ${trimester}`,
    journeyPercent: Math.round((pregnancyWeek / 40) * 100),
    completed: pregnancyWeek >= 40,
  };
};

export const getWeeklyBadges = (
  summary: WeeklySummaryExperience,
): WeeklyBadge[] =>
  (['diet', 'activity', 'behaviour'] as const).map(domain => ({
    domain,
    participationDays: summary.domainParticipation[domain],
    earned:
      summary.domainParticipation[domain] >=
      WEEKLY_BADGE_PARTICIPATION_DAYS,
  }));

const hasMeaningfulCompletion = (
  date: string,
  state: ReturnType<
    typeof useRecommendationExperienceStore.getState
  >,
): boolean => {
  const records = Object.values(state.actionCompletions[date] ?? {});
  if (
    records.some(
      record =>
        record.kind === 'primary' &&
        (record.completed || record.state === 'completed'),
    )
  ) {
    return true;
  }
  return (state.presentationDays[date]?.primaryCompleted ?? 0) > 0;
};

export const getPersistentStreak = (
  identity: RecommendationExperienceIdentity,
  today: string,
  allowFreeze = true,
): StreakProgress => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  const current = useRecommendationExperienceStore.getState();
  const weekKey = getWeekKey(today);
  let freeze = current.getStreakFreeze(weekKey);
  let cursor = today;
  let started = false;
  let days = 0;

  for (let offset = 0; offset < 60; offset += 1) {
    const completed = hasMeaningfulCompletion(cursor, current);
    if (completed) {
      started = true;
      days += 1;
      cursor = addDays(cursor, -1);
      continue;
    }

    if (!started && cursor === today) {
      cursor = addDays(cursor, -1);
      continue;
    }

    const eligibleForFreeze =
      started &&
      getWeekKey(cursor) === weekKey &&
      (freeze?.protectedDate === cursor ||
        (allowFreeze && !freeze));
    if (eligibleForFreeze) {
      if (!freeze) {
        freeze = {
          weekKey,
          protectedDate: cursor,
          usedAt: new Date().toISOString(),
        };
        current.saveStreakFreeze(freeze);
        ProductAnalytics.track(
          identity,
          'streak_freeze_used',
          { weekKey },
        );
      }
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }

  return {
    days,
    freezeAvailable: !freeze,
    freezeUsed: Boolean(freeze),
    protectedDate: freeze?.protectedDate,
  };
};

export const startFocusBoost = (
  identity: RecommendationExperienceIdentity,
  date: string,
): FocusBoostRecord => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  const startedAt = new Date();
  const endsAt = new Date(
    startedAt.getTime() +
      FOCUS_BOOST_DURATION_MINUTES * 60 * 1000,
  );
  const record: FocusBoostRecord = {
    date,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
  useRecommendationExperienceStore
    .getState()
    .saveFocusBoost(record);
  ProductAnalytics.track(identity, 'focus_boost_start', {
    durationMinutes: FOCUS_BOOST_DURATION_MINUTES,
  });
  return record;
};

export const resolveFocusBoost = (
  identity: RecommendationExperienceIdentity,
  date: string,
): FocusBoostRecord | null => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  const record =
    useRecommendationExperienceStore.getState().getFocusBoost(date);
  if (!record || record.completedAt) return record;
  if (new Date(record.endsAt).getTime() > Date.now()) return record;

  const completed = {
    ...record,
    completedAt: new Date().toISOString(),
  };
  useRecommendationExperienceStore
    .getState()
    .saveFocusBoost(completed);
  ProductAnalytics.track(identity, 'focus_boost_complete', {
    durationMinutes: FOCUS_BOOST_DURATION_MINUTES,
  });
  return completed;
};

export const ensureWeeklyCheckpoint = (
  identity: RecommendationExperienceIdentity,
  summary: WeeklySummaryExperience,
  reached: boolean,
): WeeklyCheckpointRecord | null => {
  if (!reached || summary.primaryCompleted < 1) return null;
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);
  const weekKey = getWeekKey(summary.endDate);
  const existing =
    useRecommendationExperienceStore
      .getState()
      .getWeeklyCheckpoint(weekKey);
  if (existing) return existing;

  const record: WeeklyCheckpointRecord = {
    weekKey,
    pregnancyWeek: summary.week,
    reachedAt: new Date().toISOString(),
  };
  useRecommendationExperienceStore
    .getState()
    .saveWeeklyCheckpoint(record);
  ProductAnalytics.track(identity, 'week_checkpoint_reached', {
    pregnancyWeek: summary.week,
  });
  return record;
};
