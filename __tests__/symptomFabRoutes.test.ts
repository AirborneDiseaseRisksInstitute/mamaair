import {
  resolveQuickSymptomSource,
  shouldShowSymptomFab,
  SYMPTOM_FAB_ROUTES,
} from '../src/utils/symptomFabRoutes';

describe('symptom FAB route visibility', () => {
  it('stays available across every primary authenticated screen', () => {
    expect(SYMPTOM_FAB_ROUTES).toEqual([
      'Home',
      'Today',
      'WeeklySummary',
      'SymptomsHistory',
      'BabyStatus',
      'BabyTwin',
      'MotherTwin',
      'UserProfile',
    ]);
    SYMPTOM_FAB_ROUTES.forEach(routeName => {
      expect(shouldShowSymptomFab(routeName)).toBe(true);
    });
  });

  it('stays hidden on auth, onboarding, forms, settings and ads', () => {
    [
      'AuthLoading',
      'IntroStep01',
      'FeelingCheckIn',
      'Ads',
      'AppSettings',
      'NotificationTime',
      'Reminders',
      'PrivacySettings',
      'PlanBirthday',
      'ReferApp',
      'SignIn',
    ].forEach(routeName => {
      expect(shouldShowSymptomFab(routeName)).toBe(false);
    });
  });

  it('keeps analytics source names meaningful', () => {
    expect(resolveQuickSymptomSource('Home')).toBe('home');
    expect(resolveQuickSymptomSource('Today')).toBe('today');
    expect(resolveQuickSymptomSource('WeeklySummary')).toBe('app');
  });
});
