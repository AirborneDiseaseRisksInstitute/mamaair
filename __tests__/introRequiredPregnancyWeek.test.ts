import {
  INTRO_STEP_FLOW,
  resolveNextIntroStep,
} from '../src/utils/introFlow';

describe('required pregnancy week onboarding step', () => {
  it('places pregnancy week before the first skippable lifestyle question', () => {
    const screens = INTRO_STEP_FLOW.map(step => step.screen);

    expect(screens.indexOf('IntroStep11')).toBeLessThan(
      screens.indexOf('IntroStep06'),
    );
  });

  it('requires an explicit week choice even when the API supplied week 3', () => {
    expect(
      resolveNextIntroStep(6, {
        timezone: 'Africa/Nairobi',
        pregnancyWeek: 3,
        pregnancyWeekConfirmed: false,
      }),
    ).toBe('IntroStep11');
  });

  it('does not repeat a week the user has already confirmed', () => {
    expect(
      resolveNextIntroStep(6, {
        pregnancyWeek: 11,
        pregnancyWeekConfirmed: true,
      }),
    ).toBe('IntroStep06');
  });

  it('continues to optional questions after the required week is submitted', () => {
    expect(resolveNextIntroStep(13, {})).toBe('IntroStep06');
  });
});
