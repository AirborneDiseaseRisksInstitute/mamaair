import type { UserProfile } from '../store/useUserStore';

const AREA_TO_API: Record<string, string> = {
  urban: 'urban',
  'peri-urban': 'peri_urban',
  peri_urban: 'peri_urban',
  rural: 'rural',
};

const AREA_FROM_API: Record<string, string> = {
  urban: 'urban',
  peri_urban: 'peri-urban',
  'peri-urban': 'peri-urban',
  rural: 'rural',
};

const TIME_SPENT_TO_API: Record<string, string> = {
  indoors: 'mostly_indoors',
  mostly_indoors: 'mostly_indoors',
  outdoors: 'mostly_outdoors',
  mostly_outdoors: 'mostly_outdoors',
  both: 'both_equally',
  both_equally: 'both_equally',
};

const TIME_SPENT_FROM_API: Record<string, string> = {
  indoors: 'indoors',
  mostly_indoors: 'indoors',
  outdoors: 'outdoors',
  mostly_outdoors: 'outdoors',
  both: 'both',
  both_equally: 'both',
};

const TIME_OF_DAY_TO_API: Record<string, string> = {
  mornings: 'morning_hours',
  morning_hours: 'morning_hours',
  afternoon: 'midday_or_afternoon',
  midday_or_afternoon: 'midday_or_afternoon',
  evening: 'evening',
  change: 'changes_day_to_day',
  changes_day_to_day: 'changes_day_to_day',
};

const TIME_OF_DAY_FROM_API: Record<string, string> = {
  mornings: 'mornings',
  morning_hours: 'mornings',
  afternoon: 'afternoon',
  midday_or_afternoon: 'afternoon',
  evening: 'evening',
  change: 'change',
  changes_day_to_day: 'change',
};

const VENTILATION_TO_API: Record<string, string> = {
  poor: 'low',
  low: 'low',
  moderate: 'medium',
  medium: 'medium',
  good: 'high',
  high: 'high',
};

const VENTILATION_FROM_API: Record<string, string> = {
  poor: 'poor',
  low: 'poor',
  moderate: 'moderate',
  medium: 'moderate',
  good: 'good',
  high: 'good',
};

const mapNullableValue = (
  value: string | null | undefined,
  mapping: Record<string, string>,
): string | null | undefined => {
  if (value === null || value === undefined || value === '') return value;
  return mapping[value] ?? value;
};

export const areaToApi = (value: string | null | undefined) =>
  mapNullableValue(value, AREA_TO_API);

export const areaFromApi = (value: string | null | undefined) =>
  mapNullableValue(value, AREA_FROM_API);

export const timeSpentToApi = (value: string | null | undefined) =>
  mapNullableValue(value, TIME_SPENT_TO_API);

export const timeSpentFromApi = (value: string | null | undefined) =>
  mapNullableValue(value, TIME_SPENT_FROM_API);

export const timeOfDayToApi = (value: string | null | undefined) =>
  mapNullableValue(value, TIME_OF_DAY_TO_API);

export const timeOfDayFromApi = (value: string | null | undefined) =>
  mapNullableValue(value, TIME_OF_DAY_FROM_API);

export const ventilationToApi = (value: string | null | undefined) =>
  mapNullableValue(value, VENTILATION_TO_API);

export const ventilationFromApi = (value: string | null | undefined) =>
  mapNullableValue(value, VENTILATION_FROM_API);

export const pregnancyNumberToApi = (
  value: string | null | undefined,
): number | null => {
  if (value === 'first') return 1;
  if (value === 'second') return 2;
  if (value === 'third') return 3;
  if (value === 'moreThan3') return 4;
  return null;
};

export const pregnancyNumberFromApi = (
  value: unknown,
  isFirstPregnancy?: unknown,
): string | null => {
  const number = Number(value);
  if (Number.isFinite(number) && number >= 1) {
    if (number === 1) return 'first';
    if (number === 2) return 'second';
    if (number === 3) return 'third';
    return 'moreThan3';
  }
  return isFirstPregnancy === true ? 'first' : null;
};

export const mapApiProfileToLocal = (
  data: Record<string, any>,
  fallbackEmail?: string | null,
): Partial<UserProfile> => {
  const pregnancyWeek = Number(
    data.week_of_pregnancy ?? data.pregnancyWeek,
  );
  const validPregnancyWeek =
    Number.isFinite(pregnancyWeek) && pregnancyWeek >= 1
      ? pregnancyWeek
      : undefined;

  return {
    backendUserId:
      data.id !== undefined && data.id !== null ? String(data.id) : undefined,
    name: data.name,
    email: data.email ?? fallbackEmail,
    photo: data.avatar_url ?? data.photo,
    birthday: data.date_of_birth ?? data.birthday,
    expectedDueDate:
      data.expected_due_date ?? data.expectedDueDate ?? data.due_date,
    height: data.height,
    weight: data.weight_pre_pregnancy ?? data.weight,
    language: data.language,
    country: data.country,
    timezone: data.timezone,
    pregnancyWeek: validPregnancyWeek,
    pregnancyWeekConfirmed: validPregnancyWeek ? true : undefined,
    pregnancyNumber:
      pregnancyNumberFromApi(
        data.pregnancy_number,
        data.is_first_pregnancy,
      ) ?? undefined,
  };
};

export const mapApiLifestyleToLocal = (
  data: Record<string, any>,
): Partial<UserProfile> => ({
  sleepHours: data.average_sleep_hours,
  workType: data.work_type,
  diet: data.diet_type,
  cookingMethod: data.cooking_method,
  activeHours:
    data.activity_duration_minutes === null ||
    data.activity_duration_minutes === undefined
      ? undefined
      : Number(data.activity_duration_minutes) / 60,
  area: areaFromApi(data.area),
  ventilation: ventilationFromApi(data.ventilation_level),
  timeSpent: timeSpentFromApi(data.time_spent),
  timeOfDay: timeOfDayFromApi(data.time_of_day),
});

export const buildProfileApiPayload = (
  profile: UserProfile,
  options: {
    trackingEnabled: boolean;
    timezoneFallback: string;
  },
): Record<string, unknown> => {
  const pregnancyNumber = pregnancyNumberToApi(profile.pregnancyNumber);
  const avatarUrl =
    profile.photo && profile.photo.startsWith('http')
      ? profile.photo
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          profile.name || 'Mama Air',
        )}&background=FF8C00&color=fff`;

  return {
    name: profile.name || '',
    avatar_url: avatarUrl,
    date_of_birth: profile.birthday || null,
    height: profile.height,
    weight_pre_pregnancy: profile.weight,
    language: profile.language || 'en',
    country: profile.country || 'other',
    week_of_pregnancy: profile.pregnancyWeek,
    timezone: profile.timezone || options.timezoneFallback,
    pregnancy_number: pregnancyNumber,
    is_first_pregnancy:
      pregnancyNumber === null ? null : pregnancyNumber === 1,
    consent: profile.agreementAccepted,
    tracking_enabled: options.trackingEnabled,
    notifications_enabled: true,
  };
};

export const buildLifestyleApiPayload = (
  profile: UserProfile,
): Record<string, unknown> => ({
  average_sleep_hours: profile.sleepHours,
  work_type: profile.workType,
  diet_type: profile.diet,
  cooking_method: profile.cookingMethod,
  activity_duration_minutes:
    profile.activeHours === null
      ? null
      : Math.round(profile.activeHours * 60),
  area: areaToApi(profile.area),
  ventilation_level: ventilationToApi(profile.ventilation),
  time_spent: timeSpentToApi(profile.timeSpent),
  time_of_day: timeOfDayToApi(profile.timeOfDay),
});
