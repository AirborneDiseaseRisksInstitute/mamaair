import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
  type LayoutChangeEvent,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBaby,
  faCalendar,
  faLink,
  faChartLine,
  faCrosshairs,
  faPersonPregnant,
} from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LineChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, spacing } from '../theme';
import { BackButton } from '../components/ui';
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
import type { WeeklyActionSummaryDomain } from '../types/recommendationExperience';
import { getPregnancyWeekDates } from '../utils/pregnancyWeekDates';
import {
  buildCompleteApiSymptomClassTrend,
  buildDevelopmentSymptomClassTrend,
  getApiSymptomClassMetadata,
  type SymptomClassMetadata,
  type SymptomClassTrendSeries,
} from '../services/recommendationExperience/SymptomClassTrendRepository';
import {
  buildMotherTwinChartModel,
  type EnvironmentalRiskAudience,
} from '../services/recommendationExperience/MotherTwinChartRepository';
import {
  loadWeeklyHydrationReadings,
  type WeeklyHydrationReadings,
} from '../services/recommendationExperience/WeeklyHydrationRepository';
import { loadExposureTrend } from '../services/recommendationExperience/ExposureTrendRepository';
import type { ExposureTrendPoint } from '../types/recommendationExperience';
import {
  classifyEnvironmentalRiskLoadError,
  resolveEnvironmentalRiskCardState,
  type EnvironmentalRiskLoadError,
} from '../services/recommendationExperience/EnvironmentalRiskCardPresenter';
import type { ApiFailureKind } from '../utils/apiErrors';

const ENVIRONMENTAL_RISK_FAILURE_REASON_KEYS: Record<
  ApiFailureKind,
  string
> = {
  network: 'mother.environmental_risk_reason_network',
  timeout: 'mother.environmental_risk_reason_timeout',
  authentication: 'mother.environmental_risk_reason_authentication',
  permission: 'mother.environmental_risk_reason_permission',
  notFound: 'mother.environmental_risk_reason_not_found',
  validation: 'mother.environmental_risk_reason_validation',
  rateLimit: 'mother.environmental_risk_reason_rate_limit',
  server: 'mother.environmental_risk_reason_server',
  unknown: 'mother.environmental_risk_reason_unknown',
};

const STAT_TABS: Array<{
  id: WeeklyActionSummaryDomain;
  translationKey:
    | 'mother.tab_nutrition'
    | 'mother.tab_protection'
    | 'mother.tab_activity'
    | 'mother.tab_wellbeing';
  color: string;
}> = [
  {
    id: 'diet',
    translationKey: 'mother.tab_nutrition',
    color: '#2E7D4A',
  },
  {
    id: 'behaviour',
    translationKey: 'mother.tab_protection',
    color: '#A83149',
  },
  {
    id: 'activity',
    translationKey: 'mother.tab_activity',
    color: '#946000',
  },
  {
    id: 'wellbeing',
    translationKey: 'mother.tab_wellbeing',
    color: '#70428F',
  },
];

// Feeling pattern colors
// Class 1: Acute & Emergency (Red), Class 2: Systemic (Gray), Class 3: Fetal Activity (Orange), Class 4: Lifestyle (Blue)
const SYMPTOM_CLASSES = [
  {
    apiClass: 1,
    id: 'class1',
    translationKey: 'mother.emergency',
    color: '#E53935',
  },
  {
    apiClass: 2,
    id: 'class2',
    translationKey: 'mother.systemic',
    color: '#757575',
  },
  {
    apiClass: 3,
    id: 'class3',
    translationKey: 'mother.fetal',
    color: '#F9AA01',
  },
  {
    apiClass: 4,
    id: 'class4',
    translationKey: 'mother.lifestyle',
    color: '#1E88E5',
  },
] as const;

const EMPTY_WEEK_DATA = Array(7).fill({ value: 0 });
const CHART_Y_AXIS_WIDTH = 28;
const CHART_POINT_RADIUS = 3;

type ChartViewport = 'care' | 'symptoms' | 'risk';

function getCountChartScale(series: { value: number }[][]): {
  maxValue: number;
  noOfSections: number;
} {
  const highestValue = Math.max(
    0,
    ...series.flatMap(points => points.map(point => point.value)),
  );
  const roundedHighest = Math.max(1, Math.ceil(highestValue));

  if (roundedHighest <= 4) {
    return {
      maxValue: roundedHighest,
      noOfSections: roundedHighest,
    };
  }

  return {
    maxValue: Math.ceil(roundedHighest / 4) * 4,
    noOfSections: 4,
  };
}

function getChartPlotWidth(viewportWidth: number): number {
  return Math.max(1, viewportWidth - CHART_Y_AXIS_WIDTH - CHART_POINT_RADIUS);
}

function getWeeklyChartSpacing(viewportWidth: number): {
  initialSpacing: number;
  spacing: number;
} {
  const pointSpacing = getChartPlotWidth(viewportWidth) / 7;
  return {
    initialSpacing: pointSpacing / 2,
    spacing: pointSpacing,
  };
}

function formatWeekRange(dates: string[], locale: string): string {
  if (dates.length < 7) return '';
  const start = new Date(dates[0]);
  const end = new Date(dates[6]);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(
    locale,
    opts,
  )}`;
}

function formatWeekday(date: string, locale: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
  });
}

function formatRiskValue(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRiskDelta(value: number | undefined, locale: string): string {
  if (value === undefined) return '\u2014';
  const formatted = formatRiskValue(Math.abs(value), locale);
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted;
}

interface MotherTwinScreenProps {
  onBack?: () => void;
  onOpenWeeklyReport?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function formatPregnancyStartDate(
  week: number | null,
  weekSetDate: string | null,
  locale: string,
  unknown: string,
): string {
  if (!week || !weekSetDate) return unknown;
  const d = new Date(weekSetDate);
  d.setDate(d.getDate() - (week - 1) * 7);
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const MotherTwinScreen: React.FC<MotherTwinScreenProps> = ({
  onBack,
  onOpenWeeklyReport,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale =
    i18n.resolvedLanguage === 'fr'
      ? 'fr-FR'
      : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-GB';
  const { profile } = useUserStore();
  const currentWeek =
    getCurrentPregnancyWeek(
      profile.pregnancyWeek,
      profile.pregnancyWeekSetDate,
    ) || 1;
  const actionCompletions = useRecommendationExperienceStore(
    state => state.actionCompletions,
  );
  const checkIns = useRecommendationExperienceStore(state => state.checkIns);
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
  const [backendSummary, setBackendSummary] = useState<SummaryResponse | null>(
    null,
  );
  const [isLoadingRisk, setIsLoadingRisk] = useState(!DEV_LOCAL_SESSION);
  const [riskLoadError, setRiskLoadError] =
    useState<EnvironmentalRiskLoadError | null>(null);
  const [exposureTrend, setExposureTrend] = useState<ExposureTrendPoint[]>([]);
  const [hydrationReadings, setHydrationReadings] =
    useState<WeeklyHydrationReadings | null>(null);
  const [isLoadingHydration, setIsLoadingHydration] = useState(false);
  const [chartViewportWidths, setChartViewportWidths] = useState<
    Record<ChartViewport, number>
  >({
    care: 0,
    symptoms: 0,
    risk: 0,
  });
  const currentDate = formatLocalDate(new Date());
  const weekDates = useMemo(
    () =>
      getPregnancyWeekDates(
        profile.pregnancyWeek ?? currentWeek,
        profile.pregnancyWeekSetDate,
        currentWeek,
      ),
    [currentWeek, profile.pregnancyWeek, profile.pregnancyWeekSetDate],
  );

  const updateChartViewportWidth = useCallback(
    (viewport: ChartViewport, event: LayoutChangeEvent): void => {
      const nextWidth = Math.floor(event.nativeEvent.layout.width);
      if (nextWidth <= 0) return;

      setChartViewportWidths(current =>
        current[viewport] === nextWidth
          ? current
          : { ...current, [viewport]: nextWidth },
      );
    },
    [],
  );

  const refreshSummary = useCallback(
    async (isActive: () => boolean = () => true): Promise<void> => {
      if (DEV_LOCAL_SESSION) return;

      setIsLoadingRisk(true);
      setRiskLoadError(null);
      try {
        const value = await SummaryService.getSummary();
        if (!isActive()) return;
        setBackendSummary(value ?? null);
        const trend = await loadExposureTrend({
          summary: value ?? null,
          endDate: currentDate,
          pregnancyWeek: currentWeek,
        });
        if (isActive()) setExposureTrend(trend.points);
      } catch (error) {
        if (isActive()) {
          setRiskLoadError(classifyEnvironmentalRiskLoadError(error));
        }
      } finally {
        if (isActive()) setIsLoadingRisk(false);
      }
    },
    [currentDate, currentWeek],
  );

  const refreshHydration = useCallback(
    async (isActive: () => boolean = () => true): Promise<void> => {
      if (DEV_LOCAL_SESSION) return;

      setIsLoadingHydration(true);
      const readings = await loadWeeklyHydrationReadings(weekDates);
      if (isActive()) {
        setHydrationReadings(readings);
        setIsLoadingHydration(false);
      }
    },
    [weekDates],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshSummary(() => active);
      refreshHydration(() => active);

      return () => {
        active = false;
      };
    }, [refreshHydration, refreshSummary]),
  );
  const journeySummary = useMemo(
    () =>
      loadWeeklySummaryExperience({
        identity,
        pregnancyWeek: currentWeek,
        endDate: weekDates[6],
        milestone: t(`home.week_desc_w${String(currentWeek).padStart(2, '0')}`),
        backendSummary,
        hydrationReadings,
        locale,
        translate: (key, options) => t(key, options),
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
      hydrationReadings,
      locale,
      t,
      weekDates,
    ],
  );
  const progress = Math.round((journeySummary.activeDays / 7) * 100);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [symptomChartUnavailable, setSymptomChartUnavailable] = useState(false);
  const [symptomClassMetadata, setSymptomClassMetadata] = useState<
    Partial<Record<1 | 2 | 3 | 4, SymptomClassMetadata>>
  >({});
  const [symptomChartData, setSymptomChartData] =
    useState<SymptomClassTrendSeries>({
      class1: [...EMPTY_WEEK_DATA],
      class2: [...EMPTY_WEEK_DATA],
      class3: [...EMPTY_WEEK_DATA],
      class4: [...EMPTY_WEEK_DATA],
    });

  const symptomTrackerWeekDates = weekDates;

  const weekRangeLabel = useMemo(
    () => formatWeekRange(weekDates, locale),
    [locale, weekDates],
  );
  const chartModel = useMemo(
    () =>
      buildMotherTwinChartModel({
        weekDates,
        actionCompletions,
        backendSummary,
        currentDate,
      }),
    [actionCompletions, backendSummary, currentDate, weekDates],
  );

  useEffect(() => {
    let cancelled = false;
    if (DEV_LOCAL_SESSION) {
      setIsLoadingChart(false);
      setSymptomChartUnavailable(false);
      setSymptomChartData(
        buildDevelopmentSymptomClassTrend(symptomTrackerWeekDates, checkIns),
      );
      return () => {
        cancelled = true;
      };
    }
    setIsLoadingChart(true);
    setSymptomChartUnavailable(false);
    setSymptomClassMetadata({});
    setSymptomChartData({
      class1: [...EMPTY_WEEK_DATA],
      class2: [...EMPTY_WEEK_DATA],
      class3: [...EMPTY_WEEK_DATA],
      class4: [...EMPTY_WEEK_DATA],
    });

    Promise.all(
      symptomTrackerWeekDates.map(date =>
        SymptomsService.getMommyStatisticsClasses({
          start_date: date,
          end_date: date,
        }).catch(() => null),
      ),
    )
      .then(results => {
        if (cancelled) return;
        const trend = buildCompleteApiSymptomClassTrend(results);
        if (!trend) {
          setSymptomChartUnavailable(true);
          return;
        }

        setSymptomChartData(trend);
        setSymptomClassMetadata(getApiSymptomClassMetadata(results));
        setSymptomChartUnavailable(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [checkIns, symptomTrackerWeekDates]);
  const hasSymptomChartData = useMemo(
    () =>
      SYMPTOM_CLASSES.some(cls =>
        symptomChartData[cls.id as keyof typeof symptomChartData].some(
          point => point.value > 0,
        ),
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
          symptomChartData[cls.id as keyof typeof symptomChartData][index]
            ?.value > 0,
      ),
    ).length;
    return Math.max(localDays, backendDays);
  }, [checkIns, symptomChartData, symptomTrackerWeekDates]);
  const symptomTrendText =
    symptomRecordedDays > 0
      ? t('mother.symptom_trend_recorded', {
          count: symptomRecordedDays,
        })
      : journeySummary.dataMode === 'careContext'
      ? t('mother.symptom_trend_context')
      : t('mother.symptom_trend_none');
  const careChartScale = useMemo(
    () =>
      getCountChartScale(
        STAT_TABS.map(tab => chartModel.careCompletion[tab.id]),
      ),
    [chartModel.careCompletion],
  );
  const symptomChartScale = useMemo(
    () =>
      getCountChartScale(
        SYMPTOM_CLASSES.map(
          cls => symptomChartData[cls.id as keyof SymptomClassTrendSeries],
        ),
      ),
    [symptomChartData],
  );
  const exposureTrendByDate = useMemo(
    () =>
      new Map(
        exposureTrend
          .filter(
            point =>
              weekDates.includes(point.date) &&
              typeof point.integratedScore === 'number' &&
              Number.isFinite(point.integratedScore),
          )
          .map(point => [point.date, point.integratedScore as number]),
      ),
    [exposureTrend, weekDates],
  );
  const exposureTrendSeries = useMemo(
    () =>
      weekDates.map(date => ({
        value: exposureTrendByDate.get(date),
      })),
    [exposureTrendByDate, weekDates],
  );
  const exposureTrendMaxValue = useMemo(() => {
    const highestValue = Math.max(0, ...exposureTrendByDate.values());
    return Math.max(1, Math.ceil(highestValue * 1.15 * 4) / 4);
  }, [exposureTrendByDate]);
  const maxContentHeight = SCREEN_HEIGHT * 0.3;
  const size = Math.min(140, maxContentHeight * 0.8); // Smaller circular progress
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: theme.colors.surface,
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
          width: '80%',
          backgroundColor: theme.colors.surface,
          borderRadius: 16,
          padding: spacing('md'),
          marginTop: spacing('lg'),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
          alignSelf: 'center',
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
          backgroundColor: theme.colors.surface,
          marginTop: spacing('lg'),
          marginLeft: -spacing('md'),
          marginRight: -spacing('md'),
          paddingTop: spacing('lg'),
          paddingBottom: spacing('lg'),
        },
        badgeCard: {
          backgroundColor: theme.colors.surface,
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
          backgroundColor: theme.colors.surface,
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
          backgroundColor: theme.surfaceColor('#FFF8F2'),
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
          backgroundColor: theme.colors.surface,
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
          backgroundColor: theme.colors.surface,
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
          justifyContent: 'flex-start',
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
        statsChartContainer: {
          backgroundColor: theme.surfaceColor('#FFF8F2'),
          borderRadius: 16,
          padding: spacing('md'),
          marginBottom: spacing('md'),
          overflow: 'hidden',
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
          backgroundColor: theme.colors.surface,
        },
        statsChartTitle: {
          fontSize: 16,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
        },
        statsLegend: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing('sm'),
          marginTop: spacing('sm'),
        },
        statsLegendDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          marginRight: spacing('xs'),
        },
        currentRiskDot: {
          backgroundColor: '#9B3F00',
        },
        riskDeltaDot: {
          backgroundColor: '#2E7D4A',
        },
        statsLegendText: {
          fontSize: 12,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
        },
        legendItem: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        riskCard: {
          backgroundColor: theme.colors.surface,
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
        riskHeaderIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
        },
        motherRiskHeaderIcon: {
          backgroundColor: theme.surfaceColor('#FFF1E6'),
        },
        childRiskHeaderIcon: {
          backgroundColor: theme.surfaceColor('#EAF6F2'),
        },
        riskHeaderTitle: {
          flex: 1,
        },
        riskChartContainer: {
          marginTop: spacing('sm'),
          marginBottom: spacing('sm'),
          overflow: 'hidden',
          borderRadius: 12,
        },
        riskDescription: {
          fontSize: 13,
          lineHeight: 19,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          marginBottom: spacing('sm'),
        },
        riskFirstReading: {
          minHeight: 190,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing('lg'),
        },
        riskFirstReadingTitle: {
          fontSize: 15,
          lineHeight: 21,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          textAlign: 'center',
        },
        riskFirstReadingText: {
          marginTop: spacing('xs'),
          fontSize: 13,
          lineHeight: 19,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          textAlign: 'center',
        },
        riskFirstReadingValues: {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'stretch',
          marginTop: spacing('lg'),
        },
        riskFirstReadingValue: {
          flex: 1,
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
        },
        riskFirstReadingDivider: {
          width: 1,
          backgroundColor: theme.colors.neutral200,
        },
        riskFirstReadingLabelRow: {
          minHeight: 20,
          flexDirection: 'row',
          alignItems: 'center',
        },
        riskFirstReadingValueText: {
          marginTop: spacing('xs'),
          fontSize: 24,
          lineHeight: 30,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
        },
        riskFirstReadingDate: {
          marginTop: spacing('md'),
          fontSize: 12,
          fontFamily: theme.typography.fontFamily.medium,
          color: theme.colors.textSecondary,
        },
        riskEmptyState: {
          minHeight: 190,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.neutral200,
          backgroundColor: theme.colors.orange50,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing('lg'),
        },
        riskEmptyIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing('sm'),
        },
        riskEmptyTitle: {
          fontSize: 15,
          lineHeight: 21,
          fontFamily: theme.typography.fontFamily.bold,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing('xs'),
        },
        riskEmptyText: {
          fontSize: 13,
          lineHeight: 19,
          fontFamily: theme.typography.fontFamily.regular,
          color: theme.colors.textSecondary,
          textAlign: 'center',
        },
        riskRetryButton: {
          minHeight: 40,
          borderRadius: 8,
          backgroundColor: theme.colors.orange500,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing('lg'),
          marginTop: spacing('md'),
        },
        riskRetryButtonText: {
          fontSize: 13,
          fontFamily: theme.typography.fontFamily.bold,
          color: '#fff',
        },
        // Feelings Tracker Styles
        symptomsCard: {
          backgroundColor: theme.colors.surface,
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
        symptomsHeaderLoader: {
          marginLeft: 'auto',
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
        chartViewport: {
          width: '100%',
          overflow: 'hidden',
        },
        chartAxisText: {
          color: theme.colors.textSecondary,
          fontSize: 10,
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
        chartXAxisRow: {
          marginLeft: CHART_Y_AXIS_WIDTH,
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
      }),
    [size, theme],
  );

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />

      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {t('mother.title')}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressWrapper}>
            {/* Circular Progress Bar */}
            <Svg width={size} height={size} style={styles.progressSvg}>
              <Defs>
                <LinearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
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
                  <Text style={styles.badgeCardTitle} allowFontScaling={false}>
                    {t('mother.this_week')}
                  </Text>
                  {journeySummary.primaryTotal > 0 ? (
                    <View style={styles.badgeAmountContainer}>
                      <Text
                        style={styles.badgeAmountText}
                        allowFontScaling={false}
                      >
                        {journeySummary.primaryCompleted}/
                        {journeySummary.primaryTotal}
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
                    <Text
                      style={styles.badgeButtonText}
                      allowFontScaling={false}
                    >
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
                  {isLoadingHydration
                    ? '...'
                    : hydrationReadings
                    ? `${journeySummary.hydrationDays}/7`
                    : '—'}
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
              <Text style={styles.statsHeaderTitle} allowFontScaling={false}>
                {t('mother.stats_title')}
              </Text>
            </View>

            {/* Sub Header: Current week range */}
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
            </View>

            {journeySummary.dataMode === 'careContext' ? (
              <Text style={styles.statsContextNote} allowFontScaling={false}>
                {t('mother.stats_care_context_note')}
              </Text>
            ) : null}

            {/* Chart Container */}
            <View style={styles.statsChartContainer}>
              {/* Chart Header */}
              <View style={styles.statsChartHeader}>
                <View style={styles.statsChartIcon}>
                  <View style={styles.statsChartIconInner} />
                </View>
                <Text style={styles.statsChartTitle} allowFontScaling={false}>
                  {t('mother.completed_recommendations_chart')}
                </Text>
              </View>

              {chartModel.hasCareCompletionData ? (
                <>
                  <View
                    style={styles.chartViewport}
                    onLayout={event => updateChartViewportWidth('care', event)}
                  >
                    {chartViewportWidths.care > 0 ? (
                      <LineChart
                        data={chartModel.careCompletion.diet}
                        data2={chartModel.careCompletion.behaviour}
                        data3={chartModel.careCompletion.activity}
                        data4={chartModel.careCompletion.wellbeing}
                        width={getChartPlotWidth(chartViewportWidths.care)}
                        parentWidth={chartViewportWidths.care}
                        height={180}
                        maxValue={careChartScale.maxValue}
                        noOfSections={careChartScale.noOfSections}
                        hideDataPoints={false}
                        dataPointsRadius={CHART_POINT_RADIUS}
                        dataPointsColor1="#2E7D4A"
                        dataPointsColor2="#A83149"
                        dataPointsColor3="#946000"
                        dataPointsColor4="#70428F"
                        yAxisLabelWidth={CHART_Y_AXIS_WIDTH}
                        yAxisThickness={0}
                        xAxisThickness={0}
                        rulesColor={theme.colors.neutral200}
                        rulesThickness={1}
                        yAxisTextStyle={styles.chartAxisText}
                        color1="#2E7D4A"
                        color2="#A83149"
                        color3="#946000"
                        color4="#70428F"
                        initialSpacing={
                          getWeeklyChartSpacing(chartViewportWidths.care)
                            .initialSpacing
                        }
                        spacing={
                          getWeeklyChartSpacing(chartViewportWidths.care)
                            .spacing
                        }
                        endSpacing={0}
                        disableScroll
                        thickness={2}
                      />
                    ) : null}
                  </View>
                  <View style={[styles.symptomsXAxisRow, styles.chartXAxisRow]}>
                    {weekDates.map(date => (
                      <Text
                        key={date}
                        style={styles.symptomsXAxisLabel}
                        allowFontScaling={false}
                      >
                        {formatWeekday(date, locale)}
                      </Text>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.symptomsEmptyState}>
                  <Text style={styles.symptomsEmptyText}>
                    {t('mother.completed_recommendations_empty')}
                  </Text>
                </View>
              )}

              <View style={styles.statsLegend}>
                {STAT_TABS.map(tab => (
                  <View key={tab.id} style={styles.legendItem}>
                    <View
                      style={[
                        styles.statsLegendDot,
                        { backgroundColor: tab.color },
                      ]}
                    />
                    <Text
                      style={styles.statsLegendText}
                      allowFontScaling={false}
                    >
                      {t(tab.translationKey)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Feelings Tracker Card */}
          <View style={styles.symptomsCard}>
            {/* Header */}
            <View style={styles.symptomsHeader}>
              <FontAwesomeIcon
                icon={faCrosshairs as any}
                size={20}
                color={theme.colors.textPrimary}
                style={styles.symptomsHeaderIcon}
              />
              <Text style={styles.symptomsHeaderTitle} allowFontScaling={false}>
                {t('mother.feelings_tracker')}
              </Text>
              {isLoadingChart && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.orange500}
                  style={styles.symptomsHeaderLoader}
                />
              )}
            </View>

            <Text style={styles.symptomsDescription} allowFontScaling={false}>
              {formatWeekRange(symptomTrackerWeekDates, locale)}
            </Text>
            <Text style={styles.symptomsDescription}>{symptomTrendText}</Text>

            {/* Four feeling pattern groups, current week, day by day. */}
            {hasSymptomChartData ? (
              <View
                style={[styles.symptomsChartContainer, styles.chartViewport]}
                onLayout={event => updateChartViewportWidth('symptoms', event)}
              >
                {chartViewportWidths.symptoms > 0 ? (
                  <LineChart
                    data={symptomChartData.class4}
                    data2={symptomChartData.class2}
                    data3={symptomChartData.class3}
                    data4={symptomChartData.class1}
                    width={getChartPlotWidth(chartViewportWidths.symptoms)}
                    parentWidth={chartViewportWidths.symptoms}
                    height={180}
                    maxValue={symptomChartScale.maxValue}
                    noOfSections={symptomChartScale.noOfSections}
                    hideDataPoints={false}
                    dataPointsRadius={CHART_POINT_RADIUS}
                    dataPointsColor1="#1E88E5"
                    dataPointsColor2="#757575"
                    dataPointsColor3="#F9AA01"
                    dataPointsColor4="#E53935"
                    yAxisLabelWidth={CHART_Y_AXIS_WIDTH}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    rulesColor={theme.colors.neutral200}
                    rulesThickness={1}
                    yAxisTextStyle={styles.chartAxisText}
                    color1="#1E88E5"
                    color2="#757575"
                    color3="#F9AA01"
                    color4="#E53935"
                    initialSpacing={
                      getWeeklyChartSpacing(chartViewportWidths.symptoms)
                        .initialSpacing
                    }
                    spacing={
                      getWeeklyChartSpacing(chartViewportWidths.symptoms)
                        .spacing
                    }
                    endSpacing={0}
                    disableScroll
                    thickness={2}
                  />
                ) : null}
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
            <View style={[styles.symptomsXAxisRow, styles.chartXAxisRow]}>
              {symptomTrackerWeekDates.map(date => (
                <Text
                  key={date}
                  style={styles.symptomsXAxisLabel}
                  allowFontScaling={false}
                >
                  {formatWeekday(date, locale)}
                </Text>
              ))}
            </View>

            {/* Class Legend */}
            <View style={styles.symptomsLegend}>
              {SYMPTOM_CLASSES.map(cls => (
                <View key={cls.id} style={styles.symptomsLegendItem}>
                  <View
                    style={[
                      styles.symptomsLegendDot,
                      { backgroundColor: cls.color },
                    ]}
                  />
                  <Text
                    style={styles.symptomsLegendLabel}
                    allowFontScaling={false}
                  >
                    {symptomClassMetadata[cls.apiClass]?.className ??
                      t(cls.translationKey)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {(['mother', 'baby'] as EnvironmentalRiskAudience[]).map(audience => {
            const points = chartModel.environmentalRisk[audience];
            const hasData = chartModel.hasEnvironmentalRiskData[audience];
            const isMother = audience === 'mother';
            const cardState = resolveEnvironmentalRiskCardState({
              hasData,
              isLoading: isLoadingRisk,
              loadError: riskLoadError,
            });
            const hasLoadError = cardState === 'error';
            const descriptionKey = isMother
              ? 'mother.mother_environmental_risk_description'
              : 'mother.baby_environmental_risk_description';
            const emptyTitleKey = isMother
              ? 'mother.mother_environmental_risk_empty_title'
              : 'mother.baby_environmental_risk_empty_title';
            const emptyTextKey = isMother
              ? 'mother.mother_environmental_risk_empty'
              : 'mother.baby_environmental_risk_empty';
            const statusTitleKey =
              cardState === 'loading'
                ? 'mother.environmental_risk_loading_title'
                : cardState === 'error'
                ? isMother
                  ? 'mother.mother_environmental_risk_error_title'
                  : 'mother.baby_environmental_risk_error_title'
                : emptyTitleKey;
            const statusTextKey =
              cardState === 'loading'
                ? 'mother.environmental_risk_loading'
                : cardState === 'error' && riskLoadError
                ? ENVIRONMENTAL_RISK_FAILURE_REASON_KEYS[riskLoadError.kind]
                : emptyTextKey;

            return (
              <View key={audience} style={styles.riskCard}>
                <View style={styles.symptomsHeader}>
                  <View
                    style={[
                      styles.riskHeaderIcon,
                      isMother
                        ? styles.motherRiskHeaderIcon
                        : styles.childRiskHeaderIcon,
                    ]}
                  >
                    <FontAwesomeIcon
                      icon={(isMother ? faPersonPregnant : faBaby) as any}
                      size={16}
                      color={isMother ? '#B45309' : '#287A6A'}
                    />
                  </View>
                  <Text
                    style={[styles.symptomsHeaderTitle, styles.riskHeaderTitle]}
                    allowFontScaling={false}
                  >
                    {t(
                      isMother
                        ? 'mother.mother_environmental_risk'
                        : 'mother.baby_environmental_risk',
                    )}
                  </Text>
                </View>
                <Text style={styles.riskDescription} allowFontScaling={false}>
                  {t(descriptionKey)}
                </Text>

                {cardState === 'data' ? (
                  <View style={styles.riskFirstReading}>
                    <Text
                      style={styles.riskFirstReadingTitle}
                      allowFontScaling={false}
                    >
                      {t('mother.environmental_risk_latest_title')}
                    </Text>
                    <Text
                      style={styles.riskFirstReadingText}
                      allowFontScaling={false}
                    >
                      {t('mother.environmental_risk_latest')}
                    </Text>
                    <View style={styles.riskFirstReadingValues}>
                      <View style={styles.riskFirstReadingValue}>
                        <View style={styles.riskFirstReadingLabelRow}>
                          <View
                            style={[
                              styles.statsLegendDot,
                              styles.currentRiskDot,
                            ]}
                          />
                          <Text
                            style={styles.statsLegendText}
                            allowFontScaling={false}
                          >
                            {t('mother.current_risk_level')}
                          </Text>
                        </View>
                        <Text
                          style={styles.riskFirstReadingValueText}
                          allowFontScaling={false}
                        >
                          {formatRiskValue(points[0].current, locale)}
                        </Text>
                      </View>
                      <View style={styles.riskFirstReadingDivider} />
                      <View style={styles.riskFirstReadingValue}>
                        <View style={styles.riskFirstReadingLabelRow}>
                          <View
                            style={[styles.statsLegendDot, styles.riskDeltaDot]}
                          />
                          <Text
                            style={styles.statsLegendText}
                            allowFontScaling={false}
                          >
                            {t('mother.risk_level_change')}
                          </Text>
                        </View>
                        <Text
                          style={styles.riskFirstReadingValueText}
                          allowFontScaling={false}
                        >
                          {formatRiskDelta(points[0].delta, locale)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={styles.riskFirstReadingDate}
                      allowFontScaling={false}
                    >
                      {formatWeekday(points[0].date, locale)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.riskEmptyState}>
                    <View style={styles.riskEmptyIcon}>
                      {cardState === 'loading' ? (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.orange500}
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faChartLine as any}
                          size={22}
                          color={theme.colors.orange500}
                        />
                      )}
                    </View>
                    <Text
                      style={styles.riskEmptyTitle}
                      allowFontScaling={false}
                    >
                      {t(statusTitleKey)}
                    </Text>
                    <Text style={styles.riskEmptyText} allowFontScaling={false}>
                      {t(statusTextKey)}
                    </Text>
                    {hasLoadError ? (
                      <TouchableOpacity
                        style={styles.riskRetryButton}
                        onPress={() => refreshSummary()}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={styles.riskRetryButtonText}
                          allowFontScaling={false}
                        >
                          {t('mother.environmental_risk_retry')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.riskCard}>
            <View style={styles.symptomsHeader}>
              <View
                style={[styles.riskHeaderIcon, styles.motherRiskHeaderIcon]}
              >
                <FontAwesomeIcon
                  icon={faChartLine as any}
                  size={16}
                  color="#B45309"
                />
              </View>
              <Text
                style={[styles.symptomsHeaderTitle, styles.riskHeaderTitle]}
                allowFontScaling={false}
              >
                {t('mother.environmental_exposure_trend')}
              </Text>
            </View>
            <Text style={styles.riskDescription} allowFontScaling={false}>
              {t('mother.environmental_exposure_trend_description')}
            </Text>

            {exposureTrendByDate.size > 0 ? (
              <>
                <View
                  style={[styles.riskChartContainer, styles.chartViewport]}
                  onLayout={event => updateChartViewportWidth('risk', event)}
                >
                  {chartViewportWidths.risk > 0 ? (
                    <LineChart
                      data={exposureTrendSeries}
                      width={getChartPlotWidth(chartViewportWidths.risk)}
                      parentWidth={chartViewportWidths.risk}
                      height={160}
                      maxValue={exposureTrendMaxValue}
                      noOfSections={4}
                      roundToDigits={2}
                      hideDataPoints={false}
                      interpolateMissingValues={false}
                      extrapolateMissingValues={false}
                      dataPointsColor1="#9B3F00"
                      dataPointsRadius={CHART_POINT_RADIUS}
                      yAxisLabelWidth={CHART_Y_AXIS_WIDTH}
                      yAxisThickness={0}
                      xAxisThickness={0}
                      rulesColor={theme.colors.neutral200}
                      rulesThickness={1}
                      yAxisTextStyle={styles.chartAxisText}
                      color1="#9B3F00"
                      initialSpacing={
                        getWeeklyChartSpacing(chartViewportWidths.risk)
                          .initialSpacing
                      }
                      spacing={
                        getWeeklyChartSpacing(chartViewportWidths.risk).spacing
                      }
                      endSpacing={0}
                      disableScroll
                      thickness={2}
                    />
                  ) : null}
                </View>
                <View style={[styles.symptomsXAxisRow, styles.chartXAxisRow]}>
                  {weekDates.map(date => (
                    <Text
                      key={date}
                      style={styles.symptomsXAxisLabel}
                      allowFontScaling={false}
                    >
                      {formatWeekday(date, locale)}
                    </Text>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.riskEmptyState}>
                <View style={styles.riskEmptyIcon}>
                  {isLoadingRisk ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.orange500}
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faChartLine as any}
                      size={22}
                      color={theme.colors.orange500}
                    />
                  )}
                </View>
                <Text style={styles.riskEmptyTitle} allowFontScaling={false}>
                  {t('mother.environmental_exposure_empty_title')}
                </Text>
                <Text style={styles.riskEmptyText} allowFontScaling={false}>
                  {t('mother.environmental_exposure_empty')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
