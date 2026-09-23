import type { UserProfile } from '../store/useUserStore';
import { getCurrentPregnancyWeek } from './pregnancyUtils';
import {
  areaToApi,
  pregnancyNumberToApi,
  timeOfDayToApi,
  timeSpentToApi,
  ventilationToApi,
} from './profileApiMapping';

export type ProfileEditValues = Pick<
  UserProfile,
  | 'name'
  | 'email'
  | 'birthday'
  | 'height'
  | 'weight'
  | 'language'
  | 'country'
  | 'area'
  | 'timezone'
  | 'pregnancyWeek'
  | 'pregnancyNumber'
  | 'timeSpent'
  | 'timeOfDay'
  | 'cookingMethod'
  | 'ventilation'
  | 'sleepHours'
  | 'activeHours'
  | 'workType'
  | 'diet'
>;

export interface ProfileEditPayloads {
  profile: Record<string, unknown>;
  email: Record<string, unknown>;
  lifestyle: Record<string, unknown>;
  languageChanged: boolean;
}

interface ProfileEditPayloadOptions {
  forcePregnancyWeek?: boolean;
}

export const getProfileEditValues = (
  profile: UserProfile,
): ProfileEditValues => ({
  name: profile.name,
  email: profile.email,
  birthday: profile.birthday,
  height: profile.height,
  weight: profile.weight,
  language: profile.language,
  country: profile.country,
  area: profile.area,
  timezone: profile.timezone,
  // The stored week is the baseline from pregnancyWeekSetDate. The editor must
  // show today's computed week so selecting a value always compares against
  // what the rest of the app is currently displaying.
  pregnancyWeek: getCurrentPregnancyWeek(
    profile.pregnancyWeek,
    profile.pregnancyWeekSetDate,
  ),
  pregnancyNumber: profile.pregnancyNumber,
  timeSpent: profile.timeSpent,
  timeOfDay: profile.timeOfDay,
  cookingMethod: profile.cookingMethod,
  ventilation: profile.ventilation,
  sleepHours: profile.sleepHours,
  activeHours: profile.activeHours,
  workType: profile.workType,
  diet: profile.diet,
});

export const buildProfileEditPayloads = (
  current: ProfileEditValues,
  draft: ProfileEditValues,
  options: ProfileEditPayloadOptions = {},
): ProfileEditPayloads => {
  const profile: Record<string, unknown> = {};
  const email: Record<string, unknown> = {};
  const lifestyle: Record<string, unknown> = {};

  if (draft.name !== current.name) profile.name = draft.name;
  if (draft.email !== current.email) email.email = draft.email;
  if (draft.birthday !== current.birthday) {
    profile.date_of_birth = draft.birthday;
  }
  if (draft.height !== current.height) profile.height = draft.height;
  if (draft.weight !== current.weight) {
    profile.weight_pre_pregnancy = draft.weight;
  }
  if (draft.language !== current.language) profile.language = draft.language;
  if (draft.country !== current.country) profile.country = draft.country;
  if (draft.timezone !== current.timezone) profile.timezone = draft.timezone;
  if (
    draft.pregnancyWeek !== current.pregnancyWeek ||
    options.forcePregnancyWeek
  ) {
    profile.week_of_pregnancy = draft.pregnancyWeek;
  }
  if (draft.pregnancyNumber !== current.pregnancyNumber) {
    const pregnancyNumber = pregnancyNumberToApi(draft.pregnancyNumber);
    profile.pregnancy_number = pregnancyNumber;
    profile.is_first_pregnancy =
      pregnancyNumber === null ? null : pregnancyNumber === 1;
  }

  if (draft.area !== current.area) lifestyle.area = areaToApi(draft.area);
  if (draft.sleepHours !== current.sleepHours) {
    lifestyle.average_sleep_hours = draft.sleepHours;
  }
  if (draft.activeHours !== current.activeHours) {
    lifestyle.activity_duration_minutes =
      draft.activeHours === null ? null : Math.round(draft.activeHours * 60);
  }
  if (draft.workType !== current.workType) {
    lifestyle.work_type = draft.workType;
  }
  if (draft.diet !== current.diet) lifestyle.diet_type = draft.diet;
  if (draft.cookingMethod !== current.cookingMethod) {
    lifestyle.cooking_method = draft.cookingMethod;
  }
  if (draft.ventilation !== current.ventilation) {
    lifestyle.ventilation_level = ventilationToApi(draft.ventilation);
  }
  if (draft.timeSpent !== current.timeSpent) {
    lifestyle.time_spent = timeSpentToApi(draft.timeSpent);
  }
  if (draft.timeOfDay !== current.timeOfDay) {
    lifestyle.time_of_day = timeOfDayToApi(draft.timeOfDay);
  }

  return {
    profile,
    email,
    lifestyle,
    languageChanged: draft.language !== current.language,
  };
};
