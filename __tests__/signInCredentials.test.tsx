import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SignInScreen } from '../src/screens/auth/SignInScreen';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_WEB_CLIENT_IDS,
} from '../src/config/googleAuth';

const mockLogin = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockSetTokens = jest.fn();
const mockSetEmail = jest.fn();

jest.mock('../src/services/api/AuthService', () => ({
  AuthService: {
    login: (...args: unknown[]) => mockLogin(...args),
    googleSignIn: (...args: unknown[]) => mockGoogleSignIn(...args),
  },
}));
jest.mock('../src/store/useAuthStore', () => ({
  useAuthStore: (selector: (state: object) => unknown) =>
    selector({ setTokens: mockSetTokens }),
}));
jest.mock('../src/store/useUserStore', () => ({
  useUserStore: () => ({
    setEmail: mockSetEmail,
    setLanguage: jest.fn(),
    profile: { language: 'en' },
  }),
}));
jest.mock('../src/utils/initialLanguagePrompt', () => ({
  consumeInitialLanguagePrompt: () => false,
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
  useTranslation: () => ({ t: (key: string) => key }),
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
      orange100: '#fed',
      orange500: '#f80',
      neutral300: '#ddd',
      textPrimary: '#111',
      textSecondary: '#666',
    },
    typography: {
      fontFamily: { bold: 'Bold', regular: 'Regular', medium: 'Medium' },
      fontSize: { sm: 12, xl: 22 },
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
    LanguagePickerSheet: () => null,
    useToast: () => ({ showToast: jest.fn() }),
  };
});

describe('SignInScreen credentials', () => {
  const googleMock = jest.requireMock(
    '@react-native-google-signin/google-signin',
  ) as {
    GoogleSignin: {
      configure: jest.Mock;
      hasPlayServices: jest.Mock;
      signIn: jest.Mock;
    };
    isSuccessResponse: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetTokens.mockResolvedValue(undefined);
  });

  it('configures Google for the backend ID-token exchange only', async () => {
    await act(async () => {
      TestRenderer.create(<SignInScreen />);
    });

    expect(googleMock.GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
    expect(GOOGLE_WEB_CLIENT_IDS.android).toBe(
      '716499111006-9h05fk2l76bt195t8otb5itrt8jh4gh4.apps.googleusercontent.com',
    );
  });

  it('blocks invalid email and sends the exact password only once', async () => {
    let finishLogin!: (value: object) => void;
    mockLogin.mockImplementation(
      () => new Promise(resolve => { finishLogin = resolve; }),
    );
    const onLogin = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignInScreen onLogin={onLogin} />);
    });

    const fill = async (field: string, value: string) => {
      await act(async () => {
        renderer!.root.findByProps({ testID: `input-${field}` }).props.onChangeText(value);
      });
    };
    const button = () => renderer!.root.findByProps({ testID: 'button-auth.log_in' });
    await fill('auth.email', 'invalid-email');
    await fill('auth.password', ' pass123 ');
    expect(button().props.disabled).toBe(true);

    await fill('auth.email', ' user@example.com ');
    await act(async () => {
      button().props.onPress();
      button().props.onPress();
    });
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('user@example.com', ' pass123 ');

    await act(async () => finishLogin({ access: 'access', refresh: 'refresh' }));
    expect(mockSetTokens).toHaveBeenCalledWith('access', 'refresh');
    expect(onLogin).toHaveBeenCalledWith('user@example.com');
    expect(renderer!.root.findByProps({ testID: 'input-auth.password' }).props.value).toBe('');
  });

  it('waits for secure token persistence before completing Google sign-in', async () => {
    googleMock.GoogleSignin.hasPlayServices.mockResolvedValue(undefined);
    googleMock.GoogleSignin.signIn.mockResolvedValue({
      data: { idToken: 'google-id-token' },
    });
    googleMock.isSuccessResponse.mockReturnValue(true);
    mockGoogleSignIn.mockResolvedValue({
      access: 'google-access',
      refresh: 'google-refresh',
      user: { email: 'google@example.com' },
    });
    let finishSecureWrite!: () => void;
    mockSetTokens.mockImplementationOnce(
      () => new Promise<void>(resolve => { finishSecureWrite = resolve; }),
    );
    const onLogin = jest.fn();
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SignInScreen onLogin={onLogin} />);
    });

    let signInRequest!: Promise<void>;
    act(() => {
      signInRequest = renderer!.root.findByProps({ testID: 'signin-google' })
        .props.onPress();
    });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockGoogleSignIn).toHaveBeenCalledWith('google-id-token');
    expect(mockSetTokens).toHaveBeenCalledWith(
      'google-access',
      'google-refresh',
    );
    expect(onLogin).not.toHaveBeenCalled();

    await act(async () => {
      finishSecureWrite();
      await signInRequest;
    });
    expect(onLogin).toHaveBeenCalledWith('google@example.com');
  });
});
