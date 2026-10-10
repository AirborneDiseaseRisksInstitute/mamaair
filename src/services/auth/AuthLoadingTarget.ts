import type { UserProfile } from '../../store/useUserStore';

export type AuthLoadingTarget = 'Home' | 'Intro' | 'ConsentHome' | 'Auth';
type CachedAuthLoadingTarget = Extract<
  AuthLoadingTarget,
  'Home' | 'ConsentHome'
>;
type AuthLoadingProfile = Pick<
  UserProfile,
  | 'backendUserId'
  | 'pregnancyWeek'
  | 'pregnancyWeekConfirmed'
  | 'timezone'
  | 'timeSpent'
  | 'timeOfDay'
  | 'workType'
  | 'cookingMethod'
  | 'ventilation'
  | 'agreementAccepted'
>;

export const resolveCompletedProfileTarget = (
  profile: AuthLoadingProfile,
): CachedAuthLoadingTarget | null => {
  const isOnboardingComplete = Boolean(
    profile.pregnancyWeek &&
      profile.pregnancyWeekConfirmed &&
      profile.timezone &&
      profile.timeSpent &&
      profile.timeOfDay &&
      profile.workType &&
      profile.cookingMethod &&
      profile.ventilation,
  );

  if (!isOnboardingComplete) return null;
  return profile.agreementAccepted ? 'Home' : 'ConsentHome';
};

export const resolveCachedAuthLoadingTarget = (
  profile: AuthLoadingProfile,
  authenticatedEmail?: string,
): CachedAuthLoadingTarget | null => {
  // A fresh sign-in must bind the locally cached profile to the authenticated
  // backend identity before any health data is shown. The fast path is only for
  // restoring an already-bound session after a cold start.
  if (authenticatedEmail?.trim() || !profile.backendUserId) return null;
  return resolveCompletedProfileTarget(profile);
};
