import type {
  FetalSystemProgress,
  WeeklySummaryNextWeek,
} from '../../types/recommendationExperience';

interface DevelopmentWeek {
  description: string;
  circleIcons?: Array<{
    iconPath?: string;
    percentage?: number;
  }>;
}

const normalizeSystem = (
  item: NonNullable<DevelopmentWeek['circleIcons']>[number],
): FetalSystemProgress | null =>
  item.iconPath
    ? {
        iconPath: item.iconPath,
        percentage: Math.min(
          100,
          Math.max(0, item.percentage ?? 0),
        ),
      }
    : null;

export const getRelevantFetalSystems = (
  weeks: DevelopmentWeek[],
  pregnancyWeek: number,
): FetalSystemProgress[] =>
  (weeks[Math.max(0, pregnancyWeek - 1)]?.circleIcons ?? [])
    .map(normalizeSystem)
    .filter(
      (item): item is FetalSystemProgress => item !== null,
    );

export const getFetalSystemTimeline = (
  weeks: DevelopmentWeek[],
  pregnancyWeek: number,
): FetalSystemProgress[] => {
  const currentWeek = Math.max(
    1,
    Math.min(weeks.length, pregnancyWeek),
  );
  const latest = new Map<string, FetalSystemProgress>();

  weeks.slice(0, currentWeek).forEach(week => {
    (week.circleIcons ?? []).forEach(item => {
      const normalized = normalizeSystem(item);
      if (normalized) latest.set(normalized.iconPath, normalized);
    });
  });

  weeks.slice(currentWeek).forEach((week, futureIndex) => {
    (week.circleIcons ?? []).forEach(item => {
      if (!item.iconPath || latest.has(item.iconPath)) return;
      latest.set(item.iconPath, {
        iconPath: item.iconPath,
        percentage: 0,
        startsInWeeks: futureIndex + 1,
      });
    });
  });

  return [...latest.values()];
};

export const getNextWeekPreview = (
  weeks: DevelopmentWeek[],
  pregnancyWeek: number,
): WeeklySummaryNextWeek | null => {
  const nextWeek = pregnancyWeek + 1;
  const data = weeks[nextWeek - 1];
  if (!data) return null;

  return {
    week: nextWeek,
    preview: data.description,
    systems: getRelevantFetalSystems(weeks, nextWeek),
  };
};

