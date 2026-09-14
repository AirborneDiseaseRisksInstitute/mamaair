import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faChevronRight,
  faCircleInfo,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../../theme';
import type { TodayRecommendationItem } from '../../types/recommendationExperience';

interface ImprovePlanViewProps {
  prompts: TodayRecommendationItem[];
  onOpenProfile?: () => void;
}

const isProfilePrompt = (prompt: TodayRecommendationItem): boolean =>
  /complete_data|profile|lifestyle|missing_data/.test(
    `${prompt.ruleId} ${prompt.category}`.toLowerCase(),
  );

export const ImprovePlanView: React.FC<ImprovePlanViewProps> = ({
  prompts,
  onOpenProfile,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          marginTop: spacing('xl'),
          paddingTop: spacing('md'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral200,
        },
        headingRow: {
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
        },
        headingIcon: {
          width: 30,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          borderRadius: 15,
          backgroundColor: '#F1E8F7',
        },
        headingCopy: {
          flex: 1,
        },
        heading: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
          lineHeight: 18,
        },
        description: {
          marginTop: 1,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
          lineHeight: 15,
        },
        prompts: {
          marginTop: spacing('xs'),
          borderLeftWidth: 3,
          borderLeftColor: '#70428F',
          backgroundColor: '#FAF7FC',
        },
        prompt: {
          minHeight: 62,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          paddingVertical: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: '#E7DDEB',
        },
        promptPressed: {
          backgroundColor: '#F4EDF8',
        },
        promptIcon: {
          width: 28,
          alignItems: 'flex-start',
        },
        promptCopy: {
          flex: 1,
        },
        promptTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
          lineHeight: 17,
        },
        promptBody: {
          marginTop: 2,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
          lineHeight: 16,
        },
        chevron: {
          width: 28,
          height: 28,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme],
  );

  if (prompts.length === 0) return null;

  return (
    <View style={styles.root}>
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}>
          <FontAwesomeIcon icon={faSliders} size={13} color="#70428F" />
        </View>
        <View style={styles.headingCopy}>
          <Text accessibilityRole="header" style={styles.heading}>
            {t('today.improve_plan')}
          </Text>
          <Text style={styles.description}>
            {t('today.improve_plan_description')}
          </Text>
        </View>
      </View>

      <View style={styles.prompts}>
        {prompts.map(prompt => {
          const opensProfile = Boolean(
            onOpenProfile && isProfilePrompt(prompt),
          );
          const body = prompt.message || prompt.alert;
          return (
            <Pressable
              key={prompt.key}
              accessibilityRole={opensProfile ? 'button' : 'text'}
              accessibilityLabel={prompt.title}
              accessibilityHint={
                opensProfile ? t('today.opens_profile') : undefined
              }
              disabled={!opensProfile}
              onPress={opensProfile ? onOpenProfile : undefined}
              style={({ pressed }) => [
                styles.prompt,
                pressed && opensProfile && styles.promptPressed,
              ]}
            >
              <View style={styles.promptIcon}>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  size={13}
                  color="#70428F"
                />
              </View>
              <View style={styles.promptCopy}>
                <Text style={styles.promptTitle}>{prompt.title}</Text>
                {body ? <Text style={styles.promptBody}>{body}</Text> : null}
              </View>
              {opensProfile ? (
                <View style={styles.chevron}>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    size={11}
                    color="#70428F"
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
