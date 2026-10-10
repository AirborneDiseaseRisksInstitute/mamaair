import { resolveCachedAuthLoadingTarget } from '../../src/services/auth/AuthLoadingTarget';

const completeProfile = {
  backendUserId: 'user-1',
  pregnancyWeek: 7,
  pregnancyWeekConfirmed: true,
  timezone: 'Africa/Nairobi',
  timeSpent: 'mostly_indoor',
  timeOfDay: 'morning',
  workType: 'office',
  cookingMethod: 'electric',
  ventilation: 'good',
  agreementAccepted: true,
};

describe('cached auth loading target', () => {
  it('opens Home immediately for a complete profile bound to a restored session', () => {
    expect(resolveCachedAuthLoadingTarget(completeProfile)).toBe('Home');
  });

  it('keeps fresh sign-in on the verified server-loading path', () => {
    expect(
      resolveCachedAuthLoadingTarget(completeProfile, 'mary@example.com'),
    ).toBeNull();
  });

  it('does not expose cached data without a backend identity binding', () => {
    expect(
      resolveCachedAuthLoadingTarget({
        ...completeProfile,
        backendUserId: null,
      }),
    ).toBeNull();
  });

  it('does not skip onboarding for an incomplete cached profile', () => {
    expect(
      resolveCachedAuthLoadingTarget({
        ...completeProfile,
        pregnancyWeekConfirmed: false,
      }),
    ).toBeNull();
  });

  it('restores the consent screen when onboarding is complete but consent is missing', () => {
    expect(
      resolveCachedAuthLoadingTarget({
        ...completeProfile,
        agreementAccepted: false,
      }),
    ).toBe('ConsentHome');
  });
});
