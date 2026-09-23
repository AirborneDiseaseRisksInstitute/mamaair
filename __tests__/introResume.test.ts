import { resolveIntroEntryStep } from '../src/utils/introFlow';

describe('intro resume', () => {
  it('keeps the welcome screen for a new profile', () => {
    expect(resolveIntroEntryStep({})).toBe('IntroStep01');
  });

  it('resumes an existing profile at only the first missing section', () => {
    expect(
      resolveIntroEntryStep({
        name: 'Mary',
        email: 'mary@example.com',
        birthday: '1994-06-20',
        height: 168,
        weight: 64,
        language: 'en',
        country: 'KE',
        area: 'urban',
        timezone: 'Africa/Nairobi',
        pregnancyWeek: 24,
        pregnancyWeekConfirmed: true,
        pregnancyNumber: 'first',
        timeSpent: null,
      }),
    ).toBe('IntroStep06');
  });
});
