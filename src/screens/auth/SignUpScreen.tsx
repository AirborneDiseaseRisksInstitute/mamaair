import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme, spacing, radius } from '../../theme';
import {
  Input,
  Button,
  OrangeHalo,
  VerificationCodeInput,
  type InputRef,
  useToast,
} from '../../components/ui';
import { AuthService, type LoginResponse } from '../../services/api/AuthService';
import { s, vs, ms, mvs } from '../../utils/responsive';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserStore } from '../../store/useUserStore';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { getAuthErrorMessage } from '../../utils/authErrors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SignUpScreenProps {
  onSignUp?: (email: string, password: string) => void;
  onLogin?: () => void;
  onGoogleSignIn?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUp,
  onLogin,
  onGoogleSignIn: _onGoogleSignIn,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const setTokens = useAuthStore(state => state.setTokens);
  const setEmailStore = useUserStore(state => state.setEmail);

  const emailInputRef = useRef<InputRef>(null);
  const passwordInputRef = useRef<InputRef>(null);
  const confirmPasswordInputRef = useRef<InputRef>(null);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '212373353528-fe2pe6nb9i7n65gm306lsp5lno1ep68n.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (idToken) {
          const authResponse = await AuthService.googleSignIn(idToken);
          setTokens(authResponse.access, authResponse.refresh);
          if (authResponse.user?.email) {
            setEmailStore(authResponse.user.email);
          }
          onSignUp?.(authResponse.user?.email || '', '');
        } else {
          showToast({
            type: 'error',
            title: t('auth.google_sign_in_error'),
            message: t('auth.google_sign_in_failed'),
          });
        }
      } else {
        // sign in was cancelled by user
      }
    } catch (error: any) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // user cancelled the login flow
            break;
          case statusCodes.IN_PROGRESS:
            // operation (e.g. sign in) is in progress already
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            showToast({
              type: 'error',
              title: t('auth.google_sign_in_error'),
              message: t('auth.google_play_services_error'),
            });
            break;
          default:
            console.error('Google Sign-In Error', error);
            showToast({
              type: 'error',
              title: t('auth.google_sign_in_error'),
              message: getAuthErrorMessage(error, 'google'),
            });
        }
      } else {
        console.error('Google Sign-In Error', error);
        showToast({
          type: 'error',
          title: t('auth.google_sign_in_error'),
          message: getAuthErrorMessage(error, 'google'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      minHeight: SCREEN_HEIGHT * 0.9,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      justifyContent: 'space-between',
    },
    topSection: {
      flex: 1,
    },
    logoContainer: {
      alignItems: 'center',
      paddingTop: spacing('lg'),
      marginBottom: mvs(48),
    },
    logo: {
      width: s(140),
      height: vs(48),
      resizeMode: 'contain',
    },
    welcomeText: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing('lg'),
    },
    inputContainer: {
      marginTop: spacing('sm'),
    },
    signUpButtonContainer: {
      marginTop: spacing('md'),
      marginBottom: spacing('md'),
    },
    codeContainer: {
      marginTop: spacing('md'),
      marginBottom: spacing('lg'),
    },
    verificationDescription: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing('md'),
    },
    sentText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing('lg'),
      lineHeight: 20,
    },
    resendButton: {
      alignItems: 'center',
      marginTop: spacing('lg'),
    },
    resendText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
    },
    loginLinkContainer: {
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    bottomSection: {
      paddingBottom: spacing('md'),
    },
    loginLinkText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    loginLinkBold: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    separatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: spacing('md'),
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.neutral300,
    },
    separatorText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginHorizontal: spacing('md'),
    },
    googleButton: {
      height: ms(58),
      backgroundColor: theme.colors.background,
      borderRadius: radius('md'),
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleButtonText: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
      marginLeft: spacing('md'),
    },
  }), [theme]);

  const handleSignUp = async () => {
    if (!isFormValid) return;
    const nextEmail = email.trim();

    try {
      setLoading(true);
      await AuthService.registerWithEmail(nextEmail, password.trim());
      setVerificationEmail(nextEmail);
      setVerificationCode('');
      setVerificationError(null);
      setStep('verify');
      showToast({
        type: 'success',
        title: t('auth.verification_code_sent_title'),
        message: t('auth.verification_code_sent_message', { email: nextEmail }),
      });
    } catch (error: any) {
      console.error('Email registration error:', error);
      showToast({
        type: 'error',
        title: t('auth.sign_up_failed'),
        message: getAuthErrorMessage(error, 'signup'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationCodeChange = (code: string) => {
    setVerificationCode(code);
    if (verificationError) {
      setVerificationError(null);
    }
  };

  const handleVerifyCode = async (code = verificationCode) => {
    if (code.length < 4) return;

    try {
      setLoading(true);
      const nextEmail = verificationEmail || email.trim();
      const response = await AuthService.verifyEmailRegistration(nextEmail, code);
      const tokenResponse: LoginResponse = response.access && response.refresh
        ? { access: response.access, refresh: response.refresh }
        : await AuthService.login(nextEmail, password.trim());

      setTokens(tokenResponse.access, tokenResponse.refresh);
      setEmailStore(nextEmail);
      showToast({
        type: 'success',
        title: t('auth.account_created_title'),
        message: t('auth.account_created_message'),
      });
      onSignUp?.(nextEmail, password);
    } catch (error: any) {
      console.error('Email verification error:', error);
      setVerificationError(getAuthErrorMessage(error, 'verification'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    const nextEmail = verificationEmail || email.trim();

    try {
      setLoading(true);
      await AuthService.resendEmailVerification(nextEmail);
      setVerificationCode('');
      setVerificationError(null);
      showToast({
        type: 'success',
        title: t('auth.verification_code_sent_title'),
        message: t('auth.verification_code_sent_message', {
          email: nextEmail,
        }),
      });
    } catch (error: any) {
      console.error('Email verification resend error:', error);
      setVerificationError(getAuthErrorMessage(error, 'verification'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setStep('details');
    setVerificationCode('');
    setVerificationError(null);
  };

  const GoogleIcon = () => (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <G>
        <Path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <Path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <Path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <Path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </G>
    </Svg>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Background halo */}
      <OrangeHalo position="center" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Top Section */}
          <View style={styles.topSection}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logoBlack.png')}
                style={styles.logo}
              />
            </View>

            {/* Welcome Text */}
            <Text style={styles.welcomeText} allowFontScaling={false}>
              {step === 'details'
                ? t('auth.new_here')
                : t('auth.verify_email_title')}
            </Text>

            {step === 'details' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Input
                    ref={emailInputRef}
                    title={t('auth.email')}
                    placeholder={t('auth.email_placeholder')}
                    type="email"
                    value={email}
                    onChangeText={setEmail}
                    nextInputRef={passwordInputRef}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Input
                    ref={passwordInputRef}
                    title={t('auth.password')}
                    placeholder={t('auth.password_placeholder')}
                    type="password"
                    value={password}
                    onChangeText={setPassword}
                    nextInputRef={confirmPasswordInputRef}
                  />
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Input
                    ref={confirmPasswordInputRef}
                    title={t('auth.confirm_password')}
                    placeholder={t('auth.confirm_password_placeholder')}
                    type="password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onSubmitEditing={handleSignUp}
                  />
                </View>

                {/* Sign Up Button */}
                <View style={styles.signUpButtonContainer}>
                  <Button
                    title={loading ? t('auth.sending_code') : t('auth.send_verification_code')}
                    onPress={handleSignUp}
                    disabled={loading || !isFormValid}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.verificationDescription} allowFontScaling={false}>
                  {t('auth.enter_verification_code_description')}
                </Text>
                <Text style={styles.sentText} allowFontScaling={false}>
                  {t('auth.verification_code_sent_message', {
                    email: verificationEmail,
                  })}
                </Text>
                <View style={styles.codeContainer}>
                  <VerificationCodeInput
                    value={verificationCode}
                    onChangeText={handleVerificationCodeChange}
                    error={verificationError}
                    onComplete={handleVerifyCode}
                  />
                </View>
                <View style={styles.signUpButtonContainer}>
                  <Button
                    title={loading ? t('auth.verifying_code') : t('auth.verify_code')}
                    onPress={handleVerifyCode}
                    disabled={loading || verificationCode.length < 4}
                  />
                </View>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendCode}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText} allowFontScaling={false}>
                    {t('auth.resend_code')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLinkContainer}
              onPress={step === 'details' ? onLogin : handleEditDetails}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText} allowFontScaling={false}>
                {step === 'details'
                  ? t('auth.already_have_account')
                  : t('auth.wrong_email')}{' '}
                <Text style={styles.loginLinkBold} allowFontScaling={false}>
                  {step === 'details' ? t('auth.log_in') : t('auth.edit_email')}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Section */}
          {step === 'details' ? (
          <View style={[styles.bottomSection, { paddingBottom: spacing('md') + insets.bottom }]}>
            {/* Separator */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText} allowFontScaling={false}>{t('common.or')}</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.7}
            >
              <GoogleIcon />
              <Text style={styles.googleButtonText} allowFontScaling={false}>{t('auth.continue_with_google')}</Text>
            </TouchableOpacity>
          </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
