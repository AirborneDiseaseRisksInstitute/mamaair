import React from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { AppSettingsScreen } from '../src/screens/AppSettingsScreen';

const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockDeleteAccount = jest.fn();
const mockShowToast = jest.fn();

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: { requestPermission: jest.fn() },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));
jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));
jest.mock('../src/store/useUserStore', () => ({
  useUserStore: () => ({
    profile: { timezone: 'Africa/Nairobi' },
    setTimezone: jest.fn(),
  }),
}));
jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: { logout: () => Promise<void> }) => unknown) =>
    selector({ logout: mockLogout }),
}));
jest.mock('../src/services/account/AccountDeletionService', () => ({
  AccountDeletionService: {
    deleteCurrentAccount: (...args: unknown[]) => mockDeleteAccount(...args),
  },
}));
jest.mock('../src/services/NotificationService', () => ({
  scheduleReminders: jest.fn(),
}));
jest.mock('../src/utils/timezoneUtils', () => ({
  getDeviceTimezone: () => 'Africa/Nairobi',
  getTimezoneList: () => ['Africa/Nairobi'],
}));
jest.mock('../src/components/ui', () => ({
  BackButton: () => null,
  BottomSheet: () => null,
  BottomSheetOption: () => null,
  Button: () => null,
  UpgradeSubscription: () => null,
  useToast: () => ({ showToast: mockShowToast }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const findAction = (renderer: TestRenderer.ReactTestRenderer, label: string) =>
  renderer.root.findAllByType(TouchableOpacity).find(node =>
    node.findAllByType(Text).some(text => text.props.children === label),
  );

describe('App Settings account actions', () => {
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
      renderer = TestRenderer.create(
        <AppSettingsScreen onLogout={onLogout} />,
      );
    });

    await act(async () =>
      findAction(renderer!, 'profile.menu_logout')!.props.onPress(),
    );
    expect(mockLogout).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0][2];
    expect(buttons[0].style).toBe('cancel');
    expect(buttons[1].style).toBe('destructive');

    await act(async () => buttons[1].onPress());
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('only leaves the app after account deletion succeeds', async () => {
    const onAccountDeleted = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <AppSettingsScreen onAccountDeleted={onAccountDeleted} />,
      );
    });

    await act(async () =>
      findAction(renderer!, 'settings.delete_account')!.props.onPress(),
    );
    expect(mockDeleteAccount).not.toHaveBeenCalled();

    mockDeleteAccount.mockRejectedValueOnce(new Error('network'));
    await act(async () => alertSpy.mock.calls[0][2][1].onPress());
    expect(onAccountDeleted).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledTimes(1);

    mockDeleteAccount.mockResolvedValueOnce('deleted');
    await act(async () =>
      findAction(renderer!, 'settings.delete_account')!.props.onPress(),
    );
    await act(async () => alertSpy.mock.calls[1][2][1].onPress());
    expect(onAccountDeleted).toHaveBeenCalledTimes(1);
  });
});
