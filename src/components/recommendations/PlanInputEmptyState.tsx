import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronRight,
  faHeartPulse,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../../theme';
import type { PlanInputReadiness } from '../../types/recommendationExperience';

interface PlanInputEmptyStateProps {
  readiness: PlanInputReadiness;
  onCompleteProfile?: () => void;
  onCompleteCheckIn?: () => void;
}

export const PlanInputEmptyState: React.FC<PlanInputEmptyStateProps> = ({
  readiness,
  onCompleteProfile,
  onCompleteCheckIn,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: spacing('lg'),
          paddingVertical: spacing('lg'),
          borderTopWidth: 3,
          borderTopColor: theme.colors.orange500,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 16,
          lineHeight: 23,
        },
        body: {
          marginTop: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 13,
          lineHeight: 20,
        },
        actions: {
          marginTop: spacing('md'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
          borderRadius: 8,
          overflow: 'hidden',
        },
        action: {
          minHeight: 68,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('sm'),
          backgroundColor: '#FFFFFF',
        },
        actionBorder: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral200,
        },
        actionPressed: {
          backgroundColor: theme.colors.neutral50,
        },
        icon: {
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 17,
          backgroundColor: theme.colors.orange100,
          marginRight: spacing('sm'),
        },
        copy: { flex: 1 },
        actionTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
          lineHeight: 19,
        },
        actionDetail: {
          marginTop: 2,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        chevron: {
          width: 28,
          alignItems: 'flex-end',
        },
      }),
    [theme],
  );

  const actions = [
    !readiness.profileReady && onCompleteProfile
      ? {
          key: 'profile',
          testID: 'complete-plan-profile',
          title: t('today.plan_profile_action'),
          detail: t('today.plan_profile_remaining', {
            count: readiness.missingProfileSteps.length,
          }),
          icon: faSliders,
          onPress: onCompleteProfile,
        }
      : null,
    !readiness.checkInReady && onCompleteCheckIn
      ? {
          key: 'checkin',
          testID: 'complete-plan-checkin',
          title: t('today.plan_checkin_action'),
          detail: t('today.plan_checkin_detail'),
          icon: faHeartPulse,
          onPress: onCompleteCheckIn,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    testID: string;
    title: string;
    detail: string;
    icon: typeof faSliders;
    onPress: () => void;
  }>;

  return (
    <View style={styles.root} testID="plan-input-empty-state">
      <Text accessibilityRole="header" style={styles.title}>
        {t('today.plan_inputs_title')}
      </Text>
      <Text style={styles.body}>{t('today.plan_inputs_body')}</Text>

      <View style={styles.actions}>
        {actions.map((action, index) => (
          <Pressable
            key={action.key}
            testID={action.testID}
            accessibilityRole="button"
            accessibilityLabel={action.title}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.action,
              index > 0 && styles.actionBorder,
              pressed && styles.actionPressed,
            ]}
          >
            <View style={styles.icon}>
              <FontAwesomeIcon
                icon={action.icon}
                size={15}
                color={theme.colors.orange700}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDetail}>{action.detail}</Text>
            </View>
            <View style={styles.chevron}>
              <FontAwesomeIcon
                icon={faChevronRight}
                size={12}
                color={theme.colors.neutral600}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
