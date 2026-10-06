import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ForgotPasswordScreen } from '../src/screens/auth/ForgotPasswordScreen';
import { clearAuthRequestCooldowns } from '../src/hooks/useAuthRequestCooldown';

const mockRequestPasswordReset = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../src/services/api/AuthService', () => ({
  AuthService: {
    requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
  },
}));

jest.mock('react-native-svg', () => ({ SvgXml: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { seconds?: number }) =>
      options?.seconds ? `${key}:${options.seconds}` : key,
  }),
}));
jest.mock('../src/theme', () => ({
  spacing: () => 8,
  useTheme: () => ({
    mode: 'light',
    surfaceColor: (value: string) => value,
    borderColor: (value: string) => value,
    accentTextColor: (value: string) => value,
    colors: {
      background: '#fff',
      orange500: '#f80',
      neutral600: '#888',
      textPrimary: '#111',
      textSecondary: '#666',
    },
    typography: {
      fontFamily: { bold: 'Bold', regular: 'Regular', medium: 'Medium' },
      fontSize: { sm: 12, md: 14, xl: 22 },
    },
  }),
}));
jest.mock('../src/components/ui', () => {
  const ReactModule = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    Input: ({ title, value, onChangeText }: any) =>
      ReactModule.createElement(View, { testID: `input-${title}`, value, onChangeText }),
    Button: ({ title, onPress, disabled }: any) =>
      ReactModule.createElement(
        Pressable,
        { testID: `button-${title}`, onPress, disabled },
        ReactModule.createElement(Text, null, title),
      ),
    OrangeHalo: () => null,
    BackButton: () => null,
    useToast: () => ({ showToast: mockShowToast }),
  };
});

describe('ForgotPasswordScreen email-link flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearAuthRequestCooldowns();
    jest.clearAllMocks();
    mockRequestPasswordReset.mockResolvedValue({ detail: 'accepted' });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('requests a reset email and shows link instructions instead of a code input', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ForgotPasswordScreen />);
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'input-auth.email' }).props.onChangeText(
        'verified@example.com',
      );
    });
    await act(async () => {
      await renderer!.root.findByProps({ testID: 'button-auth.send_reset_link' }).props.onPress();
    });

    expect(mockRequestPasswordReset).toHaveBeenCalledWith('verified@example.com');
    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.password_reset_email_instructions',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findByProps({ testID: 'button-auth.go_to_login' }),
    ).toBeDefined();
    expect(
      renderer!.root.findByProps({ testID: 'email-spam-folder-hint' }).props
        .children,
    ).toBe('auth.email_spam_folder_hint');
    expect(renderer!.root.findAllByProps({ testID: 'verification-code' })).toHaveLength(0);
    const resend = renderer!.root.findByProps({
      testID: 'forgot-password-resend',
    });
    expect(resend.props.disabled).toBe(true);
    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.resend_in:60',
      ).length,
    ).toBeGreaterThan(0);
    await act(async () => resend.props.onPress());
    expect(mockRequestPasswordReset).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    const enabledResend = renderer!.root.findByProps({
      testID: 'forgot-password-resend',
    });
    expect(enabledResend.props.disabled).toBe(false);
    await act(async () => enabledResend.props.onPress());
    expect(mockRequestPasswordReset).toHaveBeenCalledTimes(2);
  });

  it('does not send a reset request for an invalid email', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ForgotPasswordScreen />);
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'input-auth.email' }).props.onChangeText(
        'not-an-email',
      );
    });
    const button = renderer!.root.findByProps({
      testID: 'button-auth.send_reset_link',
    });
    expect(button.props.disabled).toBe(true);
    await act(async () => button.props.onPress());
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });

  it('keeps the email cooldown when the screen is reopened', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ForgotPasswordScreen />);
    });
    await act(async () => {
      renderer!.root.findByProps({ testID: 'input-auth.email' }).props.onChangeText(
        'verified@example.com',
      );
    });
    await act(async () => {
      await renderer!.root.findByProps({ testID: 'button-auth.send_reset_link' }).props.onPress();
    });
    await act(async () => renderer!.unmount());

    await act(async () => {
      renderer = TestRenderer.create(<ForgotPasswordScreen />);
    });
    await act(async () => {
      renderer!.root.findByProps({ testID: 'input-auth.email' }).props.onChangeText(
        'verified@example.com',
      );
    });

    expect(
      renderer!.root.findByProps({ testID: 'button-auth.request_again_in:60' })
        .props.disabled,
    ).toBe(true);
  });

  it('uses Retry-After without revealing whether the email exists', async () => {
    mockRequestPasswordReset.mockRejectedValue({
      response: {
        status: 429,
        headers: { 'Retry-After': '7' },
      },
    });
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ForgotPasswordScreen />);
    });

    await act(async () => {
      renderer!.root.findByProps({ testID: 'input-auth.email' }).props.onChangeText(
        'someone@example.com',
      );
    });
    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-auth.send_reset_link' }).props.onPress();
    });

    const retryButton = renderer!.root.findByProps({
      testID: 'button-auth.request_again_in:7',
    });
    expect(retryButton.props.disabled).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'auth.too_many_requests_title',
      message: 'auth.too_many_requests_message:7',
    });
    expect(renderer!.root.findAllByProps({ testID: 'forgot-password-resend' })).toHaveLength(0);
  });
});
