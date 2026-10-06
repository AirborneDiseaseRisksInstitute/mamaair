import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SignUpScreen } from '../src/screens/auth/SignUpScreen';
import { clearAuthRequestCooldowns } from '../src/hooks/useAuthRequestCooldown';

const mockRegisterWithEmail = jest.fn();
const mockResendEmailVerification = jest.fn();
const mockSetTokens = jest.fn();
const mockSetEmail = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../src/services/api/AuthService', () => ({
  AuthService: {
    registerWithEmail: (...args: unknown[]) => mockRegisterWithEmail(...args),
    resendEmailVerification: (...args: unknown[]) =>
      mockResendEmailVerification(...args),
  },
}));

jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: object) => unknown) =>
    selector({ setTokens: mockSetTokens }),
}));

jest.mock('../src/store/useUserStore', () => ({
  useUserStore: (selector: (state: object) => unknown) =>
    selector({ setEmail: mockSetEmail }),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() },
  isSuccessResponse: jest.fn(),
  isErrorWithCode: jest.fn(),
  statusCodes: {},
}));

jest.mock('@fortawesome/react-native-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { seconds?: number }) =>
      options?.seconds ? `${key}:${options.seconds}` : key,
  }),
}));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  radius: () => 8,
  useTheme: () => ({
    mode: 'light',
    surfaceColor: (value: string) => value,
    borderColor: (value: string) => value,
    accentTextColor: (value: string) => value,
    colors: {
      background: '#fff',
      orange500: '#f80',
      neutral300: '#ddd',
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
    VerificationCodeInput: () => null,
    useToast: () => ({ showToast: mockShowToast }),
  };
});

describe('SignUpScreen legal acknowledgement', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearAuthRequestCooldowns();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const fillValidSignUpForm = async (renderer: TestRenderer.ReactTestRenderer) => {
    const fill = async (field: string, value: string) => {
      await act(async () => {
        renderer.root.findByProps({ testID: `input-${field}` }).props.onChangeText(value);
      });
    };

    await fill('auth.email', 'test@example.com');
    await fill('auth.password', 'password123');
    await fill('auth.confirm_password', 'password123');
    await act(async () => renderer.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress());
  };

  it('does not send registration until the acknowledgement is checked', async () => {
    mockRegisterWithEmail.mockResolvedValue({});
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignUpScreen />);
    });

    const fill = async (field: string, value: string) => {
      await act(async () => {
        renderer!.root.findByProps({ testID: `input-${field}` }).props.onChangeText(value);
      });
    };
    await fill('auth.email', 'test@example.com');
    await fill('auth.password', 'password123');
    await fill('auth.confirm_password', 'password123');

    const button = () => renderer!.root.findByProps({ testID: 'button-auth.sign_up' });
    expect(button().props.disabled).toBe(true);
    await act(async () => button().props.onPress());
    expect(mockRegisterWithEmail).not.toHaveBeenCalled();

    await act(async () => renderer!.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress());
    expect(button().props.disabled).toBe(false);
    await act(async () => button().props.onPress());
    expect(mockRegisterWithEmail).toHaveBeenCalledWith(
      'test@example.com',
      'password123',
    );
    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.registration_email_instructions',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findByProps({ testID: 'button-auth.go_to_login' }),
    ).toBeDefined();
    expect(
      renderer!.root.findByProps({ testID: 'email-spam-folder-hint' }).props
        .children,
    ).toBe('auth.email_spam_folder_hint');
    const resend = renderer!.root.findByProps({
      testID: 'signup-resend-verification',
    });
    expect(resend.props.disabled).toBe(true);
    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.resend_in:60',
      ).length,
    ).toBeGreaterThan(0);
    await act(async () => resend.props.onPress());
    expect(mockResendEmailVerification).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    const enabledResend = renderer!.root.findByProps({
      testID: 'signup-resend-verification',
    });
    expect(enabledResend.props.disabled).toBe(false);
    await act(async () => enabledResend.props.onPress());
    expect(mockResendEmailVerification).toHaveBeenCalledWith('test@example.com');
  });

  it('requires matching passwords before registration', async () => {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignUpScreen />);
    });

    const fill = async (field: string, value: string) => {
      await act(async () => {
        renderer!.root.findByProps({ testID: `input-${field}` }).props.onChangeText(value);
      });
    };
    await fill('auth.email', 'test@example.com');
    await fill('auth.password', 'password123');
    await fill('auth.confirm_password', 'different-password');
    await act(async () => {
      renderer!.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress();
    });

    expect(
      renderer!.root.findByProps({ testID: 'signup-password-error' }).props
        .children,
    ).toBe('validation.passwords_do_not_match');
    const button = renderer!.root.findByProps({ testID: 'button-auth.sign_up' });
    expect(button.props.disabled).toBe(true);
    await act(async () => button.props.onPress());
    expect(mockRegisterWithEmail).not.toHaveBeenCalled();
  });

  it('shows a specific backend password validation error inline', async () => {
    mockRegisterWithEmail.mockRejectedValue({
      response: {
        status: 400,
        data: { password: ['This password is too common.'] },
      },
    });
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignUpScreen />);
    });

    await fillValidSignUpForm(renderer!);
    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-auth.sign_up' }).props.onPress();
    });

    expect(
      renderer!.root.findByProps({ testID: 'signup-password-error' }).props
        .children,
    ).toBe('auth.error_password_too_common');
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'auth.sign_up_failed',
      message: 'auth.error_password_too_common',
    });

    await act(async () => {
      renderer!.root
        .findByProps({ testID: 'input-auth.password' })
        .props.onChangeText('a-stronger-password');
      renderer!.root
        .findByProps({ testID: 'input-auth.confirm_password' })
        .props.onChangeText('a-stronger-password');
    });
    expect(
      renderer!.root.findAllByProps({ testID: 'signup-password-error' }),
    ).toHaveLength(0);
  });

  it('routes existing verified email conflicts to login and password recovery', async () => {
    mockRegisterWithEmail.mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'account_exists' },
      },
    });
    const onLogin = jest.fn();
    const onForgotPassword = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(
        <SignUpScreen onLogin={onLogin} onForgotPassword={onForgotPassword} />,
      );
    });

    await fillValidSignUpForm(renderer!);
    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-auth.sign_up' }).props.onPress();
    });

    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.account_exists_title',
      ),
    ).toHaveLength(2);
    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-auth.go_to_login' }).props.onPress();
    });
    await act(async () => {
      renderer!.root.findByProps({ testID: 'signup-recover-password' }).props.onPress();
    });

    expect(onLogin).toHaveBeenCalledTimes(1);
    expect(onForgotPassword).toHaveBeenCalledTimes(1);
    expect(mockResendEmailVerification).not.toHaveBeenCalled();
  });

  it('prompts unverified existing emails to resend verification only on user action', async () => {
    mockRegisterWithEmail.mockRejectedValue({
      response: {
        status: 409,
        data: { code: 'email_verification_required' },
      },
    });
    mockResendEmailVerification.mockResolvedValue({});
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignUpScreen />);
    });

    await fillValidSignUpForm(renderer!);
    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-auth.sign_up' }).props.onPress();
    });

    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.verification_required_title',
      ),
    ).toHaveLength(2);
    expect(
      renderer!.root.findByProps({ testID: 'email-spam-folder-hint' }).props
        .children,
    ).toBe('auth.email_spam_folder_hint');
    expect(mockResendEmailVerification).not.toHaveBeenCalled();

    await act(async () => {
      renderer!.root
        .findByProps({ testID: 'button-auth.resend_verification_email' })
        .props.onPress();
    });

    expect(mockResendEmailVerification).toHaveBeenCalledWith('test@example.com');
  });

  it('trims email and prevents duplicate registration requests', async () => {
    let finishRegistration!: (value: object) => void;
    mockRegisterWithEmail.mockImplementation(
      () => new Promise(resolve => { finishRegistration = resolve; }),
    );
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignUpScreen />);
    });

    const fill = async (field: string, value: string) => {
      await act(async () => {
        renderer!.root.findByProps({ testID: `input-${field}` }).props.onChangeText(value);
      });
    };
    await fill('auth.email', ' test@example.com ');
    await fill('auth.password', ' password123 ');
    await fill('auth.confirm_password', ' password123 ');
    await act(async () => {
      renderer!.root.findByProps({ accessibilityRole: 'checkbox' }).props.onPress();
    });

    const signUp = renderer!.root.findByProps({ testID: 'button-auth.sign_up' });
    await act(async () => {
      signUp.props.onPress();
      signUp.props.onPress();
    });
    expect(mockRegisterWithEmail).toHaveBeenCalledTimes(1);
    expect(mockRegisterWithEmail).toHaveBeenCalledWith(
      'test@example.com',
      ' password123 ',
    );

    await act(async () => finishRegistration({}));
    await act(async () => {
      renderer!.root.findByProps({ testID: 'signup-edit-email' }).props.onPress();
    });
    expect(renderer!.root.findByProps({ testID: 'input-auth.email' }).props.value).toBe(
      ' test@example.com ',
    );
  });

  it('uses Retry-After to rate-limit another registration attempt', async () => {
    mockRegisterWithEmail.mockRejectedValue({
      response: {
        status: 429,
        headers: { 'retry-after': '12' },
      },
    });
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignUpScreen />);
    });

    await fillValidSignUpForm(renderer!);
    await act(async () => {
      renderer!.root.findByProps({ testID: 'button-auth.sign_up' }).props.onPress();
    });

    const retryButton = renderer!.root.findByProps({
      testID: 'button-auth.request_again_in:12',
    });
    expect(retryButton.props.disabled).toBe(true);
    await act(async () => retryButton.props.onPress());
    expect(mockRegisterWithEmail).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'error',
      title: 'auth.too_many_requests_title',
      message: 'auth.too_many_requests_message:12',
    });
  });
});
