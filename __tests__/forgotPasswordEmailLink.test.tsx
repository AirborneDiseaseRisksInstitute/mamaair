import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { ForgotPasswordScreen } from '../src/screens/auth/ForgotPasswordScreen';

const mockRequestPasswordReset = jest.fn();
const mockShowToast = jest.fn();

jest.mock('../src/services/api/AuthService', () => ({
  AuthService: {
    requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
  },
}));

jest.mock('react-native-svg', () => ({ SvgXml: () => null }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('../src/theme', () => ({
  spacing: () => 8,
  useTheme: () => ({
    colors: {
      background: '#fff',
      orange500: '#f80',
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
    jest.clearAllMocks();
    mockRequestPasswordReset.mockResolvedValue({ detail: 'accepted' });
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
    expect(renderer!.root.findAllByProps({ testID: 'verification-code' })).toHaveLength(0);
  });
});
