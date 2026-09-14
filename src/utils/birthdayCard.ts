import { parseLocalDate } from './dateUtils';

interface BirthdayCardPresentation {
  titleKey: 'home.pick_birthday_title' | 'home.birthday_selected_title';
  subtitleKey:
    | 'home.pick_birthday_subtitle'
    | 'home.birthday_selected_subtitle';
  actionKey: 'home.plan_birthday' | 'home.edit_birthday';
  dateLabel?: string;
}

export const resolveBirthdayCardPresentation = (
  expectedDueDate: string | null,
  locale: string,
): BirthdayCardPresentation => {
  const date = parseLocalDate(expectedDueDate);
  if (!date) {
    return {
      titleKey: 'home.pick_birthday_title',
      subtitleKey: 'home.pick_birthday_subtitle',
      actionKey: 'home.plan_birthday',
    };
  }

  return {
    titleKey: 'home.birthday_selected_title',
    subtitleKey: 'home.birthday_selected_subtitle',
    actionKey: 'home.edit_birthday',
    dateLabel: date.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
};
