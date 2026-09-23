import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SignUpScreen } from '../src/screens/auth/SignUpScreen';

const mockRegisterWithEmail = jest.fn();
const mockSetTokens = jest.fn();
const mockSetEmail = jest.fn();

jest.mock('../src/services/api/AuthService', () => ({
  AuthService: { registerWithEmail: (...args: unknown[]) => mockRegisterWithEmail(...args) },
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
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../src/theme', () => ({
  spacing: () => 8,
  radius: () => 8,
  useTheme: () => ({
    colors: {
      background: '#fff',
      orange500: '#f80',
      neutral300: '#ddd',
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
    useToast: () => ({ showToast: jest.fn() }),
  };
});

describe('SignUpScreen legal acknowledgement', () => {
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
    expect(mockRegisterWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(
      renderer!.root.findAll(
        node => node.props.children === 'auth.registration_email_instructions',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      renderer!.root.findByProps({ testID: 'button-auth.go_to_login' }),
    ).toBeDefined();
  });
});
