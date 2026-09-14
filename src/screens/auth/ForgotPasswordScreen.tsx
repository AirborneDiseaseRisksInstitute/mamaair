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
  VerificationCodeInput,
  type InputRef,
  useToast,
} from '../../components/ui';
import { useTranslation } from 'react-i18next';
import { mvs, s } from '../../utils/responsive';
import { FORGOT_PASS_ICON_SVG } from '../../utils/svgIcons';
import { AuthService } from '../../services/api/AuthService';
import { getAuthErrorMessage } from '../../utils/authErrors';

interface ForgotPasswordScreenProps {
  onBack?: () => void;
  onResetPassword?: (email: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onResetPassword,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [step, setStep] = useState<'email' | 'verify' | 'password'>('email');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef<InputRef>(null);
  const newPasswordInputRef = useRef<InputRef>(null);
  const confirmPasswordInputRef = useRef<InputRef>(null);

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
    codeContainer: {
      marginTop: spacing('md'),
      marginBottom: spacing('lg'),
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
  }), [theme]);

  const handleResetPassword = async () => {
    const nextEmail = email.trim();
    if (!nextEmail) return;

    try {
      setLoading(true);
      await AuthService.requestPasswordReset(nextEmail);
      setVerificationEmail(nextEmail);
      setVerificationCode('');
      setVerificationError(null);
      setNewPassword('');
      setConfirmPassword('');
      setStep('verify');
      showToast({
        type: 'success',
        title: t('auth.verification_code_sent_title'),
        message: t('auth.verification_code_sent_message', { email: nextEmail }),
      });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      showToast({
        type: 'error',
        title: t('auth.password_reset_failed_title'),
        message: getAuthErrorMessage(error, 'passwordReset'),
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

  const handleVerifyCode = (code = verificationCode) => {
    if (code.length < 4) return;
    setVerificationCode(code);
    setVerificationError(null);
    setStep('password');
  };

  const handleResendCode = async () => {
    const nextEmail = verificationEmail || email.trim();

    try {
      setLoading(true);
      await AuthService.requestPasswordReset(nextEmail);
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
      console.error('Password reset resend error:', error);
      setVerificationError(getAuthErrorMessage(error, 'passwordReset'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordReset = async () => {
    const nextEmail = verificationEmail || email.trim();
    const nextPassword = newPassword.trim();

    if (!nextEmail || !verificationCode || nextPassword !== confirmPassword.trim()) {
      return;
    }

    try {
      setLoading(true);
      await AuthService.confirmPasswordReset(
        nextEmail,
        verificationCode,
        nextPassword,
      );
      showToast({
        type: 'success',
        title: t('auth.password_reset_success_title'),
        message: t('auth.password_reset_success_message'),
      });
      onResetPassword?.(nextEmail);
      onBack?.();
    } catch (error: any) {
      console.error('Password reset confirm error:', error);
      showToast({
        type: 'error',
        title: t('auth.password_reset_failed_title'),
        message: getAuthErrorMessage(error, 'passwordReset'),
      });
    } finally {
      setLoading(false);
    }
  };

  const isPasswordFormValid =
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    newPassword.trim() === confirmPassword.trim();

  const getTitle = () => {
    if (step === 'email') return t('auth.forgot_password_title');
    if (step === 'verify') return t('auth.verification_title');
    return t('auth.create_new_password_title');
  };

  const getDescription = () => {
    if (step === 'email') return t('auth.forgot_password_description');
    if (step === 'verify') return t('auth.enter_verification_code_description');
    return t('auth.create_new_password_description');
  };

  const handleBack = () => {
    if (step === 'password') {
      setStep('verify');
      return;
    }
    if (step === 'verify') {
      setStep('email');
      setVerificationCode('');
      setVerificationError(null);
      setNewPassword('');
      setConfirmPassword('');
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
                  title={loading ? t('auth.sending_code') : t('auth.send_verification_code')}
                  onPress={handleResetPassword}
                  disabled={loading || !email.trim()}
                />
              </View>
            </>
          ) : step === 'verify' ? (
            <>
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
              <View style={styles.buttonContainer}>
                <Button
                  title={t('common.continue')}
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
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Input
                  ref={newPasswordInputRef}
                  title={t('auth.new_password')}
                  placeholder={t('auth.new_password_placeholder')}
                  type="password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  nextInputRef={confirmPasswordInputRef}
                />
              </View>
              <View style={styles.inputContainer}>
                <Input
                  ref={confirmPasswordInputRef}
                  title={t('auth.confirm_password')}
                  placeholder={t('auth.confirm_password_placeholder')}
                  type="password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={handleConfirmPasswordReset}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  title={loading ? t('auth.resetting_password') : t('auth.reset_password')}
                  onPress={handleConfirmPasswordReset}
                  disabled={loading || !isPasswordFormValid}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
