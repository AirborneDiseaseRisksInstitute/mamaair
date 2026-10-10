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
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing, radius } from '../../theme';
import {
  Input,
  Button,
  OrangeHalo,
  type InputRef,
  useToast,
} from '../../components/ui';
import { AuthService } from '../../services/api/AuthService';
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
import {
  getAuthErrorCode,
  getAuthErrorMessage,
  isPasswordValidationError,
} from '../../utils/authErrors';
import { isValidAuthEmail } from '../../utils/authValidation';
import type { LegalDocumentKind } from '../../content/legalDocuments';
import {
  getRetryAfterSeconds,
  useAuthRequestCooldown,
} from '../../hooks/useAuthRequestCooldown';
import { GOOGLE_WEB_CLIENT_ID } from '../../config/googleAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SignUpScreenProps {
  onSignUp?: (email: string) => void;
  onLogin?: () => void;
  onForgotPassword?: () => void;
  onGoogleSignIn?: () => void;
  onOpenLegal?: (document: LegalDocumentKind) => void;
}

type SignUpStep =
  | 'details'
  | 'checkEmail'
  | 'accountExists'
  | 'verificationRequired';

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUp,
  onLogin,
  onForgotPassword,
  onGoogleSignIn: _onGoogleSignIn,
  onOpenLegal,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidationError, setPasswordValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [step, setStep] = useState<SignUpStep>('details');
  const [verificationEmail, setVerificationEmail] = useState('');
  const setTokens = useAuthStore(state => state.setTokens);
  const setEmailStore = useUserStore(state => state.setEmail);

  const emailInputRef = useRef<InputRef>(null);
  const passwordInputRef = useRef<InputRef>(null);
  const confirmPasswordInputRef = useRef<InputRef>(null);
  const requestInFlightRef = useRef(false);
  const cooldownEmail =
    step === 'details' ? email : verificationEmail || email;
  const {
    secondsRemaining,
    isCoolingDown,
    getRemainingSeconds,
    startCooldown,
  } = useAuthRequestCooldown('registration', cooldownEmail);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const handleGoogleLogin = async () => {
    if (!legalAccepted || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    let signInStage: 'google' | 'backend' | 'secureStorage' = 'google';
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (idToken) {
          signInStage = 'backend';
          const authResponse = await AuthService.googleSignIn(idToken);
          signInStage = 'secureStorage';
          await setTokens(authResponse.access, authResponse.refresh);
          if (authResponse.user?.email) {
            setEmailStore(authResponse.user.email);
          }
          onSignUp?.(authResponse.user?.email || '');
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
      if (__DEV__) {
        console.warn('[GoogleSignIn] Failed', {
          stage: signInStage,
          nativeCode: signInStage === 'google' ? error?.code : undefined,
          httpStatus: error?.response?.status,
          backendCode: error?.response?.data?.code,
          backendDetail:
            error?.response?.data?.detail ?? error?.response?.data?.message,
          requestId: error?.response?.headers?.['x-request-id'],
        });
      }
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
            console.warn('Google Sign-In failed:', error.code);
            showToast({
              type: 'error',
              title: t('auth.google_sign_in_error'),
              message: getAuthErrorMessage(error, 'google', key => t(key)),
            });
        }
      } else {
        console.warn('Google Sign-In failed');
        showToast({
          type: 'error',
          title: t('auth.google_sign_in_error'),
          message: getAuthErrorMessage(error, 'google', key => t(key)),
        });
      }
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch =
    confirmPassword.length > 0 && !passwordsMatch;
  const passwordErrorMessage = showPasswordMismatch
    ? t('validation.passwords_do_not_match')
    : passwordValidationError;
  const isFormValid =
    isValidAuthEmail(email) &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch;

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
    passwordMismatch: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.accentTextColor('#FB2C36'),
      marginTop: -spacing('sm'),
      marginBottom: spacing('sm'),
      marginLeft: spacing('sm'),
    },
    signUpButtonContainer: {
      marginTop: spacing('md'),
      marginBottom: spacing('md'),
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
      marginBottom: spacing('md'),
      lineHeight: 20,
    },
    spamHint: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing('lg'),
      lineHeight: 20,
    },
    accountAction: {
      alignItems: 'center',
      marginTop: spacing('md'),
    },
    accountActionText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
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
    resendTextDisabled: {
      color: theme.colors.neutral600,
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
    legalRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: spacing('lg'),
    },
    legalCheckbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderRadius: 4,
      borderColor: theme.colors.orange500,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing('sm'),
    },
    legalText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    legalLinks: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginLeft: 22 + spacing('sm'),
      marginTop: spacing('xs'),
    },
    legalLink: {
      marginRight: spacing('lg'),
      paddingVertical: spacing('sm'),
    },
    legalLinkText: {
      fontSize: 13,
      color: theme.colors.orange500,
      fontFamily: theme.typography.fontFamily.bold,
      textDecorationLine: 'underline',
    },
  }), [theme]);

  const handleSignUp = async () => {
    if (!isFormValid || !legalAccepted || requestInFlightRef.current) return;
    const nextEmail = email.trim();
    if (getRemainingSeconds(nextEmail) > 0) return;
    requestInFlightRef.current = true;
    setPasswordValidationError('');

    try {
      setLoading(true);
      await AuthService.registerWithEmail(nextEmail, password);
      startCooldown(nextEmail);
      setVerificationEmail(nextEmail);
      setStep('checkEmail');
      showToast({
        type: 'success',
        title: t('auth.check_email_title'),
        message: t('auth.registration_email_link_sent', { email: nextEmail }),
      });
    } catch (error: any) {
      const errorCode = getAuthErrorCode(error);
      if (
        error?.response?.status === 409 &&
        (errorCode === 'account_exists' ||
          errorCode === 'email_verification_required')
      ) {
        setVerificationEmail(nextEmail);
        setStep(
          errorCode === 'email_verification_required'
            ? 'verificationRequired'
            : 'accountExists',
        );
        return;
      }
      if (error?.response?.status === 429) {
        const retryAfterSeconds = getRetryAfterSeconds(error);
        startCooldown(nextEmail, retryAfterSeconds);
        showToast({
          type: 'error',
          title: t('auth.too_many_requests_title'),
          message: t('auth.too_many_requests_message', {
            seconds: retryAfterSeconds,
          }),
        });
        return;
      }
      console.warn('Email registration failed:', error?.response?.status ?? 'network');
      const errorMessage = getAuthErrorMessage(
        error,
        'signup',
        key => t(key),
      );
      if (isPasswordValidationError(error)) {
        setPasswordValidationError(errorMessage);
      }
      showToast({
        type: 'error',
        title: t('auth.sign_up_failed'),
        message: errorMessage,
      });
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (requestInFlightRef.current) return;
    const nextEmail = verificationEmail || email.trim();
    if (getRemainingSeconds(nextEmail) > 0) return;
    requestInFlightRef.current = true;

    try {
      setLoading(true);
      await AuthService.resendEmailVerification(nextEmail);
      startCooldown(nextEmail);
      showToast({
        type: 'success',
        title: t('auth.check_email_title'),
        message: t('auth.registration_email_link_sent', {
          email: nextEmail,
        }),
      });
    } catch (error: any) {
      if (error?.response?.status === 429) {
        const retryAfterSeconds = getRetryAfterSeconds(error);
        startCooldown(nextEmail, retryAfterSeconds);
        showToast({
          type: 'error',
          title: t('auth.too_many_requests_title'),
          message: t('auth.too_many_requests_message', {
            seconds: retryAfterSeconds,
          }),
        });
        return;
      }
      console.warn('Email verification resend failed:', error?.response?.status ?? 'network');
      showToast({
        type: 'error',
        title: t('auth.verification_resend_failed_title'),
        message: getAuthErrorMessage(error, 'verification', key => t(key)),
      });
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setStep('details');
  };

  const getScreenTitle = () => {
    if (step === 'details') return t('auth.new_here');
    if (step === 'accountExists') return t('auth.account_exists_title');
    if (step === 'verificationRequired') {
      return t('auth.verification_required_title');
    }
    return t('auth.check_email_title');
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
                source={theme.mode === 'dark'
                  ? require('../../assets/images/logoWhite.png')
                  : require('../../assets/images/logoBlack.png')}
                style={styles.logo}
              />
            </View>

            {/* Welcome Text */}
            <Text style={styles.welcomeText} allowFontScaling={false}>
              {getScreenTitle()}
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
                    onChangeText={value => {
                      setPassword(value);
                      setPasswordValidationError('');
                    }}
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
                    onChangeText={value => {
                      setConfirmPassword(value);
                      setPasswordValidationError('');
                    }}
                    onSubmitEditing={handleSignUp}
                  />
                </View>
                {passwordErrorMessage ? (
                  <Text
                    testID="signup-password-error"
                    style={styles.passwordMismatch}
                    accessibilityLiveRegion="polite"
                    allowFontScaling={false}
                  >
                    {passwordErrorMessage}
                  </Text>
                ) : null}

                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: legalAccepted }}
                  onPress={() => setLegalAccepted(value => !value)}
                  style={styles.legalRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.legalCheckbox, legalAccepted && { backgroundColor: theme.colors.orange500 }]}>
                    {legalAccepted ? <FontAwesomeIcon icon={faCheck} size={13} color="#fff" /> : null}
                  </View>
                  <Text style={styles.legalText}>{t('legal.signup_accept')}</Text>
                </TouchableOpacity>
                <View style={styles.legalLinks}>
                  {(['terms', 'privacy'] as const).map(document => (
                    <TouchableOpacity
                      key={document}
                      accessibilityRole="link"
                      onPress={() => onOpenLegal?.(document)}
                      style={styles.legalLink}
                    >
                      <Text style={styles.legalLinkText}>{t(`legal.${document}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Sign Up Button */}
                <View style={styles.signUpButtonContainer}>
                  <Button
                    title={
                      loading
                        ? t('auth.creating_account')
                        : isCoolingDown
                          ? t('auth.request_again_in', {
                              seconds: secondsRemaining,
                            })
                          : t('auth.sign_up')
                    }
                    onPress={handleSignUp}
                    disabled={
                      loading ||
                      isCoolingDown ||
                      !isFormValid ||
                      !legalAccepted
                    }
                  />
                </View>
              </>
            ) : step === 'accountExists' ? (
              <>
                <Text style={styles.verificationDescription} allowFontScaling={false}>
                  {t('auth.account_exists_description', {
                    email: verificationEmail,
                  })}
                </Text>
                <View style={styles.signUpButtonContainer}>
                  <Button
                    title={t('auth.go_to_login')}
                    onPress={() => onLogin?.()}
                    disabled={loading}
                  />
                </View>
                <TouchableOpacity
                  testID="signup-recover-password"
                  style={styles.accountAction}
                  onPress={() => onForgotPassword?.()}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accountActionText} allowFontScaling={false}>
                    {t('auth.recover_password')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : step === 'verificationRequired' ? (
              <>
                <Text style={styles.verificationDescription} allowFontScaling={false}>
                  {t('auth.verification_required_description', {
                    email: verificationEmail,
                  })}
                </Text>
                <Text
                  testID="email-spam-folder-hint"
                  style={styles.spamHint}
                  allowFontScaling={false}
                >
                  {t('auth.email_spam_folder_hint')}
                </Text>
                <View style={styles.signUpButtonContainer}>
                  <Button
                    title={
                      loading
                        ? t('auth.sending_email')
                        : isCoolingDown
                          ? t('auth.resend_in', {
                              seconds: secondsRemaining,
                            })
                          : t('auth.resend_verification_email')
                    }
                    onPress={handleResendVerification}
                    disabled={loading || isCoolingDown}
                  />
                </View>
                <TouchableOpacity
                  testID="signup-go-to-login"
                  style={styles.accountAction}
                  onPress={() => onLogin?.()}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accountActionText} allowFontScaling={false}>
                    {t('auth.go_to_login')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.verificationDescription} allowFontScaling={false}>
                  {t('auth.registration_email_instructions')}
                </Text>
                <Text style={styles.sentText} allowFontScaling={false}>
                  {t('auth.registration_email_link_sent', {
                    email: verificationEmail,
                  })}
                </Text>
                <Text
                  testID="email-spam-folder-hint"
                  style={styles.spamHint}
                  allowFontScaling={false}
                >
                  {t('auth.email_spam_folder_hint')}
                </Text>
                <View style={styles.signUpButtonContainer}>
                  <Button
                    title={t('auth.go_to_login')}
                    onPress={() => onLogin?.()}
                    disabled={loading}
                  />
                </View>
                <TouchableOpacity
                  testID="signup-resend-verification"
                  style={styles.resendButton}
                  onPress={handleResendVerification}
                  disabled={loading || isCoolingDown}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading || isCoolingDown }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.resendText,
                      isCoolingDown && styles.resendTextDisabled,
                    ]}
                    allowFontScaling={false}
                  >
                    {loading
                      ? t('auth.sending_email')
                      : isCoolingDown
                        ? t('auth.resend_in', { seconds: secondsRemaining })
                        : t('auth.resend_verification_email')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Login Link */}
            <TouchableOpacity
              testID="signup-edit-email"
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
              testID="signup-google"
              style={[styles.googleButton, !legalAccepted && { opacity: 0.5 }]}
              onPress={handleGoogleLogin}
              disabled={loading || !legalAccepted}
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
