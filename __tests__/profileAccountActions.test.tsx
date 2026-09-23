import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { UserProfileScreen } from '../src/screens/UserProfileScreen';

const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();
const mockShowToast = jest.fn();

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
  useAuthStore: () => ({ logout: mockLogout }),
}));
jest.mock('../src/store/useRecommendationExperienceStore', () => ({
  useRecommendationExperienceStore: (selector: (state: object) => unknown) =>
    selector({ checkIns: [], actionCompletions: [], restTimers: [], dailyMoments: [] }),
}));
jest.mock('../src/hooks/useMetaChoices', () => ({
  useMetaChoices: () => ({ countries: [], languages: [] }),
}));
jest.mock('../src/services/recommendationExperience/PresentationJourneyRepository', () => ({
  loadWeeklySummaryExperience: () => ({ dataMode: 'careContext' }),
}));
jest.mock('../src/services/account/AccountDeletionService', () => ({
  AccountDeletionService: {
    deleteCurrentAccount: (...args: unknown[]) => mockDeleteAccount(...args),
  },
}));
jest.mock('../src/components/ui', () => {
  const { View } = require('react-native');
  return {
    BackButton: () => null,
    BottomSheet: () => null,
    BottomSheetOption: () => null,
    Button: () => null,
    FixedButtonContainer: View,
    useToast: () => ({ showToast: mockShowToast }),
  };
});
jest.mock('../src/components/profile/ProfileEditSheet', () => ({
  ProfileEditSheet: () => null,
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { resolvedLanguage: 'en' } }),
}));

const findAction = (renderer: TestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(TouchableOpacity).find(node =>
    node.findAllByType(Text).some(text => text.props.children === label),
  );

describe('Profile account actions', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => alertSpy.mockRestore());

  it('requires confirmation before logging out', async () => {
    const onLogout = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<UserProfileScreen onLogout={onLogout} />);
    });

    await act(async () => findAction(renderer!, 'profile.menu_logout')!.props.onPress());
    expect(mockLogout).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0][2];
    expect(buttons[0].style).toBe('cancel');
    expect(buttons[1].style).toBe('destructive');
    buttons[0].onPress?.();
    expect(mockLogout).not.toHaveBeenCalled();

    await act(async () => buttons[1].onPress());
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('only signs out after account deletion succeeds', async () => {
    const onAccountDeleted = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <UserProfileScreen onAccountDeleted={onAccountDeleted} />,
      );
    });

    await act(async () => findAction(renderer!, 'settings.delete_account')!.props.onPress());
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(alertSpy.mock.calls[0][2][0].style).toBe('cancel');
    alertSpy.mock.calls[0][2][0].onPress?.();
    expect(mockDeleteAccount).not.toHaveBeenCalled();

    mockDeleteAccount.mockRejectedValueOnce(new Error('network'));
    await act(async () => alertSpy.mock.calls[0][2][1].onPress());
    expect(mockLogout).not.toHaveBeenCalled();
    expect(onAccountDeleted).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledTimes(1);

    mockDeleteAccount.mockResolvedValueOnce('deleted');
    await act(async () => findAction(renderer!, 'settings.delete_account')!.props.onPress());
    await act(async () => alertSpy.mock.calls[1][2][1].onPress());
    expect(mockLogout).not.toHaveBeenCalled();
    expect(onAccountDeleted).toHaveBeenCalledTimes(1);
  });
});
