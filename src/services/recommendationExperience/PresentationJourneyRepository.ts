import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type {
  DailyActionCompletionRecord,
  DailyActionDomain,
  FeelingCheckInExperience,
  FetalSystemProgress,
  PresentationDayRecord,
  RecommendationExperienceIdentity,
  WeeklyActionSummaryDomain,
  WeeklyDomainActionSummary,
  WeeklyRiskSummary,
  WeeklySummaryDay,
  WeeklySummaryExperience,
  WeeklySummaryNextWeek,
  WeeklySymptomLevelSummary,
} from '../../types/recommendationExperience';
import type { AirExposure } from '../api/ExposureService';
import type { SummaryResponse } from '../api/SummaryService';
import {
  PRESENTATION_DATA_VERSION,
  selectPresentationDay,
  selectPresentationWeekRecords,
  toPresentationDayRecord,
  type PresentationDay,
} from './PresentationDataProvider';

const DOMAIN_ORDER: WeeklyActionSummaryDomain[] = [
  'diet',
  'activity',
  'behaviour',
  'wellbeing',
];

const WEEKLY_ACTION_DOMAINS: WeeklyActionSummaryDomain[] = DOMAIN_ORDER;

const isEveningWindDownMoment = (moment: { key: string }): boolean =>
  moment.key.startsWith('evening-');

const dateAtMidnight = (value: string): Date => new Date(`${value}T00:00:00`);

const labelForDate = (value: string): string =>
  dateAtMidnight(value).toLocaleDateString('en-US', {
    weekday: 'short',
  });

const weekDatesEnding = (endDate: string): string[] => {
  const end = dateAtMidnight(endDate);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(end);
    current.setDate(end.getDate() - (6 - index));
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
};

export const ensurePresentationWeek = (
  identity: RecommendationExperienceIdentity,
  pregnancyWeek: number,
  endDate: string,
): PresentationDayRecord[] => {
  const store = useRecommendationExperienceStore.getState();
  store.ensureOwner(identity);

  return selectPresentationWeekRecords(pregnancyWeek, endDate).map(record => {
    const date = record.date;
    const current = useRecommendationExperienceStore
      .getState()
      .getPresentationDay(date);
    if (
      current?.scenarioVersion === PRESENTATION_DATA_VERSION &&
      current.pregnancyWeek === record.pregnancyWeek
    ) {
      return current;
    }

    useRecommendationExperienceStore.getState().savePresentationDay(record);
    return record;
  });
};

export const completeTodayCheckIn = (
  experience: FeelingCheckInExperience,
  _day: PresentationDayRecord,
): FeelingCheckInExperience => {
  if (experience.recordState === 'recorded') return experience;

  // Non-production hydration fixtures must not supply user water totals or
  // goals. Those values require an approved backend hydration model.
  return experience;
};

const validNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const validPositiveNumber = (value: unknown): value is number =>
  validNumber(value) && value > 0;

const validText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const mergeAirExposure = (
  date: string,
  value: AirExposure | null,
  _day: PresentationDay,
): AirExposure | null => {
  if (!value) return null;

  // Reference environment fixtures must not fill missing pollutant, weather,
  // UV, or indoor readings in the authenticated Today flow.
  return {
    ...value,
    timestamp: validText(value.timestamp)
      ? value.timestamp
      : `${date}T12:00:00.000Z`,
  };
};

export const completeTodayPresentation = ({
  identity,
  date,
  pregnancyWeek,
  summary,
  airExposure,
  lifestyle,
  checkIn,
}: {
  identity: RecommendationExperienceIdentity;
  date: string;
  pregnancyWeek: number;
  summary: SummaryResponse | null;
  airExposure: AirExposure | null;
  lifestyle: any;
  checkIn: FeelingCheckInExperience;
}): {
  summary: SummaryResponse;
  airExposure: AirExposure | null;
  lifestyle: any;
  checkIn: FeelingCheckInExperience;
  sourceFlags: {
    motherBabyContext: boolean;
  };
} => {
  const days = ensurePresentationWeek(identity, pregnancyWeek, date);
  const today = days[days.length - 1];
  const presentationToday = selectPresentationDay(pregnancyWeek, date);
  const hasMotherBabyData = Boolean(
    validNumber(summary?.mom_exposure?.exposure_level) ||
      validObject(summary?.mom_exposure?.risks) ||
      validNumber(summary?.baby_exposure?.exposure_level) ||
      validObject(summary?.baby_exposure?.risks) ||
      validNumber(summary?.risks_delta?.mom) ||
      validNumber(summary?.risks_delta?.baby),
  );

  return {
    summary: {
      ...(summary ?? {}),
      week_info: {
        week: pregnancyWeek,
        text:
          (summary?.week_info?.week === undefined ||
            summary.week_info.week === pregnancyWeek) &&
          validText(summary?.week_info?.text)
            ? summary.week_info.text
            : undefined,
      },
      recommendations: summary?.recommendations ?? [],
    },
    airExposure: mergeAirExposure(date, airExposure, presentationToday),
    lifestyle: {
      ...(lifestyle ?? {}),
      // Hydration targets are shown only when supplied by an approved backend
      // model; reference fixtures never become user health data.
      hydration_target_ml_per_day: validPositiveNumber(
        lifestyle?.hydration_target_ml_per_day,
      )
        ? lifestyle.hydration_target_ml_per_day
        : undefined,
    },
    checkIn: completeTodayCheckIn(checkIn, today),
    sourceFlags: {
      motherBabyContext: !hasMotherBabyData,
    },
  };
};

export const selectWeekPathDay = ({
  pregnancyWeek,
  date,
  checkIn,
  actionRecords,
  backendActive,
  usePresentation = true,
}: {
  pregnancyWeek: number;
  date: string;
  checkIn?: unknown;
  actionRecords: Record<string, DailyActionCompletionRecord>;
  backendActive?: boolean;
  usePresentation?: boolean;
}): {
  active: boolean;
  domains: DailyActionDomain[];
} => {
  const records = Object.values(actionRecords);
  const hasPersistedData = checkIn !== undefined || records.length > 0;
  const completedRecords = records.filter(
    record => record.completed || record.state === 'completed',
  );
  if (backendActive === true) {
    return {
      active: true,
      domains: ['activity'],
    };
  }
  if (hasPersistedData) {
    return {
      active: checkIn !== undefined || completedRecords.length > 0,
      domains: completedRecords
        .map(record => record.domain)
        .filter((domain): domain is DailyActionDomain => domain !== undefined),
    };
  }

  if (!usePresentation) {
    return {
      active: false,
      domains: [],
    };
  }

  const day = selectPresentationDay(pregnancyWeek, date);
  const record = toPresentationDayRecord(day);
  return {
    active: day.activity.isWorkday,
    domains: DOMAIN_ORDER.filter(domain => record.domains[domain]),
  };
};

const actualDomainParticipation = (
  actionRecords: Record<
    string,
    {
      state?: string;
      completed: boolean;
      domain?: DailyActionDomain;
    }
  >,
): Record<DailyActionDomain, boolean> => {
  const result: Record<DailyActionDomain, boolean> = {
    diet: false,
    activity: false,
    behaviour: false,
    wellbeing: false,
    service: false,
  };
  Object.entries(actionRecords).forEach(([key, record]) => {
    if (!record.completed && record.state !== 'completed') return;
    const domain =
      record.domain ??
      DOMAIN_ORDER.find(item => key.toLowerCase().includes(item));
    if (domain) result[domain] = true;
  });
  return result;
};

const emptyActionSummary = (): Record<
  WeeklyActionSummaryDomain,
  WeeklyDomainActionSummary
> => ({
  diet: { domain: 'diet', recommended: 0, completed: 0 },
  activity: { domain: 'activity', recommended: 0, completed: 0 },
  behaviour: { domain: 'behaviour', recommended: 0, completed: 0 },
  wellbeing: { domain: 'wellbeing', recommended: 0, completed: 0 },
});

const weeklyActionSummary = (
  days: WeeklySummaryDay[],
  actionCompletions: Record<
    string,
    Record<string, DailyActionCompletionRecord>
  >,
): Record<WeeklyActionSummaryDomain, WeeklyDomainActionSummary> => {
  const summary = emptyActionSummary();
  const weekDates = new Set(days.map(day => day.date));

  Object.entries(actionCompletions).forEach(([date, records]) => {
    if (!weekDates.has(date)) return;
    Object.values(records).forEach(record => {
      const domain = record.domain;
      if (
        !domain ||
        !WEEKLY_ACTION_DOMAINS.includes(domain as WeeklyActionSummaryDomain)
      ) {
        return;
      }
      if (record.kind === 'support') return;

      const weeklyDomain = domain as WeeklyActionSummaryDomain;
      summary[weeklyDomain].recommended += 1;
      if (record.completed || record.state === 'completed') {
        summary[weeklyDomain].completed += 1;
      }
    });
  });

  return summary;
};

const completedActionImpact = (
  days: WeeklySummaryDay[],
  actionCompletions: Record<
    string,
    Record<string, DailyActionCompletionRecord>
  >,
): number => {
  const weekDates = new Set(days.map(day => day.date));
  const value = Object.entries(actionCompletions).reduce(
    (sum, [date, records]) => {
      if (!weekDates.has(date)) return sum;
      return (
        sum +
        Object.values(records)
          .filter(record => record.completed || record.state === 'completed')
          .reduce(
            (recordSum, record) =>
              recordSum +
              (validNumber(record.riskImpactValue)
                ? record.riskImpactValue
                : 0),
            0,
          )
      );
    },
    0,
  );
  return Math.round(value * 100) / 100;
};

type SymptomLevel = 1 | 2 | 3 | 4;

interface SymptomClassStatisticsItem {
  symptom_class?: number | string;
  class?: number | string;
  level?: number | string;
  quantity?: number;
  count?: number;
  total?: number;
}

const symptomLevel = (
  value: number | string | undefined,
): SymptomLevel | null => {
  const level =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value)
      : NaN;
  return level === 1 || level === 2 || level === 3 || level === 4
    ? (level as SymptomLevel)
    : null;
};

const statisticCount = (item: SymptomClassStatisticsItem): number => {
  const value = item.quantity ?? item.count ?? item.total ?? 0;
  return validNumber(value) ? value : 0;
};

const addClassStatistics = (
  counts: Record<SymptomLevel, number>,
  value: unknown,
): void => {
  const items = Array.isArray(value)
    ? value
    : validObject(value) && Array.isArray(value.classes)
    ? value.classes
    : [];

  items.forEach(item => {
    if (!validObject(item)) return;
    const level = symptomLevel(
      (item.symptom_class ?? item.class ?? item.level) as
        | number
        | string
        | undefined,
    );
    if (!level) return;
    counts[level] += statisticCount(item);
  });
};

const symptomLevelSummary = (
  backendSummary: SummaryResponse | null,
): WeeklySymptomLevelSummary[] => {
  const raw = backendSummary as
    | (SummaryResponse & Record<string, unknown>)
    | null;
  const mommyCounts: Record<SymptomLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };
  const babyCounts: Record<SymptomLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  if (raw) {
    addClassStatistics(mommyCounts, raw.mommy_symptom_classes);
    addClassStatistics(mommyCounts, raw.mommy_symptom_statistics_classes);
    addClassStatistics(babyCounts, raw.baby_symptom_classes);
    addClassStatistics(babyCounts, raw.baby_symptom_statistics_classes);

    if (validObject(raw.symptom_classes)) {
      addClassStatistics(mommyCounts, raw.symptom_classes.mommy);
      addClassStatistics(mommyCounts, raw.symptom_classes.mother);
      addClassStatistics(babyCounts, raw.symptom_classes.baby);
    }

    if (validObject(raw.symptom_statistics)) {
      addClassStatistics(mommyCounts, raw.symptom_statistics.mommy);
      addClassStatistics(mommyCounts, raw.symptom_statistics.mother);
      addClassStatistics(babyCounts, raw.symptom_statistics.baby);
    }
  }

  return ([1, 2, 3, 4] as const)
    .map(level => ({
      level,
      mommyCount: mommyCounts[level],
      babyCount: babyCounts[level],
      total: mommyCounts[level] + babyCounts[level],
    }))
    .filter(item => item.total > 0);
};

const formatSymptomTrend = (levels: WeeklySymptomLevelSummary[]): string =>
  levels.map(item => `Level ${item.level}: ${item.total}`).join(' · ');

const riskNames = (
  risks: Record<string, unknown> | undefined,
  prefix: string,
): string[] =>
  Object.entries(risks ?? {})
    .filter(([, value]) => {
      if (value === null || value === undefined || value === false)
        return false;
      if (typeof value === 'number') return value !== 0;
      return true;
    })
    .map(([key]) => `${prefix}: ${key.replace(/[_-]+/g, ' ')}`);

const weeklyRiskSummary = (
  backendSummary: SummaryResponse | null,
  impact: number,
): WeeklyRiskSummary | null => {
  const identifiedRisks = [
    ...riskNames(backendSummary?.mom_exposure?.risks, 'Mother'),
    ...riskNames(backendSummary?.baby_exposure?.risks, 'Baby'),
  ];
  const motherRiskDelta = validNumber(backendSummary?.risks_delta?.mom)
    ? backendSummary?.risks_delta?.mom
    : undefined;
  const babyRiskDelta = validNumber(backendSummary?.risks_delta?.baby)
    ? backendSummary?.risks_delta?.baby
    : undefined;

  if (
    identifiedRisks.length === 0 &&
    motherRiskDelta === undefined &&
    babyRiskDelta === undefined &&
    impact === 0
  ) {
    return null;
  }

  return {
    identifiedRisks,
    completedActionImpact: impact,
    motherRiskDelta,
    babyRiskDelta,
  };
};

const formatSignedPercent = (value: number): string =>
  `${value > 0 ? '+' : ''}${value}%`;

const formatRiskSummaryText = (summary: WeeklyRiskSummary | null): string => {
  if (!summary) return '';
  const parts: string[] = [];
  if (summary.identifiedRisks.length > 0) {
    parts.push(`Identified risks: ${summary.identifiedRisks.join(', ')}.`);
  }
  const deltas = [
    summary.motherRiskDelta !== undefined
      ? `mother ${formatSignedPercent(summary.motherRiskDelta)}`
      : null,
    summary.babyRiskDelta !== undefined
      ? `baby ${formatSignedPercent(summary.babyRiskDelta)}`
      : null,
  ].filter((item): item is string => item !== null);
  if (deltas.length > 0) {
    parts.push(`Risk change: ${deltas.join(', ')}.`);
  }
  if (summary.completedActionImpact !== 0) {
    parts.push(
      `Completed action impact: ${formatSignedPercent(
        summary.completedActionImpact,
      )}.`,
    );
  }
  return parts.join(' ');
};

export const loadWeeklySummaryExperience = ({
  identity,
  pregnancyWeek,
  endDate,
  milestone,
  fetalSystems = [],
  nextWeek = null,
  backendSummary = null,
  localData,
}: {
  identity: RecommendationExperienceIdentity;
  pregnancyWeek: number;
  endDate: string;
  milestone: string;
  fetalSystems?: FetalSystemProgress[];
  nextWeek?: WeeklySummaryNextWeek | null;
  backendSummary?: SummaryResponse | null;
  localData?: Pick<
    ReturnType<typeof useRecommendationExperienceStore.getState>,
    'checkIns' | 'actionCompletions' | 'restTimers' | 'dailyMoments'
  >;
}): WeeklySummaryExperience => {
  /*
   * Reference trajectory data remains available for deterministic validation,
   * but Weekly Summary is built only from backend and user-recorded local data.
   *
   * const presentationSummary = selectPresentationWeekSummary(pregnancyWeek);
   * const presentationDays = ensurePresentationWeek(
   *   identity,
   *   pregnancyWeek,
   *   endDate,
   * );
   */
  useRecommendationExperienceStore.getState().ensureOwner(identity);
  const weekDates = weekDatesEnding(endDate);
  const store = localData ?? useRecommendationExperienceStore.getState();
  const weekDateSet = new Set(weekDates);
  const hasBackendWeekData = Boolean(
    backendSummary?.daily_checkins?.some(date => weekDateSet.has(date)) ||
      backendSummary?.task_completions?.some(item =>
        weekDateSet.has(item.date),
      ),
  );
  const hasLocalWeekData = weekDates.some(date => {
    return (
      store.checkIns[date] !== undefined ||
      Object.keys(store.actionCompletions[date] ?? {}).length > 0 ||
      Object.keys(store.restTimers[date] ?? {}).length > 0 ||
      Object.values(store.dailyMoments[date] ?? {}).some(
        moment => !isEveningWindDownMoment(moment),
      )
    );
  });
  const dataMode: WeeklySummaryExperience['dataMode'] =
    hasBackendWeekData || hasLocalWeekData ? 'recorded' : 'careContext';

  const days = weekDates.map(date => {
    const backendCheckIn = Boolean(
      backendSummary?.daily_checkins?.includes(date),
    );
    const backendTaskDay = backendSummary?.task_completions?.find(
      item => item.date === date,
    );
    const backendCompletedTasks = (backendTaskDay?.tasks ?? []).filter(
      task => typeof task === 'string' && task.trim().length > 0,
    );
    const backendDomains = DOMAIN_ORDER.reduce(
      (acc, domain) => ({
        ...acc,
        [domain]: backendCompletedTasks.some(task =>
          task.toLowerCase().includes(domain),
        ),
      }),
      {} as Record<DailyActionDomain, boolean>,
    );
    const checkIn = store.checkIns[date];
    const records = store.actionCompletions[date] ?? {};
    const hasPrimaryRecords = Object.values(records).some(
      record => record.kind === 'primary',
    );
    const hasExtraRecords = Object.values(records).some(
      record => record.kind === 'extra',
    );
    const actualCompleted = Object.values(records).filter(
      record =>
        record.kind === 'primary' &&
        (record.completed || record.state === 'completed'),
    ).length;
    const actualExtraCompleted = Object.entries(records).filter(
      ([, record]) =>
        record.kind === 'extra' &&
        (record.completed || record.state === 'completed'),
    ).length;
    const actualDomains = actualDomainParticipation(records);
    const hasActualActivity =
      Boolean(checkIn) ||
      Object.values(records).some(
        record => record.completed || record.state === 'completed',
      );
    const timerSessions = Object.values(store.restTimers[date] ?? {}).filter(
      timer => timer.status === 'ready' || timer.status === 'completed',
    ).length;
    const hasTimerRecords =
      Object.keys(store.restTimers[date] ?? {}).length > 0;
    const moments = Object.values(store.dailyMoments[date] ?? {});
    const progressMoments = moments.filter(
      moment => !isEveningWindDownMoment(moment),
    );
    const restMoments = progressMoments.filter(
      moment =>
        moment.completed &&
        (moment.kind === 'rest' || moment.kind === 'stretch'),
    ).length;
    const hasRestMomentRecords = progressMoments.some(
      moment => moment.kind === 'rest' || moment.kind === 'stretch',
    );
    const sleepLogged = progressMoments.some(
      moment => moment.completed && moment.kind === 'sleep',
    );
    const hasSleepRecords = progressMoments.some(
      moment => moment.kind === 'sleep',
    );
    const hasPersistedDayData =
      Boolean(checkIn) ||
      Object.keys(records).length > 0 ||
      hasTimerRecords ||
      progressMoments.length > 0;
    const hasCompletedMoment = progressMoments.some(moment => moment.completed);
    const completedPrimaryRecords = Object.values(records).filter(
      record => record.kind === 'primary',
    );
    const emptyDomains: Record<DailyActionDomain, boolean> = {
      diet: false,
      activity: false,
      behaviour: false,
      wellbeing: false,
      service: false,
    };

    return {
      date,
      label: labelForDate(date),
      active:
        backendCheckIn ||
        backendCompletedTasks.length > 0 ||
        (hasPersistedDayData
          ? hasActualActivity || timerSessions > 0 || hasCompletedMoment
          : false),
      primaryCompleted:
        backendTaskDay !== undefined
          ? backendCompletedTasks.length
          : hasPrimaryRecords
          ? actualCompleted
          : 0,
      primaryTotal:
        backendTaskDay !== undefined
          ? completedPrimaryRecords.length
          : hasPrimaryRecords
          ? completedPrimaryRecords.length
          : 0,
      extraCompleted: hasExtraRecords ? actualExtraCompleted : 0,
      hydrationMl: checkIn?.waterDailyTotalMl ?? 0,
      hydrationGoalMl: 0,
      restSessions:
        hasTimerRecords || hasRestMomentRecords
          ? timerSessions + restMoments
          : 0,
      sleepLogged: hasSleepRecords ? sleepLogged : false,
      moodLabel: checkIn
        ? checkIn.moodKeys.length
          ? 'Mood recorded'
          : 'No mood update'
        : 'No mood update',
      feelingLabel: checkIn
        ? checkIn.feelingKeys.length
          ? 'Feeling recorded'
          : 'No feeling update'
        : 'No feeling update',
      symptomLabel: checkIn
        ? checkIn.mommySymptomKeys.length
          ? 'Physical changes logged'
          : 'No physical changes reported'
        : 'No feeling update',
      domains: DOMAIN_ORDER.reduce(
        (acc, domain) => ({
          ...acc,
          [domain]:
            backendTaskDay !== undefined
              ? backendDomains[domain]
              : hasPrimaryRecords
              ? actualDomains[domain]
              : emptyDomains[domain],
        }),
        {} as Record<DailyActionDomain, boolean>,
      ),
    };
  });

  const primaryCompleted = days.reduce(
    (sum, day) => sum + day.primaryCompleted,
    0,
  );
  const primaryTotal = days.reduce((sum, day) => sum + day.primaryTotal, 0);
  const domainParticipation = DOMAIN_ORDER.reduce(
    (acc, domain) => ({
      ...acc,
      [domain]: days.filter(day => day.domains[domain]).length,
    }),
    {} as Record<DailyActionDomain, number>,
  );
  const actionSummary = weeklyActionSummary(days, store.actionCompletions);
  const symptomLevels = symptomLevelSummary(backendSummary);
  const symptomTrend = formatSymptomTrend(symptomLevels);
  const riskSummary = weeklyRiskSummary(
    backendSummary,
    completedActionImpact(days, store.actionCompletions),
  );
  const riskSummaryText = formatRiskSummaryText(riskSummary);

  let streakDays = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].primaryCompleted < 1) {
      if (index === days.length - 1) continue;
      break;
    }
    streakDays += 1;
  }

  return {
    dataMode,
    week: pregnancyWeek,
    startDate: days[0].date,
    endDate: days[days.length - 1].date,
    days,
    activeDays: days.filter(day => day.active).length,
    primaryCompleted,
    primaryTotal,
    adherencePercent:
      primaryTotal > 0
        ? Math.round((primaryCompleted / primaryTotal) * 100)
        : 0,
    extraCompleted: days.reduce((sum, day) => sum + day.extraCompleted, 0),
    hydrationDays: days.filter(
      day => day.hydrationGoalMl > 0 && day.hydrationMl >= day.hydrationGoalMl,
    ).length,
    restSessions: days.reduce((sum, day) => sum + day.restSessions, 0),
    sleepNights: days.filter(day => day.sleepLogged).length,
    streakDays,
    domainParticipation,
    actionSummary,
    symptomLevels,
    riskSummary,
    symptomTrend,
    motherProgress: riskSummaryText,
    babyProgress: '',
    milestone,
    fetalSystems,
    nextWeek,
  };
};
