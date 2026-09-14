import { resolveBirthdayCardPresentation } from '../src/utils/birthdayCard';

describe('birthday card presentation', () => {
  it('prompts for a birthday when no local date exists', () => {
    expect(resolveBirthdayCardPresentation(null, 'en-US')).toEqual({
      titleKey: 'home.pick_birthday_title',
      subtitleKey: 'home.pick_birthday_subtitle',
      actionKey: 'home.plan_birthday',
    });
  });

  it('shows the saved local date and an edit action', () => {
    expect(resolveBirthdayCardPresentation('2027-01-24', 'en-US')).toEqual({
      titleKey: 'home.birthday_selected_title',
      subtitleKey: 'home.birthday_selected_subtitle',
      actionKey: 'home.edit_birthday',
      dateLabel: 'Sunday, January 24, 2027',
    });
  });

  it('does not treat an invalid stored date as confirmed', () => {
    expect(resolveBirthdayCardPresentation('2027-02-31', 'en-US')).toEqual({
      titleKey: 'home.pick_birthday_title',
      subtitleKey: 'home.pick_birthday_subtitle',
      actionKey: 'home.plan_birthday',
    });
  });
});
