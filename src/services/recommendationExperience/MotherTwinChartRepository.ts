import type {
  DailyActionCompletionRecord,
  DailyActionDomain,
  EnvironmentalRiskObservation,
  EnvironmentalRiskReading,
  WeeklyActionSummaryDomain,
} from '../../types/recommendationExperience';
import type { SummaryResponse } from '../api/SummaryService';

export type CareCompletionSeries = Record<
  WeeklyActionSummaryDomain,
  { value: number }[]
>;

export type EnvironmentalRiskAudience = 'mother' | 'baby';

export interface EnvironmentalRiskTrendPoint {
  date: string;
  current: number;
  delta?: number;
}

export interface MotherTwinChartModel {
  careCompletion: CareCompletionSeries;
  hasCareCompletionData: boolean;
  environmentalRisk: Record<
    EnvironmentalRiskAudience,
    EnvironmentalRiskTrendPoint[]
  >;
  hasEnvironmentalRiskData: Record<EnvironmentalRiskAudience, boolean>;
}

const CARE_DOMAINS: WeeklyActionSummaryDomain[] = [
  'diet',
  'behaviour',
  'activity',
  'wellbeing',
];

const emptyCounts = (): Record<WeeklyActionSummaryDomain, number> => ({
  diet: 0,
  behaviour: 0,
  activity: 0,
  wellbeing: 0,
});

const isCompleted = (record: DailyActionCompletionRecord): boolean =>
  record.completed || record.state === 'completed';

const isWeeklyCareDomain = (
  domain: DailyActionDomain | undefined,
): domain is WeeklyActionSummaryDomain =>
  domain === 'diet' ||
  domain === 'behaviour' ||
  domain === 'activity' ||
  domain === 'wellbeing';

const inferDomainFromBackendTask = (
  task: string,
): WeeklyActionSummaryDomain | null => {
  const value = task.toLowerCase();
  if (
    value.includes('nutrition') ||
    value.includes('diet') ||
    value.includes('meal') ||
    value.includes('water') ||
    value.includes('hydrat')
  ) {
    return 'diet';
  }
  if (
    value.includes('protection') ||
    value.includes('behaviour') ||
    value.includes('behavior') ||
    value.includes('ventilat') ||
    value.includes('smoke') ||
    value.includes('mask') ||
    value.includes('pollution')
  ) {
    return 'behaviour';
  }
  if (
    value.includes('activity') ||
    value.includes('walk') ||
    value.includes('move') ||
    value.includes('stretch')
  ) {
    return 'activity';
  }
  if (
    value.includes('wellbeing') ||
    value.includes('mental') ||
    value.includes('mood') ||
    value.includes('breath') ||
    value.includes('sleep') ||
    value.includes('rest')
  ) {
    return 'wellbeing';
  }
  return null;
};

const validNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeRisk = (value: number): number =>
  Math.max(0, Math.round(value * 100) / 100);

const dailyLocalCareCounts = (
  records: Record<string, DailyActionCompletionRecord>,
): Record<WeeklyActionSummaryDomain, number> => {
  const counts = emptyCounts();
  Object.values(records).forEach(record => {
    if (!isCompleted(record) || record.kind === 'support') return;
    if (!isWeeklyCareDomain(record.domain)) return;
    counts[record.domain] += 1;
  });
  return counts;
};

const dailyBackendCareCounts = (
  taskDay: NonNullable<SummaryResponse['task_completions']>[number] | undefined,
): Record<WeeklyActionSummaryDomain, number> => {
  const counts = emptyCounts();
  if (taskDay?.counts) {
    counts.diet = Math.max(0, taskDay.counts.diet.done);
    counts.activity = Math.max(0, taskDay.counts.activity.done);
    counts.behaviour = Math.max(0, taskDay.counts.behavior.done);
    counts.wellbeing = Math.max(0, taskDay.counts.mental.done);
    return counts;
  }

  (taskDay?.tasks ?? []).forEach(task => {
    const domain = inferDomainFromBackendTask(task);
    if (domain) counts[domain] += 1;
  });
  return counts;
};

const apiRiskDelta = (
  summary: SummaryResponse | null,
  audience: EnvironmentalRiskAudience,
): number | null => {
  const value =
    audience === 'mother'
      ? summary?.risks_delta?.mom
      : summary?.risks_delta?.baby;
  return validNumber(value) ? value : null;
};

const apiCurrentRisk = (
  summary: SummaryResponse | null,
  audience: EnvironmentalRiskAudience,
): number | null => {
  const value =
    audience === 'mother'
      ? summary?.mom_exposure?.exposure_level
      : summary?.baby_exposure?.exposure_level;
  return validNumber(value) ? value : null;
};

const summaryObservationDate = (
  summary: SummaryResponse | null,
  fallbackDate: string,
): string => {
  const candidates = [
    summary?.snapshot_created_at,
    summary?.mom_exposure?.timestamp,
    summary?.baby_exposure?.timestamp,
  ];
  const timestamp = candidates.find(
    value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value),
  );
  return timestamp?.slice(0, 10) ?? fallbackDate;
};

const apiRiskReading = (
  summary: SummaryResponse | null,
  audience: EnvironmentalRiskAudience,
): EnvironmentalRiskReading | null => {
  const current = apiCurrentRisk(summary, audience);
  if (current === null) return null;

  const delta = apiRiskDelta(summary, audience);
  return {
    current: normalizeRisk(current),
    delta: delta === null ? undefined : Math.round(delta * 100) / 100,
  };
};

export const buildEnvironmentalRiskObservation = (
  summary: SummaryResponse | null,
  fallbackDate: string,
): EnvironmentalRiskObservation | null => {
  const mother = apiRiskReading(summary, 'mother');
  const baby = apiRiskReading(summary, 'baby');
  if (!mother && !baby) return null;

  return {
    date: summaryObservationDate(summary, fallbackDate),
    mother: mother ?? undefined,
    baby: baby ?? undefined,
    updatedAt: new Date().toISOString(),
  };
};

export const buildMotherTwinChartModel = ({
  weekDates,
  actionCompletions,
  backendSummary,
  currentDate,
}: {
  weekDates: string[];
  actionCompletions: Record<
    string,
    Record<string, DailyActionCompletionRecord>
  >;
  backendSummary: SummaryResponse | null;
  currentDate: string;
}): MotherTwinChartModel => {
  const backendTasksByDate = new Map(
    (backendSummary?.task_completions ?? []).map(item => [item.date, item]),
  );
  const currentObservation = buildEnvironmentalRiskObservation(
    backendSummary,
    currentDate,
  );
  const careCompletion = CARE_DOMAINS.reduce(
    (acc, domain) => ({
      ...acc,
      [domain]: [] as { value: number }[],
    }),
    {} as CareCompletionSeries,
  );
  const environmentalRisk: MotherTwinChartModel['environmentalRisk'] = {
    mother: [],
    baby: [],
  };
  const hasEnvironmentalRiskData = {
    mother: false,
    baby: false,
  };
  weekDates.forEach(date => {
    const records = actionCompletions[date] ?? {};
    const localCounts = dailyLocalCareCounts(records);
    const backendCounts = dailyBackendCareCounts(backendTasksByDate.get(date));
    const counts = CARE_DOMAINS.reduce(
      (merged, domain) => ({
        ...merged,
        [domain]: Math.max(localCounts[domain], backendCounts[domain]),
      }),
      emptyCounts(),
    );

    CARE_DOMAINS.forEach(domain => {
      careCompletion[domain].push({ value: counts[domain] });
    });
  });

  if (currentObservation) {
    (['mother', 'baby'] as const).forEach(audience => {
      const reading = currentObservation[audience];
      if (!reading) return;

      hasEnvironmentalRiskData[audience] = true;
      environmentalRisk[audience].push({
        date: currentObservation.date,
        current: reading.current,
        delta: reading.delta,
      });
    });
  }

  const hasCareCompletionData = CARE_DOMAINS.some(domain =>
    careCompletion[domain].some(point => point.value > 0),
  );

  return {
    careCompletion,
    hasCareCompletionData,
    environmentalRisk,
    hasEnvironmentalRiskData,
  };
};
