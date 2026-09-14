import type { UserProfile } from '../src/store/useUserStore';
import type { FeelingCheckInRecord } from '../src/types/recommendationExperience';
import {
  isCheckInReadyForPlan,
  missingPlanProfileSteps,
  nextMissingPlanProfileStep,
  resolvePlanInputReadiness,
} from '../src/utils/planReadiness';

const completeProfile = (): UserProfile => ({
  backendUserId: '12',
  photo: null,
  name: 'Mary',
  email: 'mary@example.com',
  birthday: '1994-06-20',
  expectedDueDate: null,
  height: 168,
  weight: 64,
  language: 'en',
  country: 'KE',
  area: 'Nairobi',
  timezone: 'Africa/Nairobi',
  pregnancyWeek: 24,
  pregnancyWeekSetDate: '2026-09-12',
  pregnancyWeekConfirmed: true,
  pregnancyNumber: 'first',
  timeSpent: 'both',
  timeOfDay: 'change',
  cookingMethod: 'gas',
  ventilation: 'moderate',
  sleepHours: 8,
  activeHours: 2,
  workType: 'Desk',
  diet: 'omnivore',
  agreementAccepted: true,
  notifTimeFromHour: 9,
  notifTimeFromMinute: 0,
  notifTimeToHour: 21,
  notifTimeToMinute: 0,
  notifDays: '1111111',
});

const completeCheckIn = (): FeelingCheckInRecord => ({
  date: '2026-09-12',
  recordedAt: '2026-09-12T08:00:00+03:30',
  updatedAt: '2026-09-12T08:00:00.000Z',
  scope: 'full',
  mommySymptomKeys: [],
  moodKeys: [],
  feelingKeys: [],
  waterIncrementMl: 0,
  writeStatus: {
    mommySymptoms: 'saved',
    wellbeing: 'skipped',
    dailyCheckIn: 'saved',
  },
});

describe('plan input readiness', () => {
  it('identifies the intro routes needed for skipped lifestyle data', () => {
    const profile = completeProfile();
    profile.cookingMethod = null;
    profile.ventilation = null;
    profile.diet = null;

    expect(missingPlanProfileSteps(profile)).toEqual([
      'IntroStep07',
      'IntroStep10',
    ]);
  });

  it('continues from the current screen to the next incomplete section', () => {
    const profile = completeProfile();
    profile.birthday = null;
    profile.ventilation = null;

    expect(nextMissingPlanProfileStep(profile)).toBe('IntroStep03');
    expect(nextMissingPlanProfileStep(profile, 'IntroStep03')).toBe(
      'IntroStep07',
    );
    expect(nextMissingPlanProfileStep(profile, 'IntroStep07')).toBeNull();
  });

  it('accepts an intentionally empty full check-in', () => {
    expect(isCheckInReadyForPlan(completeCheckIn())).toBe(true);
  });

  it('rejects skipped, quick-only, failed, or pending check-ins', () => {
    expect(isCheckInReadyForPlan(null)).toBe(false);

    const quick = completeCheckIn();
    quick.scope = 'symptoms';
    expect(isCheckInReadyForPlan(quick)).toBe(false);

    const legacy = completeCheckIn();
    delete legacy.scope;
    expect(isCheckInReadyForPlan(legacy)).toBe(false);

    const failed = completeCheckIn();
    failed.writeStatus.wellbeing = 'failed';
    expect(isCheckInReadyForPlan(failed)).toBe(false);

    const pending = completeCheckIn();
    pending.writeStatus.mommySymptoms = 'pending';
    expect(
      isCheckInReadyForPlan(pending, {
        date: pending.date,
        symptomIds: [],
        recordedAt: pending.recordedAt,
        updatedAt: pending.updatedAt,
      }),
    ).toBe(false);
    expect(isCheckInReadyForPlan(pending, null)).toBe(true);
  });

  it("requires both complete profile data and today's full check-in", () => {
    const profile = completeProfile();
    expect(resolvePlanInputReadiness(profile, completeCheckIn()).ready).toBe(
      true,
    );

    profile.timeSpent = null;
    expect(resolvePlanInputReadiness(profile, completeCheckIn())).toMatchObject(
      {
        ready: false,
        profileReady: false,
        checkInReady: true,
      },
    );
  });
});
