import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Animated } from 'react-native';
import Svg, { G, Defs, ClipPath, Mask, Rect, Path, Pattern } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { BackButton } from '../components/ui';
import { SVG_ICONS, WAVE_BACKGROUND_SVG, MOTHER_RISK_SVG, BABY_RISK_SVG, BEHAVIOUR_SVG, RUNNING_SVG, DIET_SVG } from '../utils/svgIcons';
import { WEEKS_DATA } from './HomeScreen';
import { responsiveUtils } from '../utils/responsiveUtils';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { SummaryService, type SummaryResponse } from '../services/api/SummaryService';
import { RecommendationCompletionService, type RecommendationCompletion } from '../services/api/RecommendationCompletionService';
import { useTranslation } from 'react-i18next';

function getCurrentWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + diff + i);
    return d.toISOString().split('T')[0];
  });
}

interface BabyStatusScreenProps {
  onBack?: () => void;
}


// Reusable icon with animated wave fill (similar to WeekCycleView)
const SystemIconWithWave: React.FC<{
  svgXml: string;
  size: number;
  percentage: number;
  uniqueId: string;
}> = ({ svgXml, size, percentage, uniqueId }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [waveTranslateX, setWaveTranslateX] = useState(0);

  // Extract wave SVG info
  const waveViewBoxMatch = WAVE_BACKGROUND_SVG.match(/viewBox="([^"]*)"/);
  const waveViewBox = waveViewBoxMatch ? waveViewBoxMatch[1].split(' ').map(Number) : [0, 0, 113, 29];
  const waveWidth = waveViewBox[2] || 113;
  const waveHeight = waveViewBox[3] || 29;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      })
    );

    animation.start();

    const listener = waveAnim.addListener(({ value }) => {
      const translateX = value * -waveWidth;
      setWaveTranslateX(translateX);
    });

    return () => {
      animation.stop();
      waveAnim.removeListener(listener);
    };
  }, [waveAnim, waveWidth]);

  // Extract viewBox from icon SVG
  const viewBoxMatch = svgXml.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, size, size];
  const svgWidth = viewBox[2] || size;
  const svgHeight = viewBox[3] || size;
  const fillHeight = (svgHeight * percentage) / 100;

  // Extract icon paths for use in mask
  const pathMatches = svgXml.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
  const iconPathData =
    pathMatches
      ?.map((m) => {
        const dMatch = m.match(/d="([^"]*)"/);
        const strokeMatch = m.match(/stroke="([^"]*)"/);
        const fillMatch = m.match(/fill="([^"]*)"/);
        const strokeWidthMatch = m.match(/stroke-width="([^"]*)"/);
        return {
          d: dMatch ? dMatch[1] : '',
          stroke: strokeMatch ? strokeMatch[1] : undefined,
          fill: fillMatch ? fillMatch[1] : 'transparent',
          strokeWidth: strokeWidthMatch ? strokeWidthMatch[1] : undefined,
        };
      })
      .filter((p) => p.d) || [];

  const wavePathMatches = WAVE_BACKGROUND_SVG.match(/<path[^>]*d="([^"]*)"[^>]*fill="([^"]*)"[^>]*>/g);
  const wavePaths =
    wavePathMatches
      ?.map((m) => {
        const dMatch = m.match(/d="([^"]*)"/);
        const fillMatch = m.match(/fill="([^"]*)"/);
        return {
          d: dMatch ? dMatch[1] : '',
          fill: fillMatch ? fillMatch[1] : '#FF6900',
        };
      })
      .filter((p) => p.d) || [];

  if (percentage <= 0 || iconPathData.length === 0 || wavePaths.length === 0) {
    return <SvgXml xml={svgXml} width={size} height={size} />;
  }

  return (
    <Svg width={size} height={size} viewBox={viewBox.join(' ')}>
      <Defs>
        <Pattern
          id={`wavePattern-${uniqueId}`}
          x="0"
          y={svgHeight - fillHeight}
          width={waveWidth}
          height={waveHeight}
          patternUnits="userSpaceOnUse"
        >
          <G transform={`translate(${waveTranslateX}, 0)`}>
            <G>
              {wavePaths.map((wavePath, idx) => (
                <Path key={idx} d={wavePath.d} fill={wavePath.fill} />
              ))}
            </G>
            <G transform={`translate(${waveWidth - 1}, 0)`}>
              {wavePaths.map((wavePath, idx) => (
                <Path key={idx} d={wavePath.d} fill={wavePath.fill} />
              ))}
            </G>
          </G>
        </Pattern>

        <ClipPath id={`percentageClip-${uniqueId}`}>
          <Rect x="0" y={svgHeight - fillHeight} width={svgWidth} height={fillHeight} />
        </ClipPath>

        <Mask id={`iconMask-${uniqueId}`}>
          <Rect width={svgWidth} height={svgHeight} fill="black" />
          {iconPathData.map((pathData, idx) => (
            <Path
              key={idx}
              d={pathData.d}
              fill="white"
              stroke="white"
              strokeWidth={pathData.strokeWidth}
            />
          ))}
        </Mask>
      </Defs>

      {/* Main icon outline */}
      {iconPathData.map((pathData, idx) => (
        <Path
          key={`icon-${idx}`}
          d={pathData.d}
          stroke={pathData.stroke}
          fill={pathData.fill}
          strokeWidth={pathData.strokeWidth}
        />
      ))}

      {/* Animated wave fill */}
      <G mask={`url(#iconMask-${uniqueId})`} clipPath={`url(#percentageClip-${uniqueId})`}>
        <Rect
          x="0"
          y={svgHeight - fillHeight}
          width={svgWidth}
          height={fillHeight}
          fill={`url(#wavePattern-${uniqueId})`}
        />
      </G>
    </Svg>
  );
};

export const BabyStatusScreen: React.FC<BabyStatusScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
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
  const [completions, setCompletions] = useState<RecommendationCompletion[]>([]);

  useEffect(() => {
    SummaryService.getSummary()
      .then(data => {
        setSummary(data);
        return data;
      })
      .then(data => {
        if (data?.snapshot_id) {
          return RecommendationCompletionService.getCompletions(data.snapshot_id);
        }
      })
      .then(comp => { if (comp) setCompletions(comp); })
      .catch(() => {});
  }, []);

  const weekDates = getCurrentWeekDates();

  const checkinDays = (summary?.daily_checkins ?? []).filter(d => weekDates.includes(d)).length;
  const exposureDays = (summary?.exposure_history?.items ?? []).filter(item => weekDates.includes(item.date)).length;
  const taskDays = (summary?.task_completions ?? []).filter(tc => weekDates.includes(tc.date) && tc.tasks.length > 0).length;

  const babyDelta = Math.abs(Math.round(summary?.risks_delta?.baby ?? 0));
  const perItemDelta = Math.round(babyDelta / 3);

  // Determine focus system: pick the one with the highest percentage
  const focusSystem = circleIcons.reduce<typeof circleIcons[0] | null>((currentMax, item) => {
    if (!currentMax) return item;
    const currentPercent = currentMax.percentage ?? 0;
    const itemPercent = item.percentage ?? 0;
    return itemPercent > currentPercent ? item : currentMax;
  }, null);

  const rawIconKey = (focusSystem?.iconPath || '').replace('.svg', '');
  const focusLabel = getSystemLabel(rawIconKey);
  const focusPercentage = focusSystem?.percentage ?? 0;
  const progressToday = 4; // Placeholder daily change for UI

  const focusSvgKey = (focusSystem?.iconPath || 'heartSystem.svg') as keyof typeof SVG_ICONS;
  const focusSvgXml = SVG_ICONS[focusSvgKey] || SVG_ICONS['heartSystem.svg'];

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
      marginBottom:100
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
      >
        {/* Systems Development Card */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle} allowFontScaling={false}>{t('baby.development_systems')}</Text>

          <Text style={styles.cardDescription} allowFontScaling={false}>
            {summary?.week_info?.text || weekData?.description || ''}
          </Text>

          {/* Systems list */}
          {visibleSystems.length > 0 && (
            <View style={styles.systemsListContainer}>
              {visibleSystems.map((system) => {
                const iconKey = (system.iconPath || 'heartSystem.svg') as keyof typeof SVG_ICONS;
                const svgXml = SVG_ICONS[iconKey] || SVG_ICONS['heartSystem.svg'];
                const percentage = system.percentage ?? 0;
                const rawIconKey = (system.iconPath || '').replace('.svg', '');
                const systemLabel = getSystemLabel(rawIconKey);

                return (
                  <View key={system.index} style={styles.systemRow}>
                    <View style={styles.systemIconCircle}>
                      <SystemIconWithWave
                        svgXml={svgXml}
                        size={22}
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

          {sortedSystems.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowAllSystems((prev) => !prev)}
              activeOpacity={0.7}
              style={styles.showMoreButton}
            >
              <Text style={styles.showMoreText} allowFontScaling={false}>
                {showAllSystems ? 'Show less' : `Show more (${sortedSystems.length - 3} more)`}
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
              <Text style={styles.actionCardTitle} allowFontScaling={false}>{t('baby.actions_title')}</Text>
              <Text style={styles.actionCardTitle} numberOfLines={1} allowFontScaling={false}>
                {t('baby.protection_by')}<Text style={{ color: theme.colors.orange500 }} allowFontScaling={false}>+{babyDelta}%</Text>
              </Text>
              <Text style={styles.actionCardSubtitle} allowFontScaling={false}>{t('baby.mainly_supporting', { system: focusLabel.toLowerCase() })}</Text>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            {/* Health Habits Action - Heart/Behaviour */}
            <View style={[styles.actionItem, { backgroundColor: '#FEF2F2' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#FFDEE5' }]}>
                <SvgXml xml={BEHAVIOUR_SVG} width={20} height={20} />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{checkinDays}/7 Days</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_habits', { days: checkinDays })}</Text>
              </View>
              <View style={styles.actionItemBadge}>
                <Text style={styles.actionItemBadgeText} allowFontScaling={false}>+{perItemDelta}%</Text>
              </View>
            </View>

            {/* Exercise Action */}
            <View style={[styles.actionItem, { backgroundColor: '#FFF7E6' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#FFEABD' }]}>
                <SvgXml xml={RUNNING_SVG} width={20} height={20} />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{exposureDays}/7 Days</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_walks')}</Text>
              </View>
              <View style={styles.actionItemBadge}>
                <Text style={styles.actionItemBadgeText} allowFontScaling={false}>+{perItemDelta}%</Text>
              </View>
            </View>

            {/* Nutrition Action - Food */}
            <View style={[styles.actionItem, { backgroundColor: '#EBFFF5' }]}>
              <View style={[styles.actionItemIconContainer, { backgroundColor: '#B9FAD7' }]}>
                <SvgXml xml={DIET_SVG} width={20} height={20} />
              </View>
              <View style={styles.actionItemContent}>
                <Text style={styles.actionItemTitle} allowFontScaling={false}>{taskDays}/7 Days</Text>
                <Text style={styles.actionItemDescription} allowFontScaling={false}>{t('baby.action_hydration')}</Text>
              </View>
              <View style={styles.actionItemBadge}>
                <Text style={styles.actionItemBadgeText} allowFontScaling={false}>+{perItemDelta}%</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
