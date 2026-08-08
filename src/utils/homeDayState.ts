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
