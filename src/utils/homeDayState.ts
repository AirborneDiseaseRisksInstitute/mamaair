import type { DailyActionDomain } from '../types/recommendationExperience';
import { formatLocalDate } from './dateUtils';

export type HomeCareIcon = 'heart' | 'basket' | 'running' | 'mental';

export const HOME_CARE_ICONS: readonly HomeCareIcon[] = [
  'heart',
  'basket',
  'running',
  'mental',
];

interface ResolveHomeDayStateParams {
  weekNumber: number;
  activeWeek: number;
  dayIndex: number;
  todayDayIndex: number;
  hasRecordedActivity: boolean;
}

interface HomeDayState {
  isActive: boolean;
  isStartDay: boolean;
  isMissed: boolean;
}

interface ResolveHomeActiveWeekParams {
  profileWeek: number | null;
  profileWeekConfirmed: boolean;
  apiWeek: number | null;
}

const clampPregnancyWeek = (week: number): number =>
  Math.max(1, Math.min(40, week));

export const getMondayBasedDayIndex = (date: Date): number => {
  const dayIndex = date.getDay();
  return dayIndex === 0 ? 6 : dayIndex - 1;
};

/**
 * Returns the local calendar dates shown by a pregnancy-week row on Home.
 * Keeping this calculation outside the screen makes midnight/week-boundary
 * behaviour deterministic and independently testable.
 */
export const getHomeWeekDateKeys = ({
  today,
  activeWeek,
  weekNumber,
}: {
  today: Date;
  activeWeek: number;
  weekNumber: number;
}): string[] => {
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  monday.setDate(
    monday.getDate() -
      getMondayBasedDayIndex(today) +
      (weekNumber - activeWeek) * 7,
  );

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    return formatLocalDate(date);
  });
};

/**
 * A week explicitly selected by the user is the source of truth. API data is
 * only a fallback while the local profile has no confirmed pregnancy week.
 */
export const resolveHomeActiveWeek = ({
  profileWeek,
  profileWeekConfirmed,
  apiWeek,
}: ResolveHomeActiveWeekParams): number =>
  clampPregnancyWeek(
    (profileWeekConfirmed ? profileWeek : apiWeek ?? profileWeek) ?? 1,
  );

export const resolveHomeDayState = ({
  weekNumber,
  activeWeek,
  dayIndex,
  todayDayIndex,
  hasRecordedActivity,
}: ResolveHomeDayStateParams): HomeDayState => {
  const isBeforeToday =
    weekNumber < activeWeek ||
    (weekNumber === activeWeek && dayIndex < todayDayIndex);
  const isStartDay = weekNumber === activeWeek && dayIndex === todayDayIndex;
  const isAfterToday =
    weekNumber > activeWeek ||
    (weekNumber === activeWeek && dayIndex > todayDayIndex);
  const isActive = !isAfterToday && hasRecordedActivity;

  return {
    isActive,
    isStartDay,
    isMissed: isBeforeToday && !isActive,
  };
};

export const resolveHomeCareIcons = (
  domains: readonly DailyActionDomain[],
): HomeCareIcon[] => {
  const icons: HomeCareIcon[] = [];

  if (domains.includes('behaviour')) icons.push('heart');
  if (domains.includes('diet')) icons.push('basket');
  if (domains.includes('activity')) icons.push('running');
  if (domains.includes('wellbeing')) icons.push('mental');

  return icons;
};
