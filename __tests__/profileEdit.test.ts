import {
  buildProfileEditPayloads,
  getProfileEditValues,
  type ProfileEditValues,
} from '../src/utils/profileEdit';
import type { UserProfile } from '../src/store/useUserStore';

const current: ProfileEditValues = {
  name: 'Mary',
  email: 'mary@example.com',
  birthday: '1994-06-12',
  height: 165,
  weight: 62,
  language: 'en',
  country: 'KE',
  area: 'urban',
  timezone: 'Africa/Nairobi',
  pregnancyWeek: 11,
  pregnancyNumber: 'first',
  timeSpent: 'indoors',
  timeOfDay: 'mornings',
  cookingMethod: 'gas',
  ventilation: 'moderate',
  sleepHours: 8,
  activeHours: 2,
  workType: 'Desk',
  diet: 'carnivore',
};

describe('profile edit payloads', () => {
  it('opens pregnancy editing on the current week, not its old baseline', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-01T12:00:00Z'));

    const profile = {
      ...current,
      pregnancyWeek: 1,
      pregnancyWeekSetDate: '2026-07-25',
    } as UserProfile;

    expect(getProfileEditValues(profile).pregnancyWeek).toBe(2);
    jest.useRealTimers();
  });

  it('does not send unchanged fields', () => {
    expect(buildProfileEditPayloads(current, { ...current })).toEqual({
      profile: {},
      email: {},
      lifestyle: {},
      languageChanged: false,
    });
  });

  it('reconfirms the selected pregnancy week from today when it is saved', () => {
    expect(
      buildProfileEditPayloads(
        current,
        { ...current },
        {
          forcePregnancyWeek: true,
        },
      ).profile,
    ).toEqual({ week_of_pregnancy: 11 });
  });

  it('maps every editable Intro field to its existing API contract', () => {
    const draft: ProfileEditValues = {
      name: 'Mary A',
      email: 'mary.a@example.com',
      birthday: '1994-07-13',
      height: 166,
      weight: 63,
      language: 'fr',
      country: 'GH',
      area: 'rural',
      timezone: 'Africa/Accra',
      pregnancyWeek: 12,
      pregnancyNumber: 'second',
      timeSpent: 'outdoors',
      timeOfDay: 'afternoon',
      cookingMethod: 'wood',
      ventilation: 'poor',
      sleepHours: 7,
      activeHours: 3,
      workType: 'Field',
      diet: 'vegetarian',
    };

    expect(buildProfileEditPayloads(current, draft)).toEqual({
      profile: {
        name: 'Mary A',
        date_of_birth: '1994-07-13',
        height: 166,
        weight_pre_pregnancy: 63,
        language: 'fr',
        country: 'GH',
        timezone: 'Africa/Accra',
        week_of_pregnancy: 12,
        pregnancy_number: 2,
        is_first_pregnancy: false,
      },
      email: {
        email: 'mary.a@example.com',
      },
      lifestyle: {
        area: 'rural',
        average_sleep_hours: 7,
        activity_duration_minutes: 180,
        work_type: 'Field',
        diet_type: 'vegetarian',
        cooking_method: 'wood',
        ventilation_level: 'low',
        time_spent: 'mostly_outdoors',
        time_of_day: 'midday_or_afternoon',
      },
      languageChanged: true,
    });
  });
});
