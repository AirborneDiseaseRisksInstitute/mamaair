import React from 'react';
import { Switch, Text, View } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { PrivacySettingsScreen } from '../src/screens/PrivacySettingsScreen';

const mockGetPermissionStatus = jest.fn();
const mockGetState = jest.fn();
const mockEnable = jest.fn();
const mockResume = jest.fn();
const mockAddTrackingStateListener = jest.fn();
const mockDisable = jest.fn();
const mockDecline = jest.fn();

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({ authorizationStatus: 1 }),
    ),
    requestPermission: jest.fn(),
  },
  AuthorizationStatus: { AUTHORIZED: 1 },
}));

jest.mock('../src/services/tracking/LocationAccessCoordinator', () => ({
  locationAccessCoordinator: {
    getPermissionStatus: (...args: unknown[]) =>
      mockGetPermissionStatus(...args),
    getState: (...args: unknown[]) => mockGetState(...args),
    enable: (...args: unknown[]) => mockEnable(...args),
    resume: (...args: unknown[]) => mockResume(...args),
    addTrackingStateListener: (...args: unknown[]) =>
      mockAddTrackingStateListener(...args),
    disable: (...args: unknown[]) => mockDisable(...args),
    decline: (...args: unknown[]) => mockDecline(...args),
  },
}));

jest.mock('@react-navigation/native', () => {
  const ReactModule = require('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) =>
      ReactModule.useEffect(callback, [callback]),
  };
});

jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');

  return {
    BackButton: () => null,
    AccessLocationBottomSheet: (props: object) =>
      ReactModule.createElement(NativeView, {
        ...props,
        testID: 'location-access-sheet',
      }),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PrivacySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionStatus.mockResolvedValue('denied');
    mockGetState.mockResolvedValue({
      permissionStatus: 'denied',
      trackingEnabled: false,
      trackingActive: false,
    });
    mockEnable.mockResolvedValue('granted');
    mockResume.mockResolvedValue('denied');
    mockAddTrackingStateListener.mockReturnValue(() => {});
  });

  it('uses one location tracking toggle for permission and tracking', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<PrivacySettingsScreen />);
    });

    const labels = renderer!.root
      .findAllByType(Text)
      .map(node => String(node.props.children));
    expect(labels).toContain('privacy.tracking');
    expect(labels).not.toContain('privacy.precise_location');
    expect(renderer!.root.findAllByType(Switch)).toHaveLength(2);

    const trackingSwitch = renderer!.root.findAllByType(Switch)[1];
    await act(async () => {
      await trackingSwitch.props.onValueChange(true);
    });

    const locationSheet = renderer!.root.find(
      node =>
        node.type === View && node.props.testID === 'location-access-sheet',
    );
    expect(locationSheet.props.visible).toBe(true);

    await act(async () => {
      mockGetState.mockResolvedValue({
        permissionStatus: 'granted',
        trackingEnabled: true,
        trackingActive: true,
      });
      await locationSheet.props.onAllow();
    });

    expect(mockEnable).toHaveBeenCalledTimes(1);
    expect(renderer!.root.findAllByType(Switch)[1].props.value).toBe(true);

    await act(async () => {
      await renderer!.root.findAllByType(Switch)[1].props.onValueChange(false);
    });

    expect(mockDisable).toHaveBeenCalledTimes(1);
    expect(renderer!.root.findAllByType(Switch)[1].props.value).toBe(false);
  });

  it('does not request location when the access sheet is dismissed', async () => {
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<PrivacySettingsScreen />);
    });

    await act(async () => {
      await renderer!.root.findAllByType(Switch)[1].props.onValueChange(true);
    });
    const locationSheet = renderer!.root.find(
      node =>
        node.type === View && node.props.testID === 'location-access-sheet',
    );

    await act(async () => {
      locationSheet.props.onNotNow();
    });

    expect(mockEnable).not.toHaveBeenCalled();
    expect(mockDecline).toHaveBeenCalledTimes(1);
  });

  it('shows an inactive watch as off and retries without a permission prompt', async () => {
    mockGetPermissionStatus.mockResolvedValue('granted');
    mockGetState.mockResolvedValue({
      permissionStatus: 'granted',
      trackingEnabled: true,
      trackingActive: false,
    });
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<PrivacySettingsScreen />);
    });

    expect(renderer!.root.findAllByType(Switch)[1].props.value).toBe(false);
    mockGetState.mockResolvedValue({
      permissionStatus: 'granted',
      trackingEnabled: true,
      trackingActive: true,
    });
    await act(async () => {
      await renderer!.root.findAllByType(Switch)[1].props.onValueChange(true);
    });

    expect(mockEnable).toHaveBeenCalledTimes(1);
    expect(
      renderer!.root.find(
        node =>
          node.type === View && node.props.testID === 'location-access-sheet',
      ).props.visible,
    ).toBe(false);
    expect(renderer!.root.findAllByType(Switch)[1].props.value).toBe(true);
  });
});
