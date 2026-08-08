import { useRecommendationExperienceStore } from '../../store/useRecommendationExperienceStore';
import type {
  DailyActionCompletionRecord,
  DailyActionDomain,
  FeelingCheckInExperience,
  FetalSystemProgress,
  PresentationDayRecord,
  RecommendationExperienceIdentity,
  WeeklySummaryExperience,
  WeeklySummaryNextWeek,
} from '../../types/recommendationExperience';
import type { AirExposure } from '../api/ExposureService';
import type { SummaryResponse } from '../api/SummaryService';
import {
  PRESENTATION_DATA_VERSION,
  selectPresentationDay,
  selectPresentationWeekRecords,
  selectPresentationWeekSummary,
  toPresentationDayRecord,
  type PresentationDay,
} from './PresentationDataProvider';

const DOMAIN_ORDER: DailyActionDomain[] = [
  'diet',
  'activity',
  'behaviour',
  'wellbeing',
];

const dateAtMidnight = (value: string): Date => new Date(`${value}T00:00:00`);

const labelForDate = (value: string): string =>
  dateAtMidnight(value).toLocaleDateString('en-US', {
    weekday: 'short',
  });

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
  day: PresentationDayRecord,
): FeelingCheckInExperience => {
  if (experience.recordState === 'recorded') return experience;

  return {
    ...experience,
    waterDailyTotalMl: day.hydrationMl,
    waterGoalMl: experience.waterGoalMl ?? day.hydrationGoalMl,
  };
};

const validNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const validPositiveNumber = (value: unknown): value is number =>
  validNumber(value) && value > 0;

const validText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const numberOr = (value: unknown, missingValue: number): number =>
  validNumber(value) ? value : missingValue;

const mergeAirExposure = (
  date: string,
  value: AirExposure | null,
  day: PresentationDay,
): AirExposure => ({
  ...(value ?? {}),
  timestamp: validText(value?.timestamp)
    ? value.timestamp
    : `${date}T12:00:00.000Z`,
  pm25: numberOr(value?.pm25, day.environment.pm25),
  temperature: numberOr(value?.temperature, day.environment.temperature),
  humidity: numberOr(value?.humidity, day.environment.humidity),
  uvi: numberOr(value?.uvi, day.environment.uvi),
  uvi_level: validText(value?.uvi_level)
    ? value.uvi_level
    : day.environment.uviLevel,
  indoor_pm25: numberOr(value?.indoor_pm25, day.environment.indoorPm25),
  indoor_temperature: numberOr(
    value?.indoor_temperature,
    day.environment.indoorTemperature,
  ),
});

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
  airExposure: AirExposure;
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
      validText(summary?.mom_exposure?.risks) ||
      validNumber(summary?.baby_exposure?.exposure_level) ||
      validText(summary?.baby_exposure?.risks) ||
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
      hydration_target_ml_per_day: validPositiveNumber(
        lifestyle?.hydration_target_ml_per_day,
      )
        ? lifestyle.hydration_target_ml_per_day
        : today.hydrationGoalMl,
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
  const presentationSummary = selectPresentationWeekSummary(pregnancyWeek);
  const presentationDays = ensurePresentationWeek(
    identity,
    pregnancyWeek,
    endDate,
  );
  const store = localData ?? useRecommendationExperienceStore.getState();
  const weekDates = new Set(presentationDays.map(day => day.date));
  const hasBackendWeekData = Boolean(
    backendSummary?.daily_checkins?.some(date => weekDates.has(date)) ||
      backendSummary?.task_completions?.some(item =>
        weekDates.has(item.date),
      ),
  );
  const hasLocalWeekData = presentationDays.some(day => {
    const date = day.date;
    return (
      store.checkIns[date] !== undefined ||
      Object.keys(store.actionCompletions[date] ?? {}).length > 0 ||
      Object.keys(store.restTimers[date] ?? {}).length > 0 ||
      Object.keys(store.dailyMoments[date] ?? {}).length > 0
    );
  });
  const dataMode: WeeklySummaryExperience['dataMode'] =
    hasBackendWeekData || hasLocalWeekData
      ? 'recorded'
      : 'careContext';
  const usePresentationContext = dataMode === 'careContext';

  const days = presentationDays.map(day => {
    const backendCheckIn = Boolean(
      backendSummary?.daily_checkins?.includes(day.date),
    );
    const backendTaskDay = backendSummary?.task_completions?.find(
      item => item.date === day.date,
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
    const checkIn = store.checkIns[day.date];
    const records = store.actionCompletions[day.date] ?? {};
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
    const timerSessions = Object.values(
      store.restTimers[day.date] ?? {},
    ).filter(
      timer => timer.status === 'ready' || timer.status === 'completed',
    ).length;
    const hasTimerRecords =
      Object.keys(store.restTimers[day.date] ?? {}).length > 0;
    const moments = Object.values(store.dailyMoments[day.date] ?? {});
    const restMoments = moments.filter(
      moment =>
        moment.completed &&
        (moment.kind === 'rest' || moment.kind === 'stretch'),
    ).length;
    const hasRestMomentRecords = moments.some(
      moment => moment.kind === 'rest' || moment.kind === 'stretch',
    );
    const sleepLogged = moments.some(
      moment => moment.completed && moment.kind === 'sleep',
    );
    const hasSleepRecords = moments.some(moment => moment.kind === 'sleep');
    const hasPersistedDayData =
      Boolean(checkIn) ||
      Object.keys(records).length > 0 ||
      hasTimerRecords ||
      moments.length > 0;
    const hasCompletedMoment = moments.some(moment => moment.completed);
    const completedPrimaryRecords = Object.values(records).filter(
      record => record.kind === 'primary',
    );
    const emptyDomains: Record<DailyActionDomain, boolean> = {
      diet: false,
      activity: false,
      behaviour: false,
      wellbeing: false,
    };

    return {
      date: day.date,
      label: labelForDate(day.date),
      active:
        backendCheckIn ||
        backendCompletedTasks.length > 0 ||
        (hasPersistedDayData
          ? hasActualActivity || timerSessions > 0 || hasCompletedMoment
          : usePresentationContext
          ? day.active
          : false),
      primaryCompleted:
        backendTaskDay !== undefined
          ? backendCompletedTasks.length
          : hasPrimaryRecords
          ? actualCompleted
          : usePresentationContext
          ? day.primaryCompleted
          : 0,
      primaryTotal:
        backendTaskDay !== undefined
          ? Math.max(
              backendCompletedTasks.length,
              completedPrimaryRecords.length,
            )
          : hasPrimaryRecords
          ? completedPrimaryRecords.length
          : usePresentationContext
          ? day.primaryTotal
          : 0,
      extraCompleted: hasExtraRecords
        ? actualExtraCompleted
        : usePresentationContext
        ? day.extraCompleted
        : 0,
      hydrationMl:
        checkIn?.waterDailyTotalMl ??
        (usePresentationContext ? day.hydrationMl : 0),
      hydrationGoalMl: day.hydrationGoalMl,
      restSessions:
        hasTimerRecords || hasRestMomentRecords
          ? timerSessions + restMoments
          : usePresentationContext
          ? day.restSessions
          : 0,
      sleepLogged: hasSleepRecords
        ? sleepLogged
        : usePresentationContext
        ? day.sleepLogged ?? false
        : false,
      moodLabel: checkIn
        ? checkIn.moodKeys.length
          ? 'Mood recorded'
          : 'No mood update'
        : usePresentationContext
        ? day.moodLabel
        : 'No mood update',
      feelingLabel: checkIn
        ? checkIn.feelingKeys.length
          ? 'Feeling recorded'
          : 'No feeling update'
        : usePresentationContext
        ? day.feelingLabel
        : 'No feeling update',
      symptomLabel: checkIn
        ? checkIn.mommySymptomKeys.length
          ? 'Symptoms recorded'
          : 'No symptoms reported'
        : usePresentationContext
        ? day.symptomLabel
        : 'No symptom update',
      domains: DOMAIN_ORDER.reduce(
        (acc, domain) => ({
          ...acc,
          [domain]:
            backendTaskDay !== undefined
              ? backendDomains[domain]
              : hasPrimaryRecords
              ? actualDomains[domain]
              : usePresentationContext
              ? day.domains[domain]
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
  const actualCheckIns = days
    .map(day => store.checkIns[day.date])
    .filter(checkIn => Boolean(checkIn));
  const actualSymptomDays = actualCheckIns.filter(
    checkIn => checkIn.mommySymptomKeys.length > 0,
  ).length;
  const symptomTrend =
    actualCheckIns.length === 0
      ? 'No symptom trend was recorded this week.'
      : actualSymptomDays === 0
      ? 'No new symptoms were recorded in your check-ins this week.'
      : `Symptoms were recorded on ${actualSymptomDays} ${
          actualSymptomDays === 1 ? 'day' : 'days'
        } this week.`;

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
    activeDays: usePresentationContext
      ? presentationSummary.activeDays
      : days.filter(day => day.active).length,
    primaryCompleted,
    primaryTotal,
    adherencePercent:
      primaryTotal > 0
        ? Math.round((primaryCompleted / primaryTotal) * 100)
        : 0,
    extraCompleted: days.reduce((sum, day) => sum + day.extraCompleted, 0),
    hydrationDays: usePresentationContext
      ? presentationSummary.hydrationDays
      : days.filter(
          day =>
            day.hydrationMl > 0 &&
            day.hydrationMl >= day.hydrationGoalMl,
        ).length,
    restSessions: days.reduce((sum, day) => sum + day.restSessions, 0),
    sleepNights: usePresentationContext
      ? presentationSummary.sleepDays
      : days.filter(day => day.sleepLogged).length,
    streakDays,
    domainParticipation,
    symptomTrend,
    motherProgress: `This week included ${
      days.filter(day => day.hydrationMl >= day.hydrationGoalMl).length
    } hydration-target days and ${days.reduce(
      (sum, day) => sum + day.restSessions,
      0,
    )} rest moments.`,
    babyProgress: `Your care routine stayed connected to the Week ${pregnancyWeek} milestone.`,
    milestone,
    fetalSystems,
    nextWeek,
  };
};
