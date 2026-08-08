import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faLink, faChartLine, faChevronDown, faCheck, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { useTheme, spacing } from '../theme';
import { BackButton, BottomSheet, BottomSheetOption } from '../components/ui';
import { responsiveUtils } from '../utils/responsiveUtils';
import { SymptomsService } from '../services/api/SymptomsService';
import { useUserStore } from '../store/useUserStore';
import { useTranslation } from 'react-i18next';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import { loadWeeklySummaryExperience } from '../services/recommendationExperience/PresentationJourneyRepository';
import {
  SummaryService,
  type SummaryResponse,
} from '../services/api/SummaryService';
import { DEV_LOCAL_SESSION } from '../config/dev';
import type { DailyActionDomain } from '../types/recommendationExperience';
import { getPregnancyWeekDates } from '../utils/pregnancyWeekDates';
import {
  buildDevelopmentSymptomClassTrend,
  type SymptomClassTrendSeries,
} from '../services/recommendationExperience/SymptomClassTrendRepository';

const WEEK_OPTIONS = Array.from({ length: 40 }, (_, i) => i + 1);

const STAT_TABS: Array<{
  id: DailyActionDomain;
  translationKey:
    | 'mother.tab_nutrition'
    | 'mother.tab_protection'
    | 'mother.tab_activity'
    | 'mother.tab_wellbeing';
  color: string;
  backgroundColor: string;
}> = [
  {
    id: 'diet',
    translationKey: 'mother.tab_nutrition',
    color: '#2E7D4A',
    backgroundColor: '#E8F5E9',
  },
  {
    id: 'behaviour',
    translationKey: 'mother.tab_protection',
    color: '#A83149',
    backgroundColor: '#FEF2F2',
  },
  {
    id: 'activity',
    translationKey: 'mother.tab_activity',
    color: '#946000',
    backgroundColor: '#FFF7E6',
  },
  {
    id: 'wellbeing',
    translationKey: 'mother.tab_wellbeing',
    color: '#70428F',
    backgroundColor: '#F6F0FA',
  },
];
type StatTab = DailyActionDomain;

const EMPTY_PIE_DATA = [{ value: 100, color: '#E8E2DD' }];

// Symptom class colors
// Class 1: Acute & Emergency (Red), Class 2: Systemic (Gray), Class 3: Fetal Activity (Orange), Class 4: Lifestyle (Blue)
const SYMPTOM_CLASSES = [
  { id: 'class1', translationKey: 'mother.emergency', color: '#E53935' },
  { id: 'class2', translationKey: 'mother.systemic', color: '#757575' },
  { id: 'class3', translationKey: 'mother.fetal', color: '#F9AA01' },
  { id: 'class4', translationKey: 'mother.lifestyle', color: '#1E88E5' },
];

const EMPTY_WEEK_DATA = Array(7).fill({ value: 0 });

function formatWeekRange(dates: string[], locale: string): string {
  if (dates.length < 7) return '';
  const start = new Date(dates[0]);
  const end = new Date(dates[6]);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(locale, opts)}`;
}

function formatWeekday(date: string, locale: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
  });
}

interface MotherTwinScreenProps {
  onBack?: () => void;
  onOpenWeeklyReport?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatPregnancyStartDate(week: number | null, weekSetDate: string | null, locale: string, unknown: string): string {
  if (!week || !weekSetDate) return unknown;
  const d = new Date(weekSetDate);
  d.setDate(d.getDate() - (week - 1) * 7);
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const MotherTwinScreen: React.FC<MotherTwinScreenProps> = ({
  onBack,
  onOpenWeeklyReport,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'fr'
    ? 'fr-FR'
    : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-GB';
  const { profile } = useUserStore();
  const currentWeek = getCurrentPregnancyWeek(profile.pregnancyWeek, profile.pregnancyWeekSetDate) || 1;
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
  const identity = useMemo(
    () => ({
      backendUserId: profile.backendUserId,
      email: profile.email,
    }),
    [profile.backendUserId, profile.email],
  );
  const [backendSummary, setBackendSummary] =
    useState<SummaryResponse | null>(null);
  useEffect(() => {
    if (DEV_LOCAL_SESSION) return;
    let mounted = true;
    SummaryService.getSummary()
      .then(value => {
        if (mounted) setBackendSummary(value);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  const journeySummary = useMemo(
    () =>
      loadWeeklySummaryExperience({
        identity,
        pregnancyWeek: currentWeek,
        endDate: formatLocalDate(new Date()),
        milestone: t(
          `home.week_desc_w${String(currentWeek).padStart(2, '0')}`,
        ),
        backendSummary,
        localData: {
          actionCompletions,
          checkIns,
          dailyMoments,
          restTimers,
        },
      }),
    [
      actionCompletions,
      backendSummary,
      checkIns,
      dailyMoments,
      restTimers,
      currentWeek,
      identity,
      t,
    ],
  );
  const progress = Math.round(
    (journeySummary.activeDays / 7) * 100,
  );
  const [activeTab, setActiveTab] = useState<StatTab>('diet');
  const [statsWeek, setStatsWeek] = useState(currentWeek);
  const [statsWeekSheetVisible, setStatsWeekSheetVisible] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [symptomChartUnavailable, setSymptomChartUnavailable] =
    useState(false);
  const [symptomChartData, setSymptomChartData] =
    useState<SymptomClassTrendSeries>({
    class1: [...EMPTY_WEEK_DATA],
    class2: [...EMPTY_WEEK_DATA],
    class3: [...EMPTY_WEEK_DATA],
    class4: [...EMPTY_WEEK_DATA],
  });

  const weekDates = useMemo(
    () =>
      getPregnancyWeekDates(
        profile.pregnancyWeek ?? currentWeek,
        profile.pregnancyWeekSetDate,
        statsWeek,
      ),
    [
      currentWeek,
      statsWeek,
      profile.pregnancyWeek,
      profile.pregnancyWeekSetDate,
    ],
  );

  const symptomTrackerWeekDates = useMemo(
    () =>
      getPregnancyWeekDates(
        profile.pregnancyWeek ?? currentWeek,
        profile.pregnancyWeekSetDate,
        currentWeek,
      ),
    [currentWeek, profile.pregnancyWeek, profile.pregnancyWeekSetDate],
  );

  const weekRangeLabel = useMemo(
    () => formatWeekRange(weekDates, locale),
    [locale, weekDates],
  );
  const statsJourneySummary = useMemo(
    () =>
      loadWeeklySummaryExperience({
        identity,
        pregnancyWeek: statsWeek,
        endDate: weekDates[6] ?? formatLocalDate(new Date()),
        milestone: t(
          `home.week_desc_w${String(statsWeek).padStart(2, '0')}`,
        ),
        backendSummary,
        localData: {
          actionCompletions,
          checkIns,
          dailyMoments,
          restTimers,
        },
      }),
    [
      actionCompletions,
      backendSummary,
      checkIns,
      dailyMoments,
      identity,
      restTimers,
      statsWeek,
      t,
      weekDates,
    ],
  );
  const activeTabConfig =
    STAT_TABS.find(tab => tab.id === activeTab) ?? STAT_TABS[0];
  const selectedDomainDays =
    statsJourneySummary.domainParticipation[activeTab];

  useEffect(() => {
    let cancelled = false;
    if (DEV_LOCAL_SESSION) {
      setIsLoadingChart(false);
      setSymptomChartUnavailable(false);
      setSymptomChartData(
        buildDevelopmentSymptomClassTrend(
          symptomTrackerWeekDates,
          checkIns,
        ),
      );
      return () => {
        cancelled = true;
      };
    }
    setIsLoadingChart(true);
    setSymptomChartUnavailable(false);
    setSymptomChartData({
      class1: [...EMPTY_WEEK_DATA],
      class2: [...EMPTY_WEEK_DATA],
      class3: [...EMPTY_WEEK_DATA],
      class4: [...EMPTY_WEEK_DATA],
    });

    Promise.all(
      symptomTrackerWeekDates.map((date) =>
        SymptomsService.getMommyStatisticsClasses({ start_date: date, end_date: date })
          .catch(() => null),
      ),
    ).then((results) => {
      if (cancelled) return;
      const c1: { value: number }[] = [];
      const c2: { value: number }[] = [];
      const c3: { value: number }[] = [];
      const c4: { value: number }[] = [];

      results.forEach((res) => {
        const classes: { symptom_class: number; quantity: number }[] = res?.classes ?? [];
        const qty = (cls: number) => classes.find((c) => c.symptom_class === cls)?.quantity ?? 0;
        c1.push({ value: qty(1) });
        c2.push({ value: qty(2) });
        c3.push({ value: qty(3) });
        c4.push({ value: qty(4) });
      });

      setSymptomChartData({ class1: c1, class2: c2, class3: c3, class4: c4 });
      setSymptomChartUnavailable(results.every(result => result === null));
    }).finally(() => { if (!cancelled) setIsLoadingChart(false); });

    return () => { cancelled = true; };
  }, [checkIns, symptomTrackerWeekDates]);
  const hasSymptomChartData = useMemo(
    () =>
      SYMPTOM_CLASSES.some(cls =>
        symptomChartData[
          cls.id as keyof typeof symptomChartData
        ].some(point => point.value > 0),
      ),
    [symptomChartData],
  );
  const symptomRecordedDays = useMemo(() => {
    const localDays = symptomTrackerWeekDates.filter(
      date => (checkIns[date]?.mommySymptomKeys.length ?? 0) > 0,
    ).length;
    const backendDays = symptomTrackerWeekDates.filter((_, index) =>
      SYMPTOM_CLASSES.some(
        cls =>
          symptomChartData[
            cls.id as keyof typeof symptomChartData
          ][index]?.value > 0,
      ),
    ).length;
    return Math.max(localDays, backendDays);
  }, [checkIns, symptomChartData, symptomTrackerWeekDates]);
  const symptomTrendText =
    symptomRecordedDays > 0
      ? t('mother.symptom_trend_recorded', {
          count: symptomRecordedDays,
        })
      : statsJourneySummary.dataMode === 'careContext'
      ? t('mother.symptom_trend_context')
      : t('mother.symptom_trend_none');
  const maxContentHeight = SCREEN_HEIGHT * 0.3;
  const size = Math.min(140, maxContentHeight * 0.8); // Smaller circular progress
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

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
      paddingBottom: 150,
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
      backgroundColor: '#F9AA01',
      borderRadius: 12,
      paddingHorizontal: spacing('sm'),
      paddingVertical: 4,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentageText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFFFFF',
    },
    careRhythmLabel: {
      marginTop: spacing('sm'),
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    infoCard: {
      width:'80%',
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: spacing('md'),
      marginTop: spacing('lg'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      alignSelf:'center',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    infoRowLast: {
      marginBottom: 0,
    },
    infoIcon: {
      marginRight: spacing('sm'),
      width: 24,
      alignItems: 'center',
    },
    infoIconCircle: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.orange500,
    },
    infoText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    // Badges container
    badgesContainer: {
      width: Dimensions.get('window').width,
      backgroundColor: '#fff',
      marginTop: spacing('lg'),
      marginLeft: -spacing('md'),
      marginRight: -spacing('md'),
      paddingTop: spacing('lg'),
      paddingBottom: spacing('lg'),
    },
    badgeCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: spacing('md'),
      marginHorizontal: spacing('md'),
      marginBottom: spacing('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    badgeCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badgeImageContainer: {
      marginRight: spacing('md'),
    },
    badgeImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      resizeMode: 'cover',
    },
    badgeContentRight: {
      flex: 1,
      flexDirection: 'column',
    },
    badgeTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('sm'),
    },
    badgeCardTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
    },
    badgeAmountContainer: {
      backgroundColor: '#4CAF50',
      borderRadius: 12,
      paddingHorizontal: spacing('sm'),
      paddingVertical: 4,
    },
    badgeAmountText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#fff',
    },
    badgeButtonsContainer: {
      flexDirection: 'row',
      gap: spacing('sm'),
    },
    badgeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      borderRadius: 12,
      paddingVertical: spacing('sm'),
      paddingHorizontal: spacing('md'),
    },
    badgeButtonIcon: {
      marginRight: spacing('sm'),
    },
    badgeButtonText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    weeklySignalsCard: {
      backgroundColor: '#FFF8F2',
      borderRadius: 16,
      padding: spacing('md'),
      marginHorizontal: spacing('md'),
      marginBottom: spacing('md'),
      borderWidth: 1,
      borderColor: theme.colors.orange100,
    },
    weeklySignalsTitle: {
      fontSize: 15,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('sm'),
    },
    weeklySignalsContext: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 17,
      marginBottom: spacing('md'),
    },
    weeklySignalsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('sm'),
    },
    weeklySignalItem: {
      width: '48%',
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      padding: spacing('sm'),
    },
    weeklySignalValue: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange600,
    },
    weeklySignalLabel: {
      marginTop: 2,
      fontSize: 11,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    // Statistics Card Styles
    statsCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: spacing('md'),
      marginHorizontal: spacing('md'),
      marginTop: spacing('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    statsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    statsHeaderIcon: {
      marginRight: spacing('sm'),
    },
    statsHeaderTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    statsSubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    statsDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsDateIcon: {
      marginRight: spacing('xs'),
    },
    statsDateText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    statsContextNote: {
      fontSize: 13,
      lineHeight: 19,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginBottom: spacing('md'),
    },
    statsWeekDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      borderRadius: 8,
      paddingHorizontal: spacing('sm'),
      paddingVertical: 6,
    },
    statsWeekText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      marginRight: spacing('xs'),
    },
    statsTabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('sm'),
      marginBottom: spacing('md'),
    },
    statsTab: {
      width: '48%',
      alignItems: 'center',
      paddingHorizontal: spacing('sm'),
      paddingVertical: spacing('sm'),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      backgroundColor: '#fff',
    },
    statsTabActive: {
      backgroundColor: theme.colors.orange100,
      borderColor: theme.colors.orange500,
    },
    statsTabText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    statsTabTextActive: {
      color: theme.colors.orange500,
      fontFamily: theme.typography.fontFamily.bold,
    },
    statsChartContainer: {
      backgroundColor: '#E8F5E9',
      borderRadius: 16,
      padding: spacing('md'),
      marginBottom: spacing('md'),
    },
    statsChartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    statsChartIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing('sm'),
    },
    statsChartIconInner: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#fff',
    },
    statsChartTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    statsChartWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing('md'),
      position: 'relative',
    },
    statsChartCenter: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsChartCenterValue: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    statsChartCenterLabel: {
      marginTop: 1,
      fontSize: 11,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    statsLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#4CAF50',
      marginRight: spacing('xs'),
    },
    statsLegendText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: '#4CAF50',
    },
    statsDayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('sm'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral200,
    },
    statsDayRowLast: {
      borderBottomWidth: 0,
    },
    statsDayDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginRight: spacing('sm'),
    },
    statsDayName: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    statsDayProgress: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginRight: spacing('sm'),
    },
    statsDayCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Symptoms Tracker Styles
    symptomsCard: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: spacing('md'),
      marginHorizontal: spacing('md'),
      marginTop: spacing('md'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    symptomsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('sm'),
    },
    symptomsHeaderIcon: {
      marginRight: spacing('sm'),
    },
    symptomsHeaderTitle: {
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    symptomsDescription: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing('md'),
    },
    symptomsEmptyState: {
      minHeight: 130,
      borderRadius: 12,
      backgroundColor: theme.colors.neutral100,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing('lg'),
      marginBottom: spacing('sm'),
    },
    symptomsEmptyText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: 18,
      textAlign: 'center',
    },
    symptomsChartContainer: {
      marginBottom: spacing('sm'),
      overflow: 'hidden',
      borderRadius: 12,
    },
    symptomsXAxisRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
      marginBottom: spacing('md'),
    },
    symptomsXAxisLabel: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      flex: 1,
    },
    symptomsLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('sm'),
      marginTop: spacing('xs'),
    },
    symptomsLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('sm'),
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.neutral200,
    },
    symptomsLegendItemActive: {
      borderWidth: 1.5,
    },
    symptomsLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing('xs'),
    },
    symptomsLegendLabel: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    symptomsLegendLabelActive: {
      fontFamily: theme.typography.fontFamily.bold,
    },
  }), [size, theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>{t('mother.title')}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
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
                stroke={'#F9AA01'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
              />
            </Svg>

            {/* Center Image */}
            <Image
              source={require('../assets/motherDigital/md1.png')}
              style={styles.centerImage}
            />
          </View>

          {/* Percentage Badge */}
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText} allowFontScaling={false}>
              {t('profile.active_days_badge', {
                days: journeySummary.activeDays,
              })}
            </Text>
          </View>
          <Text style={styles.careRhythmLabel}>
            {t(
              journeySummary.dataMode === 'careContext'
                ? 'mother.care_context_label'
                : 'mother.care_rhythm_label',
            )}
          </Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FontAwesomeIcon 
                icon={faCalendar as any} 
                size={16} 
                color={theme.colors.textPrimary}
              />
            </View>
            <Text style={styles.infoText} allowFontScaling={false}>
              {t('mother.start_date')}
              {formatPregnancyStartDate(
                profile.pregnancyWeek,
                profile.pregnancyWeekSetDate,
                locale,
                t('mother.not_set'),
              )}
            </Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.infoIcon}>
              <View style={styles.infoIconCircle} />
            </View>
            <Text style={styles.infoText} allowFontScaling={false}>
              {t('mother.pregnancy_journey_week', {
                week: currentWeek,
              })}
            </Text>
          </View>
        </View>

        {/* Badges Container */}
        <View style={styles.badgesContainer}>
          {/* Badge Card */}
          <View style={styles.badgeCard}>
            <View style={styles.badgeCardContent}>
              <View style={styles.badgeImageContainer}>
                <Image
                  source={require('../assets/images/motherBadge.png')}
                  style={styles.badgeImage}
                />
              </View>

              <View style={styles.badgeContentRight}>
                {/* Row 1: Title and Amount */}
                <View style={styles.badgeTitleRow}>
                  <Text style={styles.badgeCardTitle} allowFontScaling={false}>{t('mother.this_week')}</Text>
                  {journeySummary.primaryTotal > 0 ? (
                    <View style={styles.badgeAmountContainer}>
                      <Text style={styles.badgeAmountText} allowFontScaling={false}>
                        {journeySummary.primaryCompleted}/{journeySummary.primaryTotal}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* The full privacy-safe share flow lives in Weekly Summary. */}
                <View style={styles.badgeButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.badgeButton}
                    activeOpacity={0.7}
                    disabled={!onOpenWeeklyReport}
                    onPress={onOpenWeeklyReport}
                  >
                    <FontAwesomeIcon
                      icon={faLink}
                      size={16}
                      color={theme.colors.textPrimary}
                      style={styles.badgeButtonIcon}
                    />
                    <Text style={styles.badgeButtonText} allowFontScaling={false}>
                      {t('mother.weekly_report')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.weeklySignalsCard}>
            <Text style={styles.weeklySignalsTitle}>
              {t('mother.weekly_care_snapshot')}
            </Text>
            {journeySummary.dataMode === 'careContext' ? (
              <Text style={styles.weeklySignalsContext}>
                {t('mother.care_context_explanation')}
              </Text>
            ) : null}
            <View style={styles.weeklySignalsGrid}>
              <View style={styles.weeklySignalItem}>
                <Text style={styles.weeklySignalValue}>
                  {journeySummary.activeDays}/7
                </Text>
                <Text style={styles.weeklySignalLabel}>
                  {t('mother.active_care_days')}
                </Text>
              </View>
              <View style={styles.weeklySignalItem}>
                <Text style={styles.weeklySignalValue}>
                  {journeySummary.hydrationDays}/7
                </Text>
                <Text style={styles.weeklySignalLabel}>
                  {t('mother.hydration_days')}
                </Text>
              </View>
              <View style={styles.weeklySignalItem}>
                <Text style={styles.weeklySignalValue}>
                  {journeySummary.restSessions}
                </Text>
                <Text style={styles.weeklySignalLabel}>
                  {t('mother.rest_sessions')}
                </Text>
              </View>
              <View style={styles.weeklySignalItem}>
                <Text style={styles.weeklySignalValue}>
                  {journeySummary.sleepNights}/7
                </Text>
                <Text style={styles.weeklySignalLabel}>
                  {t('mother.sleep_checkins')}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics Card */}
          <View style={styles.statsCard}>
            {/* Header */}
            <View style={styles.statsHeader}>
              <FontAwesomeIcon 
                icon={faChartLine as any} 
                size={20} 
                color={theme.colors.textSecondary}
                style={styles.statsHeaderIcon}
              />
              <Text style={styles.statsHeaderTitle} allowFontScaling={false}>{t('mother.stats_title')}</Text>
            </View>

            {/* Sub Header: Date & Week Dropdown */}
            <View style={styles.statsSubHeader}>
              <View style={styles.statsDateRow}>
                <FontAwesomeIcon
                  icon={faCalendar as any}
                  size={14}
                  color={theme.colors.textSecondary}
                  style={styles.statsDateIcon}
                />
                <Text style={styles.statsDateText} allowFontScaling={false}>
                  {weekRangeLabel}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.statsWeekDropdown}
                activeOpacity={0.7}
                onPress={() => setStatsWeekSheetVisible(true)}
              >
                <Text style={styles.statsWeekText} allowFontScaling={false}>{t('today.week_label', { week: statsWeek })}</Text>
                <FontAwesomeIcon 
                  icon={faChevronDown as any} 
                  size={12} 
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {statsJourneySummary.dataMode === 'careContext' ? (
              <Text style={styles.statsContextNote} allowFontScaling={false}>
                {t('mother.stats_care_context_note')}
              </Text>
            ) : null}

            {/* Tabs */}
            <View style={styles.statsTabs}>
              {STAT_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.statsTab,
                    activeTab === tab.id && styles.statsTabActive,
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.statsTabText,
                    activeTab === tab.id && styles.statsTabTextActive,
                  ]} allowFontScaling={false}>
                    {t(tab.translationKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart Container */}
            <View
              style={[
                styles.statsChartContainer,
                {
                  backgroundColor:
                    activeTabConfig.backgroundColor,
                },
              ]}
            >
              {/* Chart Header */}
              <View style={styles.statsChartHeader}>
                <View
                  style={[
                    styles.statsChartIcon,
                    { backgroundColor: activeTabConfig.color },
                  ]}
                >
                  <View style={styles.statsChartIconInner} />
                </View>
                <Text style={styles.statsChartTitle} allowFontScaling={false}>
                  {t(activeTabConfig.translationKey)}
                </Text>
              </View>

              {/* Pie Chart */}
              <View style={styles.statsChartWrapper}>
                <PieChart
                  data={
                    selectedDomainDays > 0
                      ? [
                          {
                            value: selectedDomainDays,
                            color: activeTabConfig.color,
                          },
                          {
                            value: 7 - selectedDomainDays,
                            color: '#E8E2DD',
                          },
                        ]
                      : EMPTY_PIE_DATA
                  }
                  radius={80}
                  donut
                  innerRadius={54}
                  showText={false}
                  focusOnPress={false}
                />
                <View style={styles.statsChartCenter}>
                  <Text style={styles.statsChartCenterValue}>
                    {selectedDomainDays}/7
                  </Text>
                  <Text style={styles.statsChartCenterLabel}>
                    {t('mother.days')}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.statsLegendText,
                  { color: activeTabConfig.color, textAlign: 'center' },
                ]}
              >
                {t(
                  statsJourneySummary.dataMode === 'careContext'
                    ? 'mother.domain_context_summary'
                    : 'mother.domain_days_summary',
                  {
                  count: selectedDomainDays,
                  },
                )}
              </Text>
            </View>

            {/* Days Progress */}
            {statsJourneySummary.days.map((day, index) => {
              const completed = day.domains[activeTab];
              return (
              <View 
                key={day.date}
                style={[
                  styles.statsDayRow,
                  index === statsJourneySummary.days.length - 1 &&
                    styles.statsDayRowLast,
                ]}
              >
                <View style={[styles.statsDayDot, { backgroundColor: completed ? activeTabConfig.color : theme.colors.neutral300 }]} />
                <Text style={styles.statsDayName} allowFontScaling={false}>{formatWeekday(day.date, locale)}</Text>
                <Text style={styles.statsDayProgress} allowFontScaling={false}>{completed ? '1/1' : '0/1'}</Text>
                {completed && (
                  <View style={[styles.statsDayCheck, { backgroundColor: activeTabConfig.color }]}>
                    <FontAwesomeIcon 
                      icon={faCheck as any} 
                      size={14} 
                      color="#fff"
                    />
                  </View>
                )}
              </View>
              );
            })}
          </View>

          {/* Symptoms Tracker Card */}
          <View style={styles.symptomsCard}>
            {/* Header */}
            <View style={styles.symptomsHeader}>
              <FontAwesomeIcon 
                icon={faCrosshairs as any} 
                size={20} 
                color={theme.colors.textPrimary}
                style={styles.symptomsHeaderIcon}
              />
              <Text style={styles.symptomsHeaderTitle} allowFontScaling={false}>{t('mother.feelings_tracker')}</Text>
              {isLoadingChart && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.orange500}
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </View>

            <Text style={styles.symptomsDescription} allowFontScaling={false}>
              {formatWeekRange(symptomTrackerWeekDates, locale)}
            </Text>
            <Text style={styles.symptomsDescription}>
              {symptomTrendText}
            </Text>

            {/* Four symptom groups, current week, day by day. */}
            {hasSymptomChartData ? (
              <View style={styles.symptomsChartContainer}>
              <LineChart
                data={symptomChartData.class4}
                data2={symptomChartData.class2}
                data3={symptomChartData.class3}
                data4={symptomChartData.class1}
                width={Dimensions.get('window').width - 80}
                height={180}
                curved
                hideDataPoints
                hideYAxisText
                hideAxesAndRules
                color1="#1E88E5"
                color2="#757575"
                color3="#F9AA01"
                color4="#E53935"
                initialSpacing={0}
                endSpacing={0}
                thickness={2}
              />
              </View>
            ) : (
              <View style={styles.symptomsEmptyState}>
                {isLoadingChart ? (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.orange500}
                  />
                ) : (
                  <Text style={styles.symptomsEmptyText}>
                    {t(
                      symptomChartUnavailable
                        ? 'mother.symptom_classes_need_sync'
                        : 'mother.symptom_classes_empty',
                    )}
                  </Text>
                )}
              </View>
            )}

            {/* X-axis day labels */}
            <View style={styles.symptomsXAxisRow}>
              {symptomTrackerWeekDates.map(date => (
                <Text key={date} style={styles.symptomsXAxisLabel} allowFontScaling={false}>{formatWeekday(date, locale)}</Text>
              ))}
            </View>

            {/* Class Legend */}
            <View style={styles.symptomsLegend}>
              {SYMPTOM_CLASSES.map(cls => (
                  <View key={cls.id} style={styles.symptomsLegendItem}>
                    <View style={[styles.symptomsLegendDot, { backgroundColor: cls.color }]} />
                    <Text style={styles.symptomsLegendLabel} allowFontScaling={false}>
                      {t(cls.translationKey)}
                    </Text>
                  </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomSheet
        visible={statsWeekSheetVisible}
        onClose={() => setStatsWeekSheetVisible(false)}
        title={t('mother.select_week')}
      >
        <ScrollView
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing('xl') }}
        >
          {WEEK_OPTIONS.map((week) => (
            <BottomSheetOption
              key={week}
              label={t('today.week_label', { week })}
              selected={statsWeek === week}
              onPress={() => {
                setStatsWeek(week);
                setStatsWeekSheetVisible(false);
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>

    </SafeAreaView>
  );
};
