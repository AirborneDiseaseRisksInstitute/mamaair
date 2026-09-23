import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  faBrain,
  faCheck,
  faChevronRight,
  faCircleInfo,
  faTimes,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../ui';
import { spacing, useTheme } from '../../theme';
import { BEHAVIOUR_SVG, DIET_SVG, RUNNING_SVG } from '../../utils/svgIcons';
import type {
  DailyActionState,
  DailyActionDomain,
  DailyPlanAction,
  DailyPlanExperience,
  TodayRecommendationItem,
} from '../../types/recommendationExperience';

interface ExploreMoreViewProps {
  experience: DailyPlanExperience;
  onChangeActionState: (
    action: DailyPlanAction,
    state: DailyActionState,
  ) => void | Promise<boolean>;
}

const DOMAIN_ORDER: DailyActionDomain[] = [
  'wellbeing',
  'diet',
  'activity',
  'behaviour',
  // Service/treatment escalation is disabled for the current release.
  // Restore this entry when the backend-supported experience is approved.
  // 'service',
];
const GUIDANCE_IN_MORE_FOR_TODAY_ENABLED = false;

const DOMAIN_CONFIG: Record<
  DailyActionDomain,
  {
    color: string;
    background: string;
    svg?: string;
  }
> = {
  diet: {
    color: '#2E7D4A',
    background: '#F1FAF4',
    svg: DIET_SVG,
  },
  activity: {
    color: '#946000',
    background: '#FFF9EA',
    svg: RUNNING_SVG,
  },
  behaviour: {
    color: '#A83149',
    background: '#FFF4F6',
    svg: BEHAVIOUR_SVG,
  },
  wellbeing: {
    color: '#70428F',
    background: '#F8F2FC',
  },
  service: {
    color: '#48607A',
    background: '#F3F7FA',
  },
};

const DomainIcon: React.FC<{
  domain: DailyActionDomain;
}> = ({ domain }) => {
  const config = DOMAIN_CONFIG[domain];
  if (config.svg) {
    return <SvgXml xml={config.svg} width={17} height={17} />;
  }
  return (
    <FontAwesomeIcon
      icon={domain === 'wellbeing' ? faBrain : faCircleInfo}
      size={13}
      color={config.color}
    />
  );
};

export const ExploreMoreView: React.FC<ExploreMoreViewProps> = ({
  experience,
  onChangeActionState,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  const additionalCount = DOMAIN_ORDER.reduce(
    (total, item) => total + experience.additionalActions[item].length,
    0,
  );
  const legacySheetGuidanceRecommendations = [
    ...experience.importantGuidanceRecommendations.slice(1),
    ...experience.guidanceRecommendations,
  ];
  const populatedDomains = DOMAIN_ORDER.filter(
    domain => experience.additionalActions[domain].length > 0,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginRight: spacing('md'),
        },
        entry: {
          minHeight: 36,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 10,
          borderRadius: 18,
          backgroundColor: '#FFF4EA',
          gap: 6,
        },
        entryPressed: {
          opacity: 0.82,
        },
        entryGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        entryText: {
          color: theme.colors.orange800,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
          lineHeight: 14,
        },
        sheet: {
          maxHeight: height * 0.82,
        },
        sheetHeader: {
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing('md'),
        },
        sheetTitle: {
          flex: 1,
          paddingRight: spacing('sm'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 21,
          lineHeight: 28,
        },
        close: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.neutral100,
        },
        sheetIntro: {
          marginTop: -spacing('sm'),
          marginBottom: spacing('md'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
          lineHeight: 18,
        },
        list: {
          maxHeight: height * 0.58,
        },
        listContent: {
          paddingBottom: insets.bottom + spacing('md'),
        },
        domainGroup: {
          marginBottom: spacing('md'),
        },
        domainHeader: {
          minHeight: 38,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          borderLeftWidth: 3,
        },
        domainIcon: {
          width: 25,
          height: 25,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('xs'),
        },
        domainIconSurface: {
          backgroundColor: '#FFFFFF',
        },
        domainName: {
          flex: 1,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        domainCount: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
        },
        idea: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: spacing('md'),
          paddingHorizontal: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
        },
        ideaLast: {
          borderBottomWidth: 0,
        },
        ideaTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          lineHeight: 19,
        },
        ideaCopy: {
          flex: 1,
        },
        completionButton: {
          width: 34,
          height: 34,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('xs'),
        },
        completionIndicator: {
          width: 20,
          height: 20,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: theme.colors.orange300,
          backgroundColor: '#FFFFFF',
        },
        completionIndicatorDone: {
          borderColor: theme.colors.orange500,
          backgroundColor: theme.colors.orange500,
        },
        ideaPurpose: {
          marginTop: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 18,
        },
        recommendationSection: {
          marginBottom: spacing('md'),
        },
        recommendationHeader: {
          minHeight: 38,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.orange500,
          backgroundColor: '#FFF7EF',
        },
        recommendationHeaderIcon: {
          width: 25,
          height: 25,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('xs'),
          backgroundColor: '#FFFFFF',
        },
        recommendationHeaderText: {
          flex: 1,
          color: theme.colors.orange800,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        recommendationRow: {
          paddingVertical: spacing('md'),
          paddingHorizontal: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
        },
        recommendationTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          lineHeight: 19,
        },
        recommendationBody: {
          marginTop: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 18,
        },
      }),
    [height, insets.bottom, theme],
  );

  const renderRecommendationSection = (
    titleKey: string,
    items: TodayRecommendationItem[],
  ) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.recommendationSection}>
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationHeaderIcon}>
            <FontAwesomeIcon
              icon={faCircleInfo}
              size={12}
              color={theme.colors.orange700}
            />
          </View>
          <Text style={styles.recommendationHeaderText}>{t(titleKey)}</Text>
          <Text style={styles.domainCount}>
            {t('today.recommendation_count', {
              count: items.length,
            })}
          </Text>
        </View>
        {items.map(item => (
          <View key={item.key} style={styles.recommendationRow}>
            <Text style={styles.recommendationTitle}>{item.title}</Text>
            {item.alert || item.message ? (
              <Text style={styles.recommendationBody}>
                {item.alert || item.message}
              </Text>
            ) : null}
            {item.recommendationText.map(text => (
              <Text
                key={`${item.key}:${text.dimension}`}
                style={styles.recommendationBody}
              >
                • {text.text}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  };

  if (additionalCount === 0) return null;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('today.explore_more_label', {
          count: additionalCount,
        })}
        accessibilityHint={t('today.opens_recommendations')}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.entry, pressed && styles.entryPressed]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['#FFF0E2', '#F8F0FA']}
          locations={[0, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.entryGradient}
        />
        <FontAwesomeIcon
          icon={faWandMagicSparkles}
          size={11}
          color={theme.colors.orange700}
        />
        <Text numberOfLines={1} style={styles.entryText}>
          {t('today.more_support_count', {
            count: additionalCount,
          })}
        </Text>
        <FontAwesomeIcon
          icon={faChevronRight}
          size={8}
          color={theme.colors.orange700}
        />
      </Pressable>

      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        showHandle
      >
        <View
          accessibilityViewIsModal
          accessibilityLabel={t('today.more_support_for_today')}
          style={styles.sheet}
        >
          <View style={styles.sheetHeader}>
            <Text accessibilityRole="header" style={styles.sheetTitle}>
              {t('today.more_support_for_today')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={() => setVisible(false)}
              style={styles.close}
            >
              <FontAwesomeIcon
                icon={faTimes}
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          </View>
          <Text style={styles.sheetIntro}>{t('today.more_actions_intro')}</Text>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {/* Guidance used to share this sheet with additional actions.
                Keep the shared rendering path disabled so the header count and
                completion model describe actions only. */}
            {GUIDANCE_IN_MORE_FOR_TODAY_ENABLED
              ? renderRecommendationSection(
                  'today.guidance_recommendations',
                  legacySheetGuidanceRecommendations,
                )
              : null}
            {GUIDANCE_IN_MORE_FOR_TODAY_ENABLED
              ? renderRecommendationSection(
                  'today.optional_support',
                  experience.optionalSupportRecommendations,
                )
              : null}
            {populatedDomains.map(domain => {
              const config = DOMAIN_CONFIG[domain];
              const actions = experience.additionalActions[domain];
              return (
                <View key={domain} style={styles.domainGroup}>
                  <View
                    style={[
                      styles.domainHeader,
                      {
                        backgroundColor: config.background,
                        borderLeftColor: config.color,
                      },
                    ]}
                  >
                    <View style={[styles.domainIcon, styles.domainIconSurface]}>
                      <DomainIcon domain={domain} />
                    </View>
                    <Text style={[styles.domainName, { color: config.color }]}>
                      {t(`today.domain_${domain}`)}
                    </Text>
                    <Text style={styles.domainCount}>
                      {t('today.recommendation_count', {
                        count: actions.length,
                      })}
                    </Text>
                  </View>

                  {actions.map((action, index) => (
                    <View
                      key={action.key}
                      style={[
                        styles.idea,
                        index === actions.length - 1 && styles.ideaLast,
                      ]}
                    >
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{
                          checked: action.completed,
                        }}
                        accessibilityLabel={t(
                          action.completed
                            ? 'today.mark_not_complete'
                            : 'today.complete_extra_action',
                          { action: action.title },
                        )}
                        onPress={() =>
                          onChangeActionState(
                            action,
                            action.completed ? 'pending' : 'completed',
                          )
                        }
                        style={styles.completionButton}
                      >
                        <View
                          style={[
                            styles.completionIndicator,
                            action.completed && styles.completionIndicatorDone,
                          ]}
                        >
                          {action.completed ? (
                            <FontAwesomeIcon
                              icon={faCheck}
                              size={10}
                              color="#FFFFFF"
                            />
                          ) : null}
                        </View>
                      </Pressable>
                      <View style={styles.ideaCopy}>
                        <Text style={styles.ideaTitle}>{action.title}</Text>
                        <Text style={styles.ideaPurpose}>{action.purpose}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
};
