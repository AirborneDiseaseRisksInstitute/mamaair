import compactTrajectory from '../../data/mamaairReferenceTrajectory.json';
import type {
  DailyActionDomain,
  ExposureTrendPoint,
  PresentationDayRecord,
} from '../../types/recommendationExperience';
import { formatLocalDate } from '../../utils/dateUtils';

interface RawEnvironment {
  pm25AmbientUgM3: number;
  pm25PeakUgM3: number;
  indoorPm25CalculatedUgM3: number;
  heatIndexCelsius: number;
  indoorTempPeakCelsius: number;
  uvIndex: number;
  relativeHumidityPct: number;
  rainySeason: boolean;
  floodEventToday: boolean;
  cookingSessionsToday: number;
}

interface RawNutritionHydration {
  mealsPerDay: number;
  dietQualityScore: number;
  fluidIntakeMl: number;
}

interface RawActivity {
  activeStandingHours: number;
  commuteKm: number;
  commuteMode: string;
  isWorkday: boolean;
  restBreaksAvailable: boolean;
}

interface RawSleep {
  totalHours: number;
  fragmented: boolean;
}

interface RawEngagement {
  nudgeSent: boolean;
  nudgeComplied: boolean;
}

interface RawDay {
  dayOfWeek: number;
  environment: RawEnvironment;
  nutritionHydration: RawNutritionHydration;
  activity: RawActivity;
  sleep: RawSleep;
  engagement: RawEngagement;
}

interface RawWeekSummary {
  averageSleepHours: number;
  averagePm25PeakUgM3: number;
  averageFluidIntakeMl: number;
  averageDietQuality: number;
  nudgeComplianceDays: number;
  derivedParticipation: {
    activeDays: number;
    hydrationTargetDays: number;
    restAvailableDays: number;
    sleepAtLeastSixHoursDays: number;
  };
}

interface RawWeek {
  gestationWeek: number;
  summary: RawWeekSummary;
  days: RawDay[];
}

type CompactSummary = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

type CompactDay = [
  number,
  [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    boolean,
    boolean,
    number,
  ],
  [number, number, number],
  [number, number, string, boolean, boolean],
  [number, boolean],
  [boolean, boolean],
];

type CompactWeek = [number, CompactSummary, CompactDay[]];

export interface PresentationEnvironment {
  pm25: number;
  pm25Peak: number;
  indoorPm25: number;
  temperature: number;
  indoorTemperature: number;
  uvi: number;
  uviLevel: string;
  humidity: number;
  rainySeason: boolean;
  floodEventToday: boolean;
  cookingSessions: number;
}

export interface PresentationNutrition {
  meals: number;
  waterMl: number;
  waterGoalMl: number;
  dietQuality: number;
}

export interface PresentationActivity {
  standingHours: number;
  commuteKm: number;
  commuteMode: string;
  isWorkday: boolean;
  restBreaksAvailable: boolean;
}

export interface PresentationSleep {
  hours: number;
  fragmented: boolean;
}

export interface PresentationDay {
  pregnancyWeek: number;
  date: string;
  dayOfWeek: number;
  environment: PresentationEnvironment;
  nutrition: PresentationNutrition;
  activity: PresentationActivity;
  sleep: PresentationSleep;
  engagement: {
    sent: boolean;
    completed: boolean;
  };
}

export interface PresentationWeekSummary {
  pregnancyWeek: number;
  averageSleepHours: number;
  averagePm25Peak: number;
  averageWaterMl: number;
  averageDietQuality: number;
  activeDays: number;
  hydrationDays: number;
  restDays: number;
  sleepDays: number;
  engagementDays: number;
}

export const PRESENTATION_DATA_VERSION = 5;
export const PRESENTATION_HYDRATION_GOAL_ML = 1500;

const rawTrajectory = compactTrajectory as unknown as CompactWeek[];
const decodeDay = (day: CompactDay): RawDay => ({
  dayOfWeek: day[0],
  environment: {
    pm25AmbientUgM3: day[1][0],
    pm25PeakUgM3: day[1][1],
    indoorPm25CalculatedUgM3: day[1][2],
    heatIndexCelsius: day[1][3],
    indoorTempPeakCelsius: day[1][4],
    uvIndex: day[1][5],
    relativeHumidityPct: day[1][6],
    rainySeason: day[1][7],
    floodEventToday: day[1][8],
    cookingSessionsToday: day[1][9],
  },
  nutritionHydration: {
    mealsPerDay: day[2][0],
    dietQualityScore: day[2][1],
    fluidIntakeMl: day[2][2],
  },
  activity: {
    activeStandingHours: day[3][0],
    commuteKm: day[3][1],
    commuteMode: day[3][2],
    isWorkday: day[3][3],
    restBreaksAvailable: day[3][4],
  },
  sleep: {
    totalHours: day[4][0],
    fragmented: day[4][1],
  },
  engagement: {
    nudgeSent: day[5][0],
    nudgeComplied: day[5][1],
  },
});
const decodeWeek = (week: CompactWeek): RawWeek => ({
  gestationWeek: week[0],
  summary: {
    averageSleepHours: week[1][0],
    averagePm25PeakUgM3: week[1][1],
    averageFluidIntakeMl: week[1][2],
    averageDietQuality: week[1][3],
    nudgeComplianceDays: week[1][4],
    derivedParticipation: {
      activeDays: week[1][5],
      hydrationTargetDays: week[1][6],
      restAvailableDays: week[1][7],
      sleepAtLeastSixHoursDays: week[1][8],
    },
  },
  days: week[2].map(decodeDay),
});
const weeksByNumber = new Map(
  rawTrajectory.map(compactWeek => {
    const week = decodeWeek(compactWeek);
    return [week.gestationWeek, week];
  }),
);

const clampWeek = (week: number): number =>
  Math.max(1, Math.min(40, Math.round(week)));

const round = (value: number, digits = 1): number => {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
};

const dateAtMidnight = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  return new Date(`${value}T00:00:00`);
};

const addDays = (value: string | Date, amount: number): Date => {
  const result = dateAtMidnight(value);
  result.setDate(result.getDate() + amount);
  return result;
};

const localDayOfWeek = (value: string | Date): number => {
  const day = dateAtMidnight(value).getDay();
  return day === 0 ? 7 : day;
};

const selectRawWeek = (pregnancyWeek: number): RawWeek => {
  const selectedWeek = clampWeek(pregnancyWeek);
  const week = weeksByNumber.get(selectedWeek);
  if (!week) {
    throw new Error(
      `Missing reference record for gestational week ${selectedWeek}`,
    );
  }
  return week;
};

const selectRawDay = (pregnancyWeek: number, date: string | Date): RawDay => {
  const week = selectRawWeek(pregnancyWeek);
  const dayOfWeek = localDayOfWeek(date);
  const day = week.days.find(item => item.dayOfWeek === dayOfWeek);
  if (!day) {
    throw new Error(
      `Missing reference day ${dayOfWeek} for gestational week ${week.gestationWeek}`,
    );
  }
  return day;
};

const uvLevel = (uvi: number): string => {
  if (uvi < 3) return 'Low';
  if (uvi < 6) return 'Moderate';
  if (uvi < 8) return 'High';
  if (uvi < 11) return 'Very high';
  return 'Extreme';
};

const normalizeCommuteMode = (value: string): string =>
  value
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

export const selectPresentationDay = (
  pregnancyWeek: number,
  date: string | Date,
): PresentationDay => {
  const selectedWeek = clampWeek(pregnancyWeek);
  const selectedDate = formatLocalDate(dateAtMidnight(date));
  const day = selectRawDay(selectedWeek, selectedDate);

  return {
    pregnancyWeek: selectedWeek,
    date: selectedDate,
    dayOfWeek: day.dayOfWeek,
    environment: {
      pm25: round(day.environment.pm25AmbientUgM3),
      pm25Peak: round(day.environment.pm25PeakUgM3),
      indoorPm25: round(day.environment.indoorPm25CalculatedUgM3),
      temperature: round(day.environment.heatIndexCelsius),
      indoorTemperature: round(day.environment.indoorTempPeakCelsius),
      uvi: round(day.environment.uvIndex),
      uviLevel: uvLevel(day.environment.uvIndex),
      humidity: round(day.environment.relativeHumidityPct),
      rainySeason: day.environment.rainySeason,
      floodEventToday: day.environment.floodEventToday,
      cookingSessions: day.environment.cookingSessionsToday,
    },
    nutrition: {
      meals: day.nutritionHydration.mealsPerDay,
      waterMl: Math.round(day.nutritionHydration.fluidIntakeMl),
      waterGoalMl: PRESENTATION_HYDRATION_GOAL_ML,
      dietQuality: round(day.nutritionHydration.dietQualityScore, 2),
    },
    activity: {
      standingHours: round(day.activity.activeStandingHours),
      commuteKm: round(day.activity.commuteKm),
      commuteMode: normalizeCommuteMode(day.activity.commuteMode),
      isWorkday: day.activity.isWorkday,
      restBreaksAvailable: day.activity.restBreaksAvailable,
    },
    sleep: {
      hours: round(day.sleep.totalHours),
      fragmented: day.sleep.fragmented,
    },
    engagement: {
      sent: day.engagement.nudgeSent,
      completed: day.engagement.nudgeComplied,
    },
  };
};

export const selectPresentationWeek = (
  pregnancyWeek: number,
  endDate: string | Date,
): PresentationDay[] =>
  Array.from({ length: 7 }, (_, index) =>
    selectPresentationDay(pregnancyWeek, addDays(endDate, index - 6)),
  );

export const selectPresentationWeekSummary = (
  pregnancyWeek: number,
): PresentationWeekSummary => {
  const week = selectRawWeek(pregnancyWeek);
  return {
    pregnancyWeek: week.gestationWeek,
    averageSleepHours: round(week.summary.averageSleepHours),
    averagePm25Peak: round(week.summary.averagePm25PeakUgM3),
    averageWaterMl: Math.round(week.summary.averageFluidIntakeMl),
    averageDietQuality: round(week.summary.averageDietQuality, 2),
    activeDays: week.summary.derivedParticipation.activeDays,
    hydrationDays: week.summary.derivedParticipation.hydrationTargetDays,
    restDays: week.summary.derivedParticipation.restAvailableDays,
    sleepDays: week.summary.derivedParticipation.sleepAtLeastSixHoursDays,
    engagementDays: week.summary.nudgeComplianceDays,
  };
};

export const selectPresentationExposureHistory = (
  pregnancyWeek: number,
  endDate: string | Date,
): ExposureTrendPoint[] =>
  selectPresentationWeek(pregnancyWeek, endDate).map(day => ({
    date: day.date,
    pm25: day.environment.pm25,
    temperature: day.environment.temperature,
    humidity: day.environment.humidity,
    uvi: day.environment.uvi,
  }));

export const toPresentationDayRecord = (
  day: PresentationDay,
): PresentationDayRecord => {
  const domains: Record<DailyActionDomain, boolean> = {
    diet: day.nutrition.waterMl >= day.nutrition.waterGoalMl,
    activity: day.activity.isWorkday,
    behaviour: day.activity.restBreaksAvailable,
    wellbeing: day.sleep.hours >= 6,
    service: false,
  };

  return {
    scenarioVersion: PRESENTATION_DATA_VERSION,
    date: day.date,
    pregnancyWeek: day.pregnancyWeek,
    hydrationMl: day.nutrition.waterMl,
    hydrationGoalMl: day.nutrition.waterGoalMl,
    moodLabel: 'No mood update',
    feelingLabel: 'No feeling update',
    symptomLabel: 'No feeling update',
    active: day.activity.isWorkday,
    primaryCompleted: day.engagement.completed ? 1 : 0,
    primaryTotal: day.engagement.sent ? 1 : 0,
    extraCompleted: 0,
    restSessions: day.activity.restBreaksAvailable ? 1 : 0,
    sleepLogged: day.sleep.hours >= 6,
    domains,
    updatedAt: `${day.date}T12:00:00.000Z`,
  };
};

export const selectPresentationWeekRecords = (
  pregnancyWeek: number,
  endDate: string | Date,
): PresentationDayRecord[] =>
  selectPresentationWeek(pregnancyWeek, endDate).map(toPresentationDayRecord);
