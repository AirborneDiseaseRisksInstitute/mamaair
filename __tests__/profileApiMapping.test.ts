import type { UserProfile } from '../src/store/useUserStore';
import {
  buildLifestyleApiPayload,
  buildProfileApiPayload,
  mapApiLifestyleToLocal,
  mapApiProfileToLocal,
} from '../src/utils/profileApiMapping';

const profile = (): UserProfile => ({
  backendUserId: '7',
  photo: null,
  name: 'Mary',
  email: 'mary@example.com',
  birthday: '1994-06-20',
  expectedDueDate: null,
  height: 168,
  weight: 64,
  language: 'en',
  introLanguageConfirmed: true,
  country: 'KE',
  area: 'peri-urban',
  timezone: 'Africa/Nairobi',
  pregnancyWeek: 24,
  pregnancyWeekSetDate: '2026-09-22',
  pregnancyWeekConfirmed: true,
  pregnancyNumber: 'third',
  timeSpent: 'indoors',
  timeOfDay: 'mornings',
  cookingMethod: 'gas',
  ventilation: 'good',
  sleepHours: 10,
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

describe('profile API mapping', () => {
  it('restores persisted onboarding fields using local enum values', () => {
    expect(
      mapApiProfileToLocal({
        id: 7,
        email: 'mary@example.com',
        week_of_pregnancy: 24,
        pregnancy_number: 3,
      }),
    ).toMatchObject({
      backendUserId: '7',
      pregnancyWeek: 24,
      pregnancyWeekConfirmed: true,
      pregnancyNumber: 'third',
    });

    expect(
      mapApiLifestyleToLocal({
        area: 'peri_urban',
        time_spent: 'mostly_indoors',
        time_of_day: 'morning_hours',
        ventilation_level: 'high',
        activity_duration_minutes: 120,
      }),
    ).toMatchObject({
      area: 'peri-urban',
      timeSpent: 'indoors',
      timeOfDay: 'mornings',
      ventilation: 'good',
      activeHours: 2,
    });
  });

  it('sends only backend-supported field names and enum values', () => {
    const payload = buildProfileApiPayload(profile(), {
      trackingEnabled: true,
      timezoneFallback: 'UTC',
    });

    expect(payload).toMatchObject({
      week_of_pregnancy: 24,
      pregnancy_number: 3,
      is_first_pregnancy: false,
      tracking_enabled: true,
    });
    expect(payload).not.toHaveProperty('avatar_url');
    expect(JSON.stringify(payload)).not.toContain('ui-avatars');

    const lifestyle = buildLifestyleApiPayload(profile());
    expect(lifestyle).toMatchObject({
      area: 'peri_urban',
      time_spent: 'mostly_indoors',
      time_of_day: 'morning_hours',
      ventilation_level: 'high',
      activity_duration_minutes: 120,
    });
    expect(lifestyle).not.toHaveProperty('ventilation');
    expect(lifestyle).not.toHaveProperty('user');
  });

  it('preserves an existing trusted remote avatar URL', () => {
    const value = profile();
    value.photo = 'https://lh3.googleusercontent.com/avatar.jpg';

    expect(
      buildProfileApiPayload(value, {
        trackingEnabled: false,
        timezoneFallback: 'UTC',
      }).avatar_url,
    ).toBe(value.photo);
  });
});
