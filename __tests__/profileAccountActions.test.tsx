import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { UserProfileScreen } from '../src/screens/UserProfileScreen';

jest.mock('../src/config/dev', () => ({ DEV_LOCAL_SESSION: true }));
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('../src/store/useUserStore', () => ({
  useUserStore: () => ({ profile: {}, setPhoto: jest.fn() }),
}));
jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: () => ({ token: null }),
}));
jest.mock('../src/store/useRecommendationExperienceStore', () => ({
  useRecommendationExperienceStore: (selector: (state: object) => unknown) =>
    selector({
      checkIns: [],
      actionCompletions: [],
      restTimers: [],
      dailyMoments: [],
    }),
}));
jest.mock('../src/hooks/useMetaChoices', () => ({
  useMetaChoices: () => ({ countries: [], languages: [] }),
}));
jest.mock(
  '../src/services/recommendationExperience/PresentationJourneyRepository',
  () => ({
    loadWeeklySummaryExperience: () => ({ dataMode: 'careContext' }),
  }),
);
jest.mock('../src/components/ui', () => {
  const { View } = require('react-native');
  return {
    BackButton: () => null,
    BottomSheet: () => null,
    BottomSheetOption: () => null,
    Button: () => null,
    FixedButtonContainer: View,
  };
});
jest.mock('../src/components/profile/ProfileEditSheet', () => ({
  ProfileEditSheet: () => null,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en' },
  }),
}));

const findAction = (renderer: TestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(TouchableOpacity).find(node =>
    node.findAllByType(Text).some(text => text.props.children === label),
  );

describe('Profile account actions', () => {
  it('keeps logout and account deletion out of the profile overview', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<UserProfileScreen />);
    });

    expect(findAction(renderer!, 'profile.menu_logout')).toBeUndefined();
    expect(findAction(renderer!, 'settings.delete_account')).toBeUndefined();
  });
});
