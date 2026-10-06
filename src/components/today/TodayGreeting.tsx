import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../../theme';

interface TodayGreetingProps {
  name?: string | null;
}

export const TodayGreeting: React.FC<TodayGreetingProps> = ({ name }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const displayName = name?.trim().replace(/\s+/g, ' ');
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: spacing('md'),
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 22,
          lineHeight: 29,
        },
        message: {
          marginTop: 2,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 13,
          lineHeight: 19,
        },
      }),
    [theme],
  );

  if (!displayName) return null;

  return (
    <View style={styles.container} testID="today-greeting">
      <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
        {t('today.greeting', { name: displayName })}
      </Text>
      <Text style={styles.message}>{t('today.greeting_message')}</Text>
    </View>
  );
};
