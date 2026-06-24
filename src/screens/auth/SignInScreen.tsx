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
import { Input, Button, OrangeHalo, type InputRef, useToast, LanguagePickerSheet } from '../../components/ui';
import { AuthService } from '../../services/api/AuthService';
import { getAuthErrorMessage } from '../../utils/authErrors';
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
import { DEV_MODE } from '../../config/dev';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SignInScreenProps {
  onLogin?: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  onGoogleSignIn?: () => void;
  onSignUp?: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onLogin,
  onForgotPassword,
  onGoogleSignIn: _onGoogleSignIn,
  onSignUp,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const setTokens = useAuthStore(state => state.setTokens);
  const { setEmail: setEmailStore, setLanguage, profile } = useUserStore();
  const [showLangSheet, setShowLangSheet] = useState(true);

  const emailInputRef = useRef<InputRef>(null);
  const passwordInputRef = useRef<InputRef>(null);

  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: '212373353528-fe2pe6nb9i7n65gm306lsp5lno1ep68n.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken;
        if (idToken) {
            setLoading(true);
            const authResponse = await AuthService.googleSignIn(idToken);
            if (authResponse.access && authResponse.refresh) {
                setTokens(authResponse.access, authResponse.refresh);
                if (authResponse.user?.email) {
                    setEmailStore(authResponse.user.email);
                }
                if (onLogin) {
                    onLogin(authResponse.user?.email || '', '');
                }
            }
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
              message: t('auth.google_sign_in_failed'),
            });
        }
      } else {
        console.error('Google Sign-In Error', error);
        showToast({
          type: 'error',
          title: t('auth.google_sign_in_error'),
          message: t('auth.google_sign_in_failed'),
        });
      }
    } finally {
        setLoading(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    langButton: {
      position: 'absolute',
      top: spacing('lg'),
      right: spacing('md'),
      zIndex: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.orange100,
      justifyContent: 'center',
      alignItems: 'center',
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
    forgotPasswordContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: spacing('xs'),
      marginBottom: spacing('lg'),
    },
    loginButtonContainer: {
      marginTop: spacing('md'),
      marginBottom: spacing('md'),
    },
    forgotPasswordText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    resetHereText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
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
    googleButtonContainer: {
      width: '100%',
      marginBottom: spacing('lg'),
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
    devLoginButton: {
      marginTop: spacing('sm'),
      paddingVertical: 10,
      paddingHorizontal: spacing('md'),
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#FF6900',
      alignItems: 'center',
    },
    devLoginText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.medium,
      color: '#FF6900',
    },
    signUpContainer: {
      alignItems: 'center',
      marginTop: spacing('sm'),
      marginBottom: spacing('md'),
    },
    bottomSection: {
      paddingBottom: spacing('md'),
    },
    signUpText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textSecondary,
    },
  }), [theme]);

  const handleLogin = async () => {
    if (email.trim() && password.trim()) {
      try {
        setLoading(true);
        const response = await AuthService.login(email.trim(), password.trim());

        if (response.access && response.refresh) {
          setTokens(response.access, response.refresh);
          setEmailStore(email.trim());
          showToast({
            type: 'success',
            title: t('auth.logged_in_title'),
            message: t('auth.logged_in_message'),
          });
          onLogin?.(email, password);
        } else {
          showToast({
            type: 'error',
            title: t('auth.login_failed'),
            message: t('auth.login_error'),
          });
        }
      } catch (error: any) {
        console.error('Login error:', error);
        showToast({
          type: 'error',
          title: t('auth.login_failed'),
          message: getAuthErrorMessage(error, 'login'),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // DEV ONLY — remove before production
  const handleDevLogin = async () => {
    const DEV_EMAIL = 'emulator@dev.local';
    const DEV_PASS = 'EmulatorDev2026!';
    setDevLoading(true);
    try {
      let response = await AuthService.login(DEV_EMAIL, DEV_PASS).catch(() => null);
      if (!response?.access) {
        await AuthService.register(DEV_EMAIL, DEV_PASS).catch(() => {});
        response = await AuthService.login(DEV_EMAIL, DEV_PASS);
      }
      if (response?.access && response?.refresh) {
        setTokens(response.access, response.refresh);
        setEmailStore(DEV_EMAIL);
        onLogin?.(DEV_EMAIL, DEV_PASS);
      }
    } catch {
      showToast({ type: 'error', title: 'Dev login failed', message: 'Check API connectivity.' });
    } finally {
      setDevLoading(false);
    }
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
      {/* Language picker trigger */}
      <TouchableOpacity
        style={styles.langButton}
        onPress={() => setShowLangSheet(true)}
        activeOpacity={0.7}
      >
        <FontAwesomeIcon icon={faGlobe as any} size={16} color={theme.colors.orange500} />
      </TouchableOpacity>

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
            <Text style={styles.welcomeText} allowFontScaling={false}>{t('auth.welcome_back')}</Text>

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
              />
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={onForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText} allowFontScaling={false}>{t('auth.forgot_password_prompt')} </Text>
              <Text style={styles.resetHereText} allowFontScaling={false}>{t('auth.reset_here')}</Text>
            </TouchableOpacity>

            {/* Log in Button */}
            <View style={styles.loginButtonContainer}>
              <Button
                title={loading ? t('auth.logging_in') : t('auth.log_in')}
                onPress={handleLogin}
                disabled={loading || !email.trim() || !password.trim()}
              />
            </View>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={styles.signUpContainer}
              onPress={onSignUp}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpText} allowFontScaling={false}>{t('auth.create_new_account')}</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Section */}
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
              activeOpacity={0.7}
            >
              <GoogleIcon />
              <Text style={styles.googleButtonText} allowFontScaling={false}>{t('auth.continue_with_google')}</Text>
            </TouchableOpacity>

            {/* ⚠️ DEV ONLY — controlled by DEV_ENABLED in src/config/dev.ts */}
            {DEV_MODE && (
              <TouchableOpacity
                style={styles.devLoginButton}
                onPress={handleDevLogin}
                activeOpacity={0.7}
                disabled={devLoading}
              >
                <Text style={styles.devLoginText} allowFontScaling={false}>
                  {devLoading ? 'Logging in...' : '[DEV] Emulator Login'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <LanguagePickerSheet
        visible={showLangSheet}
        selectedLanguage={profile.language || null}
        onConfirm={(lang) => {
          setLanguage(lang);
          setShowLangSheet(false);
        }}
        onClose={() => setShowLangSheet(false)}
      />
    </SafeAreaView>
  );
};
