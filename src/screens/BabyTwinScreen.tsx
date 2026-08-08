import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { BackButton, SystemProgressIcon } from '../components/ui';
import { SVG_ICONS } from '../utils/svgIcons';
import { responsiveUtils } from '../utils/responsiveUtils';
import { useUserStore } from '../store/useUserStore';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { useTranslation } from 'react-i18next';
import { WEEKS_DATA } from './HomeScreen';
import { getFetalSystemTimeline } from '../services/recommendationExperience/DevelopmentProgressRepository';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import { getBabyTwinWeekImage } from '../utils/babyTwinWeekImage';

interface BabyTwinScreenProps {
  onBack?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ICON_SIZE = 40;
export const BabyTwinScreen: React.FC<BabyTwinScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { profile } = useUserStore();
  const currentWeek =
    getCurrentPregnancyWeek(
      profile.pregnancyWeek,
      profile.pregnancyWeekSetDate,
    ) ?? 1;
  const weekLabel = currentWeek
    ? t('home.week_label', { week: currentWeek })
    : '–';
  const timelineProgress = Math.round((currentWeek / 40) * 100);
  const babySystems = getFetalSystemTimeline(
    WEEKS_DATA,
    currentWeek,
  );
  const weeklyCheckpoints = useRecommendationExperienceStore(
    state => state.weeklyCheckpoints,
  );
  const completedCheckpoints = Object.values(
    weeklyCheckpoints,
  ).filter(
    checkpoint => checkpoint.pregnancyWeek <= currentWeek,
  ).length;
  const maxContentHeight = SCREEN_HEIGHT * 0.3;
  const size = Math.min(140, maxContentHeight * 0.8); // Smaller circular progress
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference -
    (timelineProgress / 100) * circumference;
  const babyWeekImage = getBabyTwinWeekImage(currentWeek);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.orange50,
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
      paddingTop: spacing('sm'),
    },
    scrollContent: {
      paddingBottom: 140,
    },
    sectionTitle: {
      fontSize: responsiveUtils.getFixedFontSize(20),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
      textAlign: 'center',
      marginTop: spacing('md'),
    },
    progressContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing('lg'),
    },
    progressWrapper: {
      position: 'relative',
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressSvg: {
      position: 'absolute',
      transform: [{ rotate: '-90deg' }],
    },
    centerImage: {
      width: size * 0.65,
      height: size * 0.65,
      resizeMode: 'contain',
    },
    percentageBadge: {
      marginTop: spacing('md'),
      backgroundColor: theme.colors.orange500,
      borderRadius: 12,
      paddingHorizontal: spacing('sm'),
      paddingVertical: 4,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentageText: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFFFFF',
    },
    weekContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing('md'),
    },
    weekIcon: {
      marginRight: spacing('xs'),
    },
    weekText: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
    },
    descriptionText: {
      fontSize: responsiveUtils.getFixedFontSize(13),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.orange800,
      textAlign: 'center',
      paddingHorizontal: spacing('md'),
      lineHeight: responsiveUtils.getFixedLineHeight(13, 18),
      marginTop:spacing('sm'),
    },
    // Baby System Progress styles
    systemProgressCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: spacing('lg'),
      marginTop: spacing('lg'),
      marginHorizontal: -spacing('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    systemProgressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing('lg'),
    },
    systemProgressTitleContainer: {
      flex: 1,
    },
    systemProgressTitle: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    systemProgressSubtitle: {
      fontSize: responsiveUtils.getFixedFontSize(12),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    referenceNote: {
      fontSize: responsiveUtils.getFixedFontSize(11),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: responsiveUtils.getFixedLineHeight(11, 16),
      marginTop: spacing('sm'),
    },
    viewDetailButton: {
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      borderRadius: 16,
      paddingHorizontal: spacing('sm'),
      paddingVertical: 4,
    },
    viewDetailText: {
      fontSize: responsiveUtils.getFixedFontSize(12),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    systemGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing('md'),
    },
    systemCard: {
      width: '47%',
      aspectRatio: 1,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: spacing('md'),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      position: 'relative',

    },
    systemCardInactive: {
      backgroundColor: theme.colors.neutral100,
    },
    systemIconContainer: {
      marginBottom: spacing('xs'),
    },
    systemIconContainerComplete: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: spacing('xs'),
      width: ICON_SIZE + spacing('sm'),
      height: ICON_SIZE + spacing('sm'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    incrementBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.orange500,
      borderRadius: 8,
      paddingHorizontal: 3,
      paddingVertical: 1,
      minWidth: 22,
      alignItems: 'center',
      zIndex: 10,
      elevation: 5,
    },
    incrementText: {
      fontSize: 8,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#fff',
    },
    startInBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: theme.colors.neutral400,
      borderTopRightRadius: 12,
      borderBottomLeftRadius:12,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignItems: 'center',
    },
    startInText: {
      fontSize: 9,
      fontFamily: theme.typography.fontFamily.regular,
      color: '#fff',
    },
    systemName: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    systemNameInactive: {
      color: theme.colors.neutral400,
    },
    systemPercentage: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginTop: 2,
    },
    systemPercentageInactive: {
      color: theme.colors.neutral400,
    },
    giftCard: {
      width: '48%',
      aspectRatio: 1,
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.orange300,
      borderStyle: 'dashed',
      padding: spacing('sm'),
      marginBottom: spacing('sm'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    giftIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.orange500,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing('xs'),
    },
    giftText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.orange500,
      textAlign: 'center',
    },
  }), [size, theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('baby.twin_title')}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle} allowFontScaling={false}>{t('profile.babys_digital_twin')}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressWrapper}>
            {/* Circular Progress Bar */}
            <Svg
              width={size}
              height={size}
              style={styles.progressSvg}
            >
              <Defs>
                <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FF6600" stopOpacity={0.1} />
                  <Stop offset="100%" stopColor="#5FEDFF" stopOpacity={0.2} />
                </LinearGradient>
              </Defs>
              
              {/* Background circle with gradient */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#progressGradient)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              
              {/* Progress circle with orange500 fill */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.colors.orange500}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
              />
            </Svg>

            {/* Center Image */}
            <Image
              source={babyWeekImage}
              style={styles.centerImage}
            />
          </View>

          {/* Percentage Badge */}
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText} allowFontScaling={false}>
              {t('baby.week_of_total', { week: currentWeek })}
            </Text>
          </View>

          {/* Week Info */}
          <View style={styles.weekContainer}>
            <FontAwesomeIcon 
              icon={faCalendar as any} 
              size={18} 
              color={theme.colors.orange500}
              style={styles.weekIcon}
            />
            <Text style={styles.weekText} allowFontScaling={false}>{weekLabel}</Text>
          </View>
          <Text style={styles.systemProgressSubtitle}>
            {t('baby.checkpoints_completed', {
              count: completedCheckpoints,
            })}
          </Text>
        </View>

        {/* Description Text */}
        <Text style={styles.descriptionText} allowFontScaling={false}>
          {t(
            `home.week_desc_w${String(currentWeek).padStart(2, '0')}`,
          )}
        </Text>

        {/* Baby System Progress Card */}
        <View style={styles.systemProgressCard}>
          <View style={styles.systemProgressHeader}>
            <View style={styles.systemProgressTitleContainer}>
              <Text style={styles.systemProgressTitle} allowFontScaling={false}>{t('baby.system_progress')}</Text>
              <Text style={styles.systemProgressSubtitle} allowFontScaling={false}>{t('baby.milestone_trackers')}</Text>
              <Text style={styles.referenceNote} allowFontScaling={false}>
                {t('baby.reference_progress_note')}
              </Text>
            </View>
          </View>

          <View style={styles.systemGrid}>
            {babySystems.map(system => {
              const svgXml = SVG_ICONS[system.iconPath];
              if (!svgXml) return null;

              const isComplete = system.percentage === 100;
              const isActive = system.startsInWeeks === undefined;
              const rawKey = system.iconPath.replace('.svg', '');
              const systemName = t(
                `baby.system_${rawKey}` as any,
                { defaultValue: rawKey },
              );

              return (
                <View 
                  key={system.iconPath}
                  style={[
                    styles.systemCard,
                    !isActive && styles.systemCardInactive
                  ]}
                >

                     {/* Start in badge for inactive systems */}
                     {!isActive && system.startsInWeeks && (
                      <View style={styles.startInBadge}>
                        <Text style={styles.startInText} allowFontScaling={false}>
                          {t('baby.starts_in_weeks', {
                            count: system.startsInWeeks,
                          })}
                        </Text>
                      </View>
                    )}

                  <View style={[
                    styles.systemIconContainer,
                    isComplete && styles.systemIconContainerComplete
                  ]}>
                   

                    <SystemProgressIcon
                      svgXml={svgXml}
                      width={ICON_SIZE}
                      height={ICON_SIZE}
                      percentage={system.percentage}
                      uniqueId={`baby-twin-${rawKey}`}
                    />
                  </View>

                  <Text style={[
                    styles.systemName,
                    !isActive && styles.systemNameInactive
                  ]} allowFontScaling={false}>
                    {systemName}
                  </Text>
                  <Text style={[
                    styles.systemPercentage,
                    !isActive && styles.systemPercentageInactive
                  ]} allowFontScaling={false}>
                    {t('baby.milestone_percent', {
                      value: system.percentage,
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
