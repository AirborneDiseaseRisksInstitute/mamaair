import React from 'react';
import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { IntroDataConsentScreen } from '../src/screens/intro/IntroDataConsentScreen';

const mockPatchProfile = jest.fn();
const mockSetAgreementAccepted = jest.fn();

jest.mock('../src/services/api/ProfileService', () => ({
  ProfileService: { patchProfile: (...args: unknown[]) => mockPatchProfile(...args) },
}));

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: (selector: (state: object) => unknown) =>
    selector({ setAgreementAccepted: mockSetAgreementAccepted }),
}));

jest.mock('../src/config/dev', () => ({ DEV_LOCAL_SESSION: false }));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  useTheme: () => ({
    colors: { orange500: '#f80', textPrimary: '#111', textSecondary: '#666' },
  }),
}));

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const { Pressable: NativePressable, Text: NativeText, View: NativeView } = require('react-native');
  return {
    Button: ({ title, onPress, disabled }: any) =>
      ReactModule.createElement(
        NativePressable,
        { testID: 'continue-button', onPress, disabled },
        ReactModule.createElement(NativeText, null, title),
      ),
    FixedButtonContainer: ({ children }: any) =>
      ReactModule.createElement(NativeView, null, children),
  };
});

describe('IntroDataConsentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPatchProfile.mockResolvedValue({ consent: true });
  });

  it('requires explicit consent before entering the health-data intro', async () => {
    const onContinue = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <IntroDataConsentScreen onContinue={onContinue} onOpenLegal={jest.fn()} />,
      );
    });

    const button = () => renderer!.root.findByProps({ testID: 'continue-button' });
    expect(button().props.disabled).toBe(true);
    expect(mockPatchProfile).not.toHaveBeenCalled();

    const checkbox = renderer!.root.findByProps({ accessibilityRole: 'checkbox' });
    await act(async () => checkbox.props.onPress());
    expect(button().props.disabled).toBe(false);

    await act(async () => button().props.onPress());
    expect(mockPatchProfile).toHaveBeenCalledWith({ consent: true });
    expect(mockSetAgreementAccepted).toHaveBeenCalledWith(true);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('does not advance or store consent when server save fails', async () => {
    mockPatchProfile.mockRejectedValue(new Error('offline'));
    const onContinue = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <IntroDataConsentScreen onContinue={onContinue} onOpenLegal={jest.fn()} />,
      );
    });

    const checkbox = renderer!.root.findByProps({ accessibilityRole: 'checkbox' });
    await act(async () => checkbox.props.onPress());
    await act(async () => renderer!.root.findByProps({ testID: 'continue-button' }).props.onPress());

    expect(mockSetAgreementAccepted).not.toHaveBeenCalled();
    expect(onContinue).not.toHaveBeenCalled();
    expect(renderer!.root.findAllByType(Text).some(
      node => node.props.children === 'legal.health_save_error',
    )).toBe(true);
  });
});
