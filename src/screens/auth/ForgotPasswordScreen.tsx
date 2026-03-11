import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../../theme';
import { Input, Button, OrangeHalo, BackButton, type InputRef } from '../../components/ui';
import { ms, mvs, s } from '../../utils/responsive';
import { FORGOT_PASS_ICON_SVG } from '../../utils/svgIcons';

interface ForgotPasswordScreenProps {
  onBack?: () => void;
  onResetPassword?: (email: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onResetPassword,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');

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
  }), [theme]);

  const handleResetPassword = () => {
    if (onResetPassword && email.trim()) {
      onResetPassword(email.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background halo */}
      <OrangeHalo position="center" />

      {/* Back button */}
      <BackButton onPress={onBack} />

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
          <Text style={styles.title} allowFontScaling={false}>Forgot password</Text>

          {/* Description */}
          <Text style={styles.description} allowFontScaling={false}>
            Type in your email and we'll send you a code to reset your password.
          </Text>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Input
              ref={emailInputRef}
              title="Email"
              placeholder="Enter your email to reset your password"
              type="email"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleResetPassword}
            />
          </View>

          {/* Reset Password Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Reset password"
              onPress={handleResetPassword}
              disabled={!email.trim()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

