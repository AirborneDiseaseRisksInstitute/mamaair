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
  predicted: number;
  afterSelfCare: number;
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
  tasks: string[],
): Record<WeeklyActionSummaryDomain, number> => {
  const counts = emptyCounts();
  tasks.forEach(task => {
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
  const afterSelfCare = apiCurrentRisk(summary, audience);
  if (afterSelfCare === null) return null;

  const delta = apiRiskDelta(summary, audience);
  return {
    predicted: normalizeRisk(
      delta === null ? afterSelfCare : afterSelfCare - delta,
    ),
    afterSelfCare: normalizeRisk(afterSelfCare),
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
  environmentalRiskObservations,
  currentDate,
}: {
  weekDates: string[];
  actionCompletions: Record<
    string,
    Record<string, DailyActionCompletionRecord>
  >;
  backendSummary: SummaryResponse | null;
  environmentalRiskObservations: Record<string, EnvironmentalRiskObservation>;
  currentDate: string;
}): MotherTwinChartModel => {
  const backendTasksByDate = new Map(
    (backendSummary?.task_completions ?? []).map(item => [
      item.date,
      item.tasks.filter(
        task => typeof task === 'string' && task.trim().length > 0,
      ),
    ]),
  );
  const currentObservation = buildEnvironmentalRiskObservation(
    backendSummary,
    currentDate,
  );
  const riskObservations = {
    ...environmentalRiskObservations,
    ...(currentObservation
      ? { [currentObservation.date]: currentObservation }
      : {}),
  };
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
    const backendTasks = backendTasksByDate.get(date) ?? [];
    const counts =
      Object.keys(records).length > 0
        ? localCounts
        : dailyBackendCareCounts(backendTasks);

    CARE_DOMAINS.forEach(domain => {
      careCompletion[domain].push({ value: counts[domain] });
    });

    (['mother', 'baby'] as const).forEach(audience => {
      const reading = riskObservations[date]?.[audience];
      if (reading) {
        hasEnvironmentalRiskData[audience] = true;
        environmentalRisk[audience].push({
          date,
          predicted: reading.predicted,
          afterSelfCare: reading.afterSelfCare,
        });
      }
    });
  });

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
