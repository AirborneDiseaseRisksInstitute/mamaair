import type { UserProfile } from '../store/useUserStore';
import type {
  FeelingCheckInRecord,
  PendingMommySymptomSelection,
  PlanInputReadiness,
  PlanProfileStep,
} from '../types/recommendationExperience';

export type { PlanInputReadiness, PlanProfileStep };

interface PlanProfileRequirement {
  screen: PlanProfileStep;
  isComplete: (profile: UserProfile) => boolean;
}

const hasText = (value: string | null): boolean => Boolean(value?.trim());
const isPositiveNumber = (value: number | null): boolean =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const PLAN_PROFILE_REQUIREMENTS: PlanProfileRequirement[] = [
  {
    screen: 'IntroStep03',
    isComplete: profile =>
      hasText(profile.birthday) &&
      isPositiveNumber(profile.height) &&
      isPositiveNumber(profile.weight),
  },
  {
    screen: 'IntroStep05',
    isComplete: profile => hasText(profile.country) && hasText(profile.area),
  },
  {
    screen: 'IntroStep05Timezone',
    isComplete: profile => hasText(profile.timezone),
  },
  {
    screen: 'IntroStep11',
    isComplete: profile =>
      profile.pregnancyWeekConfirmed &&
      isPositiveNumber(profile.pregnancyWeek) &&
      (profile.pregnancyWeek ?? 0) <= 40,
  },
  {
    screen: 'IntroStep06',
    isComplete: profile =>
      hasText(profile.timeSpent) && hasText(profile.timeOfDay),
  },
  {
    screen: 'IntroStep07',
    isComplete: profile =>
      hasText(profile.cookingMethod) && hasText(profile.ventilation),
  },
  {
    screen: 'IntroStep08',
    isComplete: profile =>
      isPositiveNumber(profile.sleepHours) &&
      isPositiveNumber(profile.activeHours),
  },
  {
    screen: 'IntroStep09',
    isComplete: profile => hasText(profile.workType),
  },
  {
    screen: 'IntroStep10',
    isComplete: profile => hasText(profile.diet),
  },
  {
    screen: 'IntroStep10Pregnancy',
    isComplete: profile => hasText(profile.pregnancyNumber),
  },
];

export const missingPlanProfileSteps = (
  profile: UserProfile,
): PlanProfileStep[] =>
  PLAN_PROFILE_REQUIREMENTS.filter(
    requirement => !requirement.isComplete(profile),
  ).map(requirement => requirement.screen);

export const nextMissingPlanProfileStep = (
  profile: UserProfile,
  after?: PlanProfileStep,
): PlanProfileStep | null => {
  const startIndex = after
    ? PLAN_PROFILE_REQUIREMENTS.findIndex(item => item.screen === after) + 1
    : 0;

  return (
    PLAN_PROFILE_REQUIREMENTS.slice(Math.max(0, startIndex)).find(
      requirement => !requirement.isComplete(profile),
    )?.screen ?? null
  );
};

export const isCheckInReadyForPlan = (
  record: FeelingCheckInRecord | null,
  pendingSymptomSelection?: PendingMommySymptomSelection | null,
): boolean => {
  if (!record || record.scope !== 'full') return false;

  const mommySymptomsReady =
    record.writeStatus.mommySymptoms === 'saved' ||
    record.writeStatus.mommySymptoms === 'skipped' ||
    (record.writeStatus.mommySymptoms === 'pending' &&
      !pendingSymptomSelection);
  const wellbeingReady =
    record.writeStatus.wellbeing === 'saved' ||
    record.writeStatus.wellbeing === 'skipped';
  const dailyCheckInReady =
    record.writeStatus.dailyCheckIn === 'saved' ||
    record.writeStatus.dailyCheckIn === 'skipped';

  return mommySymptomsReady && wellbeingReady && dailyCheckInReady;
};

export const resolvePlanInputReadiness = (
  profile: UserProfile,
  checkInRecord: FeelingCheckInRecord | null,
  pendingSymptomSelection?: PendingMommySymptomSelection | null,
): PlanInputReadiness => {
  const missingProfileSteps = missingPlanProfileSteps(profile);
  const profileReady =
    profile.agreementAccepted && missingProfileSteps.length === 0;
  const checkInReady = isCheckInReadyForPlan(
    checkInRecord,
    pendingSymptomSelection,
  );

  return {
    ready: profileReady && checkInReady,
    profileReady,
    checkInReady,
    missingProfileSteps,
  };
};
