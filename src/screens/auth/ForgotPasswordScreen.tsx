import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../../theme';
import {
  Input,
  Button,
  OrangeHalo,
  BackButton,
  type InputRef,
  useToast,
} from '../../components/ui';
import { useTranslation } from 'react-i18next';
import { mvs, s } from '../../utils/responsive';
import { FORGOT_PASS_ICON_SVG } from '../../utils/svgIcons';
import { AuthService } from '../../services/api/AuthService';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { isValidAuthEmail } from '../../utils/authValidation';
import {
  getRetryAfterSeconds,
  useAuthRequestCooldown,
} from '../../hooks/useAuthRequestCooldown';

interface ForgotPasswordScreenProps {
  onBack?: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [step, setStep] = useState<'email' | 'checkEmail'>('email');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<InputRef>(null);
  const requestInFlightRef = useRef(false);
  const cooldownEmail = step === 'email' ? email : verificationEmail || email;
  const {
    secondsRemaining,
    isCoolingDown,
    getRemainingSeconds,
    startCooldown,
  } = useAuthRequestCooldown('password-reset', cooldownEmail);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      justifyContent: 'flex-start',
    },
    iconContainer: {
      alignItems: 'center',
      marginTop: spacing('xl'),
      marginBottom: spacing('lg'),
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing('sm'),
    },
    description: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing('xl'),
      lineHeight: 22,
    },
    inputContainer: {
      marginTop: spacing('md'),
      marginBottom: spacing('md'),
    },
    buttonContainer: {
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
  }), [theme]);

  const handleResetPassword = async () => {
    const nextEmail = email.trim();
    if (!isValidAuthEmail(nextEmail) || requestInFlightRef.current) return;
    if (getRemainingSeconds(nextEmail) > 0) return;
    requestInFlightRef.current = true;

    try {
      setLoading(true);
      await AuthService.requestPasswordReset(nextEmail);
      startCooldown(nextEmail);
      setVerificationEmail(nextEmail);
      setStep('checkEmail');
      showToast({
        type: 'success',
        title: t('auth.check_email_title'),
        message: t('auth.password_reset_email_link_sent', { email: nextEmail }),
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
      console.warn('Password reset request failed:', error?.response?.status ?? 'network');
      showToast({
        type: 'error',
        title: t('auth.password_reset_failed_title'),
        message: getAuthErrorMessage(error, 'passwordReset', key => t(key)),
      });
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleResendResetEmail = async () => {
    if (requestInFlightRef.current) return;
    const nextEmail = verificationEmail || email.trim();
    if (getRemainingSeconds(nextEmail) > 0) return;
    requestInFlightRef.current = true;

    try {
      setLoading(true);
      await AuthService.requestPasswordReset(nextEmail);
      startCooldown(nextEmail);
      showToast({
        type: 'success',
        title: t('auth.check_email_title'),
        message: t('auth.password_reset_email_link_sent', {
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
      console.warn('Password reset resend failed:', error?.response?.status ?? 'network');
      showToast({
        type: 'error',
        title: t('auth.password_reset_failed_title'),
        message: getAuthErrorMessage(error, 'passwordReset', key => t(key)),
      });
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (step === 'email') return t('auth.forgot_password_title');
    return t('auth.check_email_title');
  };

  const getDescription = () => {
    if (step === 'email') return t('auth.forgot_password_description');
    return t('auth.password_reset_email_instructions');
  };

  const handleBack = () => {
    if (step === 'checkEmail') {
      setStep('email');
      return;
    }
    onBack?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background halo */}
      <OrangeHalo position="center" />

      {/* Back button */}
      <BackButton onPress={handleBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: spacing('xl') + mvs(48) }]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <SvgXml xml={FORGOT_PASS_ICON_SVG} width={s(120)} height={s(120)} />
          </View>

          {/* Title */}
          <Text style={styles.title} allowFontScaling={false}>
            {getTitle()}
          </Text>

          {/* Description */}
          <Text style={styles.description} allowFontScaling={false}>
            {getDescription()}
          </Text>

          {step === 'email' ? (
            <>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Input
                  ref={emailInputRef}
                  title={t('auth.email')}
                  placeholder={t('auth.enter_email_reset')}
                  type="email"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={handleResetPassword}
                />
              </View>

              {/* Reset Password Button */}
              <View style={styles.buttonContainer}>
                <Button
                  title={
                    loading
                      ? t('auth.sending_email')
                      : isCoolingDown
                        ? t('auth.request_again_in', {
                            seconds: secondsRemaining,
                          })
                        : t('auth.send_reset_link')
                  }
                  onPress={handleResetPassword}
                  disabled={
                    loading || isCoolingDown || !isValidAuthEmail(email)
                  }
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sentText} allowFontScaling={false}>
                {t('auth.password_reset_email_link_sent', {
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
              <View style={styles.buttonContainer}>
                <Button
                  title={t('auth.go_to_login')}
                  onPress={() => onBack?.()}
                  disabled={loading}
                />
              </View>
              <TouchableOpacity
                testID="forgot-password-resend"
                style={styles.resendButton}
                onPress={handleResendResetEmail}
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
                      : t('auth.resend_reset_email')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
