export type IntroFlowScreen =
  | 'IntroStep02'
  | 'IntroStep03'
  | 'IntroStep04'
  | 'IntroStep05'
  | 'IntroStep05Timezone'
  | 'IntroStep06'
  | 'IntroStep07'
  | 'IntroStep08'
  | 'IntroStep09'
  | 'IntroStep10'
  | 'IntroStep10Pregnancy'
  | 'IntroStep11'
  | 'IntroStep12'
  | 'IntroStep13'
  | 'IntroStep14';

export interface IntroFlowProfile {
  name?: string | null;
  email?: string | null;
  birthday?: string | null;
  height?: number | null;
  weight?: number | null;
  language?: string | null;
  country?: string | null;
  area?: string | null;
  timezone?: string | null;
  pregnancyWeek?: number | null;
  pregnancyWeekConfirmed?: boolean;
  pregnancyNumber?: string | null;
  timeSpent?: string | null;
  timeOfDay?: string | null;
  cookingMethod?: string | null;
  ventilation?: string | null;
  sleepHours?: number | null;
  activeHours?: number | null;
  workType?: string | null;
  diet?: string | null;
}

interface IntroFlowStep {
  fromIndex: number;
  screen: IntroFlowScreen;
  isComplete: (profile: IntroFlowProfile) => boolean;
}

/**
 * The pregnancy-week question intentionally sits before the first skippable
 * lifestyle question. It remains required until explicitly confirmed because
 * the API can return a default week that the user never selected.
 */
export const INTRO_STEP_FLOW: IntroFlowStep[] = [
  {
    fromIndex: 4,
    screen: 'IntroStep04',
    isComplete: profile => Boolean(profile.language),
  },
  {
    fromIndex: 2,
    screen: 'IntroStep02',
    isComplete: profile => Boolean(profile.name && profile.email),
  },
  {
    fromIndex: 3,
    screen: 'IntroStep03',
    isComplete: profile =>
      Boolean(profile.birthday && profile.height && profile.weight),
  },
  {
    fromIndex: 5,
    screen: 'IntroStep05',
    isComplete: profile => Boolean(profile.country && profile.area),
  },
  {
    fromIndex: 6,
    screen: 'IntroStep05Timezone',
    isComplete: profile => Boolean(profile.timezone),
  },
  {
    fromIndex: 13,
    screen: 'IntroStep11',
    isComplete: profile =>
      Boolean(profile.pregnancyWeekConfirmed && profile.pregnancyWeek),
  },
  {
    fromIndex: 7,
    screen: 'IntroStep06',
    isComplete: profile => Boolean(profile.timeSpent && profile.timeOfDay),
  },
  {
    fromIndex: 8,
    screen: 'IntroStep07',
    isComplete: profile =>
      Boolean(profile.cookingMethod && profile.ventilation),
  },
  {
    fromIndex: 9,
    screen: 'IntroStep08',
    isComplete: profile => Boolean(profile.sleepHours && profile.activeHours),
  },
  {
    fromIndex: 10,
    screen: 'IntroStep09',
    isComplete: profile => Boolean(profile.workType),
  },
  {
    fromIndex: 11,
    screen: 'IntroStep10',
    isComplete: profile => Boolean(profile.diet),
  },
  {
    fromIndex: 12,
    screen: 'IntroStep10Pregnancy',
    isComplete: profile => Boolean(profile.pregnancyNumber),
  },
  { fromIndex: 14, screen: 'IntroStep12', isComplete: () => false },
  { fromIndex: 15, screen: 'IntroStep13', isComplete: () => false },
  { fromIndex: 16, screen: 'IntroStep14', isComplete: () => false },
];

export const resolveNextIntroStep = (
  currentStepIndex: number,
  profile: IntroFlowProfile,
): IntroFlowScreen => {
  const currentPosition = INTRO_STEP_FLOW.findIndex(
    step => step.fromIndex === currentStepIndex,
  );
  const remainingSteps =
    currentPosition === -1
      ? INTRO_STEP_FLOW
      : INTRO_STEP_FLOW.slice(currentPosition + 1);

  return (
    remainingSteps.find(step => !step.isComplete(profile))?.screen ??
    'IntroStep14'
  );
};

export const resolveIntroEntryStep = (
  profile: IntroFlowProfile,
): IntroFlowScreen | 'IntroStep01' => {
  const hasSavedOnboardingData = Boolean(
    profile.name ||
      profile.birthday ||
      profile.country ||
      profile.pregnancyWeek ||
      profile.timeSpent ||
      profile.cookingMethod,
  );

  return hasSavedOnboardingData
    ? resolveNextIntroStep(1, profile)
    : 'IntroStep01';
};
