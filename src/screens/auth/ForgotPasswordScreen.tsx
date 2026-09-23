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
      setStep('checkEmail');
      showToast({
        type: 'success',
        title: t('auth.check_email_title'),
        message: t('auth.password_reset_email_link_sent', { email: nextEmail }),
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

  const handleResendResetEmail = async () => {
    const nextEmail = verificationEmail || email.trim();

    try {
      setLoading(true);
      await AuthService.requestPasswordReset(nextEmail);
      showToast({
        type: 'success',
        title: t('auth.check_email_title'),
        message: t('auth.password_reset_email_link_sent', {
          email: nextEmail,
        }),
      });
    } catch (error: any) {
      console.error('Password reset resend error:', error);
      showToast({
        type: 'error',
        title: t('auth.password_reset_failed_title'),
        message: getAuthErrorMessage(error, 'passwordReset'),
      });
    } finally {
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
                  title={loading ? t('auth.sending_email') : t('auth.send_reset_link')}
                  onPress={handleResetPassword}
                  disabled={loading || !email.trim()}
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
              <View style={styles.buttonContainer}>
                <Button
                  title={t('auth.go_to_login')}
                  onPress={() => onBack?.()}
                  disabled={loading}
                />
              </View>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendResetEmail}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText} allowFontScaling={false}>
                  {loading ? t('auth.sending_email') : t('auth.resend_reset_email')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
