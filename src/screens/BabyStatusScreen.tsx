import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { BackButton, SystemProgressIcon } from '../components/ui';
import { SVG_ICONS, MOTHER_RISK_SVG, BABY_RISK_SVG, BEHAVIOUR_SVG, RUNNING_SVG, DIET_SVG } from '../utils/svgIcons';
import { WEEKS_DATA } from './HomeScreen';
import { responsiveUtils } from '../utils/responsiveUtils';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { SummaryService, type SummaryResponse } from '../services/api/SummaryService';
import { useTranslation } from 'react-i18next';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import { loadWeeklySummaryExperience } from '../services/recommendationExperience/PresentationJourneyRepository';
import { DEV_LOCAL_SESSION } from '../config/dev';

interface BabyStatusScreenProps {
  onBack?: () => void;
}

export const BabyStatusScreen: React.FC<BabyStatusScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { profile } = useUserStore();

  const getSystemLabel = (iconKey: string): string => {
    if (!iconKey) return t('baby.system_fallback');
    const key = `baby.system_${iconKey}` as any;
    const result = t(key, { defaultValue: '' });
    return result || iconKey.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase());
  };

  const activeWeek = getCurrentPregnancyWeek(profile.pregnancyWeek, profile.pregnancyWeekSetDate) || 1;
  const weekIndex = Math.max(0, Math.min(WEEKS_DATA.length - 1, activeWeek - 1));
  const weekData = WEEKS_DATA[weekIndex];
  const circleIcons = weekData?.circleIcons || [];

  const [showAllSystems, setShowAllSystems] = useState(false);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const actionCompletions = useRecommendationExperienceStore(
    state => state.actionCompletions,
  );
  const checkIns = useRecommendationExperienceStore(
    state => state.checkIns,
  );
  const restTimers = useRecommendationExperienceStore(
    state => state.restTimers,
  );
  const dailyMoments = useRecommendationExperienceStore(
    state => state.dailyMoments,
  );

  useEffect(() => {
    if (DEV_LOCAL_SESSION) return;
    SummaryService.getSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);

  const identity = useMemo(
    () => ({
      backendUserId: profile.backendUserId,
      email: profile.email,
    }),
    [profile.backendUserId, profile.email],
  );
  const journeySummary = useMemo(
    () =>
      loadWeeklySummaryExperience({
        identity,
        pregnancyWeek: activeWeek,
        endDate: formatLocalDate(new Date()),
        milestone:
          (summary?.week_info?.week === activeWeek
            ? summary.week_info.text
            : undefined) ??
          t(
            `home.week_desc_w${String(activeWeek).padStart(2, '0')}`,
          ),
        backendSummary: summary,
        localData: {
          actionCompletions,
          checkIns,
          dailyMoments,
          restTimers,
        },
      }),
    [
      actionCompletions,
      checkIns,
      dailyMoments,
      restTimers,
      t,
      activeWeek,
      identity,
      summary,
    ],
  );
  const behaviourDays =
    journeySummary.domainParticipation.behaviour;
  const activityDays =
    journeySummary.domainParticipation.activity;
  const dietDays = journeySummary.domainParticipation.diet;
  const wellbeingDays =
    journeySummary.domainParticipation.wellbeing;
  const isCareContext = journeySummary.dataMode === 'careContext';
  const localizedMilestone = t(
    `home.week_desc_w${String(activeWeek).padStart(2, '0')}`,
  );
  const milestoneText =
    i18n.resolvedLanguage === 'en' &&
    summary?.week_info?.week === activeWeek &&
    summary.week_info.text
      ? summary.week_info.text
      : localizedMilestone;

  // Determine focus system: pick the one with the highest percentage
  const focusSystem = circleIcons.reduce<typeof circleIcons[0] | null>((currentMax, item) => {
    if (!currentMax) return item;
    const currentPercent = currentMax.percentage ?? 0;
    const itemPercent = item.percentage ?? 0;
    return itemPercent > currentPercent ? item : currentMax;
  }, null);

  const rawIconKey = (focusSystem?.iconPath || '').replace('.svg', '');
  const focusLabel = getSystemLabel(rawIconKey);
  // Sort all systems by percentage (descending) for list display
  const sortedSystems = [...circleIcons].sort(
    (a, b) => (b.percentage ?? 0) - (a.percentage ?? 0)
  );
  const visibleSystems = showAllSystems ? sortedSystems : sortedSystems.slice(0, 3);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: 50,
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 3,
    },
    headerTitle: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('lg'),
      paddingBottom: spacing('xl'),
    },
    scrollContent: {
      paddingBottom: 120,
    },
    statusCard: {
      backgroundColor: '#FFE9D6',
      borderRadius: 16,
      padding: spacing('lg'),
      marginBottom: spacing('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    cardTitleHighlight: {
      color: theme.colors.orange500,
    },
    cardDescription: {
      fontSize: responsiveUtils.getFixedFontSize(13),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: responsiveUtils.getFixedLineHeight(13, 20),
      marginBottom: spacing('lg'),
    },
    emptySystemsText: {
      fontSize: responsiveUtils.getFixedFontSize(12),
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.orange800,
      lineHeight: responsiveUtils.getFixedLineHeight(12, 18),
    },
    referenceNote: {
      fontSize: responsiveUtils.getFixedFontSize(11),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: responsiveUtils.getFixedLineHeight(11, 16),
      marginTop: spacing('sm'),
    },
    cardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing('sm'),
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFD2A6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing('md'),
    },
    progressContainer: {
      flex: 1,
    },
    progressTextRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing('xs'),
    },
    progressMain: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginRight: 4,
    },
    progressDelta: {
      fontSize: responsiveUtils.getFixedFontSize(12),
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.orange500,
    },
    progressBarBackground: {
      width: '100%',
      height: 8,
      borderRadius: 999,
      backgroundColor: '#FFD9B8',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: theme.colors.orange500,
    },
    systemsListContainer: {
      gap: spacing('sm'),
    },
    systemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('sm'),
    },
    systemIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFD2A6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing('md'),
      flexShrink: 0,
    },
    systemInfo: {
      flex: 1,
    },
    systemName: {
      fontSize: responsiveUtils.getFixedFontSize(12),
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    systemProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    showMoreButton: {
      marginTop: spacing('md'),
      alignSelf: 'flex-start',
      paddingHorizontal: spacing('sm'),
      paddingVertical: spacing('xs'),
      borderRadius: 999,
    },
    showMoreText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.orange500,
    },
    actionsCard: {
      backgroundColor: '#FFF',
      borderRadius: 16,
      padding: spacing('lg'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: spacing('xl'),
    },
    actionCardHeader: {
      flexDirection: 'column',
      marginBottom: spacing('lg'),
      gap: spacing('md'),
    },
    actionCardHeaderText: {
      flex: 1,
    },
    actionCardTitle: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    actionCardSubtitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    actionsGrid: {
      gap: spacing('md'),
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#FAFAFA',
      borderRadius: 12,
      padding: spacing('md'),
      gap: spacing('md'),
    },
    actionItemIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    actionItemContent: {
      flex: 1,
    },
    actionItemTitle: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    actionItemDescription: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    actionItemBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.orange500,
      borderRadius: 10,
      paddingHorizontal: spacing('xs'),
      paddingVertical: 2,
    },
    actionItemBadgeText: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#fff',
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('baby.status_week', { week: activeWeek })}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Systems Development Card */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle} allowFontScaling={false}>{t('baby.development_systems')}</Text>

          <Text style={styles.cardDescription} allowFontScaling={false}>
            {milestoneText}
          </Text>

          {/* Systems list */}
          {visibleSystems.length > 0 && (
            <View style={styles.systemsListContainer}>
              {visibleSystems.map((system) => {
                const iconKey = (system.iconPath || 'heartSystem.svg') as keyof typeof SVG_ICONS;
                const svgXml = SVG_ICONS[iconKey] || SVG_ICONS['heartSystem.svg'];
                const percentage = system.percentage ?? 0;
                const systemIconKey = (system.iconPath || '').replace('.svg', '');
                const systemLabel = getSystemLabel(systemIconKey);

                return (
                  <View key={system.index} style={styles.systemRow}>
                    <View style={styles.systemIconCircle}>
                      <SystemProgressIcon
                        svgXml={svgXml}
                        width={22}
                        height={22}
                        percentage={percentage}
                        uniqueId={`system-${system.index}`}
                      />
                    </View>
                    <View style={styles.systemInfo}>
                      <Text style={styles.systemName} allowFontScaling={false}>{systemLabel}</Text>
                      <View style={styles.systemProgressRow}>
                        <Text style={styles.progressMain} allowFontScaling={false}>{percentage}%</Text>
                        <View style={[styles.progressBarBackground, { flex: 1 }]}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.min(100, Math.max(0, percentage))}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {visibleSystems.length === 0 ? (
            <Text style={styles.emptySystemsText}>
              {t('baby.systems_begin_later')}
            </Text>
          ) : (
            <Text style={styles.referenceNote}>
              {t('baby.reference_note')}
            </Text>
          )}

          {sortedSystems.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllSystems((prev) => !prev)}
              activeOpacity={0.7}
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreText} allowFontScaling={false}>
                {showAllSystems
                  ? t('baby.show_less')
                  : t('baby.show_more_count', {
                      count: sortedSystems.length - 3,
                    })}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Your Actions This Week Card */}
        <View style={styles.actionsCard}>
          <View style={styles.actionCardHeader}>
            <View style={{ flexDirection: 'row' }}>
              <SvgXml xml={MOTHER_RISK_SVG} width={45} height={45} />
              <SvgXml xml={BABY_RISK_SVG} width={45} height={45} />
            </View>
            <View style={styles.actionCardHeaderText}>
              <Text style={styles.actionCardTitle} allowFontScaling={false}>
                {t(
                  isCareContext
                    ? 'baby.care_context_title'
                    : 'baby.actions_title',
                )}
              </Text>
              <Text style={styles.actionCardTitle} numberOfLines={1} allowFontScaling={false}>
                {t('baby.protective_days', {
                  days: journeySummary.activeDays,
                })}
              </Text>
              <Text style={styles.actionCardSubtitle} allowFontScaling={false}>
                {isCareContext
                  ? t('baby.care_context_body')
                  : focusSystem
                  ? t('baby.current_milestone_focus', {
                      system: focusLabel.toLowerCase(),
                    })
                  : t('baby.actions_build_pattern')}
              </Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            {/* Health Habits Action - Heart/Behaviour */}
            <View style={[styles.actionItem, { backgroundColor: '#FEF2F2' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#FFDEE5' }]}>
                <SvgXml xml={BEHAVIOUR_SVG} width={20} height={20} />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{t('baby.days_of_seven', { days: behaviourDays })}</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_behaviour')}</Text>
              </View>
            </View>

            {/* Exercise Action */}
            <View style={[styles.actionItem, { backgroundColor: '#FFF7E6' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#FFEABD' }]}>
                <SvgXml xml={RUNNING_SVG} width={20} height={20} />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{t('baby.days_of_seven', { days: activityDays })}</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_activity')}</Text>
              </View>
            </View>

            {/* Nutrition Action - Food */}
            <View style={[styles.actionItem, { backgroundColor: '#EBFFF5' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#B9FAD7' }]}>
                <SvgXml xml={DIET_SVG} width={20} height={20} />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{t('baby.days_of_seven', { days: dietDays })}</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_diet')}</Text>
              </View>
            </View>

            {/* Wellbeing Action */}
            <View style={[styles.actionItem, { backgroundColor: '#F6F0FA' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#E7D9F0' }]}>
                <SvgXml
                  xml={SVG_ICONS['brainSystem.svg']}
                  width={20}
                  height={20}
                />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{t('baby.days_of_seven', { days: wellbeingDays })}</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_wellbeing')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
