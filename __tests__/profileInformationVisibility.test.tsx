import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { ProfileInformationScreen } from '../src/screens/ProfileInformationScreen';

const profile = {
  birthday: '1994-06-12',
  timezone: 'Africa/Nairobi',
  pregnancyWeek: 16,
  pregnancyWeekSetDate: null,
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

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: (selector: (state: { profile: typeof profile }) => unknown) =>
    selector({ profile }),
}));
jest.mock('../src/hooks/useMetaChoices', () => ({
  useMetaChoices: () => ({
    cooking_methods: [],
    work_types: [],
    diet_types: [],
  }),
}));
jest.mock('../src/components/profile/ProfileEditSheet', () => ({
  ProfileEditSheet: () => null,
}));
jest.mock('../src/components/ui', () => ({
  BackButton: () => null,
}));
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

describe('Profile information visibility', () => {
  it('does not expose time zone outside App Settings', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ProfileInformationScreen />);
    });

    const labels = renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children);

    expect(labels).toContain('profile.birthday');
    expect(labels).not.toContain('profile.time_zone');
    expect(labels).not.toContain('Africa/Nairobi');
  });
});
