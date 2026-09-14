import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faBed,
  faBrain,
  faCheck,
  faDroplet,
  faHeart,
  faLeaf,
  faPersonWalking,
  faPlus,
  faAward,
  faShareNodes,
  faXmark,
  faShieldHeart,
  faPersonPregnant,
  faBaby,
  faArrowTrendDown,
  faArrowTrendUp,
  faMinus,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { radius, spacing, useTheme } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import type {
  DailyActionDomain,
  RecommendationExperienceIdentity,
  WeeklySummaryExperience,
} from '../types/recommendationExperience';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { WEEKS_DATA } from './HomeScreen';
import { loadWeeklySummaryExperience } from '../services/recommendationExperience/PresentationJourneyRepository';
import {
  getNextWeekPreview,
  getRelevantFetalSystems,
} from '../services/recommendationExperience/DevelopmentProgressRepository';
import { SystemProgressIcon } from '../components/ui';
import { SVG_ICONS } from '../utils/svgIcons';
import {
  ensureWeeklyCheckpoint,
  getPersistentStreak,
  getWeeklyBadges,
  resolvePregnancyProgression,
} from '../services/recommendationExperience/ProgressionRepository';
import {
  buildWeeklyReport,
  shareWeeklyReport,
} from '../services/recommendationExperience/WeeklyReportRepository';
import { ProductAnalytics } from '../services/recommendationExperience/ProductAnalytics';
import { isWeeklyCheckpointAvailable } from '../services/recommendationExperience/LongitudinalJourneyRepository';
import {
  SummaryService,
  type SummaryResponse,
} from '../services/api/SummaryService';
import { DEV_LOCAL_SESSION } from '../config/dev';
import { buildWeeklyRiskSummaryViewModel } from '../services/recommendationExperience/WeeklyRiskSummaryPresenter';

interface WeeklySummaryScreenProps {
  onBack?: () => void;
  onReturnToPath?: () => void;
  pregnancyWeek?: number;
  endDate?: string;
  mode?: 'checkpoint' | 'review';
}

const DOMAIN_ORDER: Exclude<DailyActionDomain, 'service'>[] = [
  'diet',
  'activity',
  'behaviour',
  'wellbeing',
];

const DOMAIN_COLORS: Record<DailyActionDomain, string> = {
  diet: '#2E7D4A',
  activity: '#946000',
  behaviour: '#A83149',
  wellbeing: '#70428F',
  service: '#48607A',
};

const DomainIcon: React.FC<{
  domain: DailyActionDomain;
  color: string;
}> = ({ domain, color }) => (
  <FontAwesomeIcon
    icon={
      domain === 'diet'
        ? faLeaf
        : domain === 'activity'
        ? faPersonWalking
        : domain === 'wellbeing'
        ? faBrain
        : faHeart
    }
    size={13}
    color={color}
  />
);

const displayDate = (value: string, locale: string): string =>
  new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });

const displayWeekday = (value: string, locale: string): string =>
  new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'short',
  });

const displayRiskPercent = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value);

export const WeeklySummaryScreen: React.FC<
  WeeklySummaryScreenProps
> = ({
  onBack,
  onReturnToPath,
  pregnancyWeek: requestedWeek,
  endDate,
  mode,
}) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'fr'
    ? 'fr-FR'
    : i18n.resolvedLanguage === 'sw'
      ? 'sw-KE'
      : 'en-US';
  const insets = useSafeAreaInsets();
  const profile = useUserStore(state => state.profile);
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
  const presentationDays = useRecommendationExperienceStore(
    state => state.presentationDays,
  );
  const weeklyCheckpoints = useRecommendationExperienceStore(
    state => state.weeklyCheckpoints,
  );
  const shareHistory = useRecommendationExperienceStore(
    state => state.shareHistory,
  );
  const [summary, setSummary] =
    useState<WeeklySummaryExperience | null>(null);
  const [backendSummary, setBackendSummary] =
    useState<SummaryResponse | null>(null);
  const [sharePreviewVisible, setSharePreviewVisible] =
    useState(false);
  const openedKey = useRef<string | null>(null);

  const identity = useMemo<RecommendationExperienceIdentity>(
    () => ({
      backendUserId: profile.backendUserId,
      email: profile.email,
    }),
    [profile.backendUserId, profile.email],
  );
  const currentPregnancyWeek =
    getCurrentPregnancyWeek(
      profile.pregnancyWeek,
      profile.pregnancyWeekSetDate,
    ) ?? 19;
  const pregnancyWeek =
    requestedWeek ??
    currentPregnancyWeek;
  const reviewMode =
    mode === 'review' ||
    (requestedWeek !== undefined &&
      requestedWeek < currentPregnancyWeek);
  const summaryEndDate = endDate ?? formatLocalDate(new Date());
  const milestone = t(
    `home.week_desc_w${String(pregnancyWeek).padStart(2, '0')}`,
    { defaultValue: t('today.week_default_text') },
  );

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

  useEffect(() => {
    const nextSummary = loadWeeklySummaryExperience({
        identity,
        pregnancyWeek,
        endDate: summaryEndDate,
        milestone,
        fetalSystems: getRelevantFetalSystems(
          WEEKS_DATA,
          pregnancyWeek,
        ),
        nextWeek: getNextWeekPreview(
          WEEKS_DATA,
          pregnancyWeek,
        ),
        backendSummary,
        localData: {
          actionCompletions,
          checkIns,
          dailyMoments,
          restTimers,
        },
      });
    setSummary({
      ...nextSummary,
      streakDays: getPersistentStreak(
        identity,
        summaryEndDate,
        !reviewMode,
      ).days,
    });
  }, [
    actionCompletions,
    backendSummary,
    checkIns,
    presentationDays,
    restTimers,
    dailyMoments,
    identity,
    milestone,
    pregnancyWeek,
    reviewMode,
    summaryEndDate,
  ]);

  const badges = useMemo(
    () => (summary ? getWeeklyBadges(summary) : []),
    [summary],
  );
  const report = useMemo(
    () => (summary ? buildWeeklyReport(summary) : null),
    [summary],
  );
  const progression = useMemo(
    () => resolvePregnancyProgression(pregnancyWeek),
    [pregnancyWeek],
  );
  const checkpoint = report
    ? weeklyCheckpoints[report.weekKey]
    : null;
  const ceremonyVisible =
    Boolean(checkpoint) &&
    !checkpoint?.ceremonySeenAt &&
    !reviewMode;
  const sharedCount = report
    ? shareHistory.filter(
        item =>
          item.weekKey === report.weekKey && item.completedAt,
      ).length
    : 0;

  useEffect(() => {
    if (!summary || !report) return;
    ensureWeeklyCheckpoint(
      identity,
      summary,
      reviewMode ||
        isWeeklyCheckpointAvailable(summary.endDate),
    );
    const analyticsKey = `${report.weekKey}:${reviewMode}`;
    if (openedKey.current === analyticsKey) return;
    openedKey.current = analyticsKey;
    ProductAnalytics.track(identity, 'weekly_report_opened', {
      pregnancyWeek: summary.week,
      mode: reviewMode ? 'review' : 'checkpoint',
    });
    if (reviewMode) {
      ProductAnalytics.track(identity, 'review_mode_opened', {
        pregnancyWeek: summary.week,
      });
    }
  }, [identity, report, reviewMode, summary]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#FFFEFD',
        },
        header: {
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top,
          paddingHorizontal: spacing('sm'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral200,
          backgroundColor: '#FFFFFF',
        },
        back: {
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerCopy: {
          flex: 1,
        },
        title: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 18,
        },
        subtitle: {
          marginTop: 1,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
        },
        scrollContent: {
          padding: spacing('md'),
          paddingBottom: insets.bottom + spacing('xl'),
        },
        hero: {
          overflow: 'hidden',
          padding: spacing('lg'),
          borderRadius: radius('lg'),
        },
        heroGradient: {
          ...StyleSheet.absoluteFillObject,
        },
        heroEyebrow: {
          color: '#8A3B16',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          letterSpacing: 0.7,
          textTransform: 'uppercase',
        },
        heroTitle: {
          marginTop: spacing('xs'),
          color: '#4B210F',
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 25,
          lineHeight: 31,
        },
        heroStats: {
          flexDirection: 'row',
          marginTop: spacing('lg'),
          gap: spacing('sm'),
        },
        heroStat: {
          flex: 1,
          minHeight: 70,
          justifyContent: 'center',
          paddingHorizontal: spacing('sm'),
          borderRadius: radius('md'),
          backgroundColor: 'rgba(255,255,255,0.7)',
        },
        heroValue: {
          color: '#4B210F',
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 20,
        },
        heroLabel: {
          marginTop: 2,
          color: '#7B4A32',
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 9,
        },
        days: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: spacing('md'),
          paddingHorizontal: spacing('xs'),
        },
        day: {
          alignItems: 'center',
          gap: 6,
        },
        dayDot: {
          width: 29,
          height: 29,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.neutral100,
        },
        dayDotActive: {
          backgroundColor: theme.colors.orange500,
        },
        dayLabel: {
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 9,
        },
        sectionTitle: {
          marginTop: spacing('xl'),
          marginBottom: spacing('sm'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          letterSpacing: 0.7,
          textTransform: 'uppercase',
        },
        metricGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing('sm'),
        },
        metric: {
          flex: 1,
          flexBasis: '46%',
          minHeight: 105,
          padding: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#FFFFFF',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
        },
        metricIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing('sm'),
        },
        metricIconHydration: {
          backgroundColor: '#E8F4FC',
        },
        metricIconRest: {
          backgroundColor: '#F0E9F6',
        },
        metricIconExtra: {
          backgroundColor: '#FFF0E2',
        },
        metricIconSleep: {
          backgroundColor: '#EAF1FC',
        },
        metricValue: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 18,
        },
        metricLabel: {
          marginTop: 2,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
          lineHeight: 14,
        },
        domainCard: {
          overflow: 'hidden',
          borderRadius: radius('md'),
          backgroundColor: '#FFFFFF',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
        },
        domainRow: {
          minHeight: 54,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral100,
        },
        domainRowLast: {
          borderBottomWidth: 0,
        },
        domainIcon: {
          width: 29,
          height: 29,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
        },
        domainName: {
          width: 96,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 11,
        },
        domainTrack: {
          flex: 1,
          height: 6,
          overflow: 'hidden',
          borderRadius: 3,
          backgroundColor: theme.colors.neutral100,
        },
        domainFill: {
          height: 6,
          borderRadius: 3,
        },
        domainValue: {
          width: 30,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          textAlign: 'right',
        },
        insight: {
          flexDirection: 'row',
          padding: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#F8F3FB',
        },
        insightIcon: {
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: '#EADDF3',
        },
        insightCopy: {
          flex: 1,
        },
        insightTitle: {
          color: '#5C3474',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
        },
        insightText: {
          marginTop: 3,
          color: '#6E5978',
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        progressCard: {
          overflow: 'hidden',
          borderRadius: radius('lg'),
          backgroundColor: '#FFFFFF',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
        },
        progressRow: {
          flexDirection: 'row',
          padding: spacing('md'),
        },
        progressIcon: {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
        },
        progressIconMother: {
          backgroundColor: '#FFF0E2',
        },
        progressIconBaby: {
          backgroundColor: '#F0E9F6',
        },
        progressCopy: {
          flex: 1,
        },
        progressTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
        },
        progressText: {
          marginTop: 3,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        riskHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: spacing('md'),
        },
        riskHeaderCopy: {
          flex: 1,
        },
        riskTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 14,
          lineHeight: 20,
        },
        riskOverview: {
          marginTop: 3,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
          lineHeight: 18,
        },
        riskChangeList: {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral200,
        },
        riskChangeRow: {
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('md'),
        },
        riskAudienceIcon: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
        },
        riskAudienceIconMother: {
          backgroundColor: '#FFF1E6',
        },
        riskAudienceIconChild: {
          backgroundColor: '#EAF6F2',
        },
        riskAudienceLabel: {
          flex: 1,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
        },
        riskChangeValue: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
        },
        riskChangeValueText: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 12,
        },
        riskChangeLower: {
          color: '#2E7D4A',
        },
        riskChangeHigher: {
          color: '#A83149',
        },
        riskChangeStable: {
          color: theme.colors.textSecondary,
        },
        riskRowDivider: {
          height: StyleSheet.hairlineWidth,
          marginLeft: 58,
          backgroundColor: theme.colors.neutral100,
        },
        riskCareImpact: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: spacing('md'),
          marginTop: spacing('sm'),
          padding: spacing('sm'),
          borderRadius: radius('sm'),
          backgroundColor: '#EFF8F2',
        },
        riskCareImpactIcon: {
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          backgroundColor: '#DDEFE3',
        },
        riskCareImpactText: {
          flex: 1,
          color: '#285F3C',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 11,
          lineHeight: 17,
        },
        riskFactorRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginHorizontal: spacing('md'),
          marginTop: spacing('sm'),
        },
        riskFactorText: {
          flex: 1,
          marginLeft: spacing('xs'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        riskDisclaimer: {
          marginTop: spacing('sm'),
          paddingHorizontal: spacing('md'),
          paddingTop: spacing('sm'),
          paddingBottom: spacing('md'),
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.neutral100,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
          lineHeight: 15,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          marginLeft: 64,
          backgroundColor: theme.colors.neutral200,
        },
        milestone: {
          marginTop: spacing('sm'),
          padding: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#FFF8EE',
        },
        milestoneLabel: {
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        milestoneText: {
          marginTop: spacing('xs'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
          lineHeight: 18,
        },
        systemsCard: {
          paddingHorizontal: spacing('md'),
          borderRadius: radius('md'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.neutral200,
          backgroundColor: '#FFFFFF',
        },
        systemRow: {
          minHeight: 56,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.neutral100,
        },
        systemRowLast: {
          borderBottomWidth: 0,
        },
        systemIcon: {
          width: 32,
          height: 32,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing('sm'),
          borderRadius: 16,
          backgroundColor: theme.colors.orange50,
        },
        systemCopy: {
          flex: 1,
        },
        systemName: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 11,
        },
        systemValue: {
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 11,
        },
        nextWeekCard: {
          marginTop: spacing('sm'),
          padding: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#F8F3FB',
        },
        nextWeekLabel: {
          color: '#70428F',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        nextWeekText: {
          marginTop: spacing('xs'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
          lineHeight: 18,
        },
        modeBanner: {
          marginTop: spacing('sm'),
          padding: spacing('md'),
          borderRadius: radius('md'),
          backgroundColor: '#F8F3FB',
        },
        modeTitle: {
          color: '#70428F',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        modeText: {
          marginTop: 3,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 11,
          lineHeight: 17,
        },
        badgeCard: {
          marginTop: spacing('md'),
          padding: spacing('md'),
          borderRadius: radius('md'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#F0E2D6',
          backgroundColor: '#FFFFFF',
        },
        badgeHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing('sm'),
        },
        badgeTitle: {
          marginLeft: spacing('xs'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        badgeRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing('xs'),
        },
        badge: {
          minHeight: 32,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          borderRadius: 16,
          backgroundColor: '#FFF4EA',
          gap: 5,
        },
        badgeText: {
          color: theme.colors.orange800,
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 10,
        },
        shareCard: {
          marginTop: spacing('md'),
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing('md'),
          borderRadius: radius('md'),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#F0E2D6',
          backgroundColor: '#FFF8F2',
        },
        shareCopy: {
          flex: 1,
          paddingRight: spacing('sm'),
        },
        shareTitle: {
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        shareText: {
          marginTop: 3,
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 10,
          lineHeight: 15,
        },
        shareButton: {
          minHeight: 38,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing('sm'),
          borderRadius: 19,
          backgroundColor: theme.colors.orange500,
          gap: 6,
        },
        shareButtonText: {
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 11,
        },
        returnButton: {
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing('lg'),
          borderRadius: 24,
          backgroundColor: theme.colors.orange500,
        },
        returnButtonText: {
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
        modalOverlay: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing('lg'),
          backgroundColor: 'rgba(33, 24, 20, 0.52)',
        },
        modalCard: {
          width: '100%',
          maxWidth: 420,
          maxHeight: '84%',
          padding: spacing('lg'),
          borderRadius: radius('lg'),
          backgroundColor: '#FFFFFF',
        },
        modalClose: {
          width: 44,
          height: 44,
          alignSelf: 'flex-end',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -spacing('sm'),
          marginRight: -spacing('sm'),
        },
        modalEyebrow: {
          color: theme.colors.orange700,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
        modalTitle: {
          marginTop: spacing('xs'),
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.extraBold,
          fontSize: 23,
          lineHeight: 29,
        },
        modalBody: {
          marginTop: spacing('sm'),
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.fontFamily.regular,
          fontSize: 12,
          lineHeight: 19,
        },
        modalActions: {
          marginTop: spacing('lg'),
        },
        modalPrimary: {
          minHeight: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          backgroundColor: theme.colors.orange500,
        },
        modalPrimaryText: {
          color: '#FFFFFF',
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 13,
        },
      }),
    [insets.bottom, insets.top, theme],
  );

  if (!summary) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.back}>
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={19}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text style={styles.title}>
            {t('weekly_summary.title')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const actionSummaries = DOMAIN_ORDER.map(
    domain => summary.actionSummary[domain],
  );
  const hasActionSummary = actionSummaries.some(
    item => item.recommended > 0 || item.completed > 0,
  );
  const hasWeeklyHighlights =
    summary.hydrationDays > 0 ||
    summary.sleepNights > 0 ||
    summary.restSessions > 0 ||
    summary.extraCompleted > 0;
  const hasSymptomLevels =
    summary.symptomLevels.length > 0 && summary.symptomTrend.length > 0;
  const riskViewModel = summary.riskSummary
    ? buildWeeklyRiskSummaryViewModel(summary.riskSummary)
    : null;
  const hasRiskSummary = riskViewModel !== null;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack}
          style={styles.back}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
            size={19}
            color={theme.colors.textPrimary}
          />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={styles.title}>
            {t('weekly_summary.title')}
          </Text>
          <Text style={styles.subtitle}>
            {t('weekly_summary.date_range', {
              start: displayDate(summary.startDate, locale),
              end: displayDate(summary.endDate, locale),
              week: summary.week,
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LinearGradient
            colors={['#FFE8C9', '#FFF5E8', '#F7EAF8']}
            locations={[0, 0.58, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />
          <Text style={styles.heroEyebrow}>
            {reviewMode
              ? t('weekly_summary.review_mode')
              : checkpoint
              ? t('weekly_summary.ready')
              : t('weekly_summary.in_progress')}
          </Text>
          <Text style={styles.heroTitle}>
            {t('weekly_summary.rhythm_title')}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>
                {summary.activeDays}/7
              </Text>
              <Text style={styles.heroLabel}>
                {t('weekly_summary.active_days')}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>
                {summary.adherencePercent}%
              </Text>
              <Text style={styles.heroLabel}>
                {t('weekly_summary.primary_adherence')}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>
                {summary.streakDays}
              </Text>
              <Text style={styles.heroLabel}>
                {t('weekly_summary.day_streak')}
              </Text>
            </View>
          </View>
        </View>

        {reviewMode ? (
          <View style={styles.modeBanner}>
            <Text style={styles.modeTitle}>
              {t('weekly_summary.review_mode')}
            </Text>
            <Text style={styles.modeText}>
              {t('weekly_summary.review_mode_body')}
            </Text>
          </View>
        ) : null}

        <View style={styles.badgeCard}>
          <View style={styles.badgeHeader}>
            <FontAwesomeIcon
              icon={faAward}
              size={15}
              color={theme.colors.orange600}
            />
            <Text style={styles.badgeTitle}>
              {t('weekly_summary.achievements')}
            </Text>
          </View>
          <View style={styles.badgeRow}>
            {badges.some(badge => badge.earned) ? (
              badges
                .filter(badge => badge.earned)
                .map(badge => (
                  <View key={badge.domain} style={styles.badge}>
                    <DomainIcon
                      domain={badge.domain}
                      color={DOMAIN_COLORS[badge.domain]}
                    />
                    <Text style={styles.badgeText}>
                      {t('weekly_summary.domain_badge', {
                        domain: t(
                          `today.domain_${badge.domain}`,
                        ),
                      })}
                    </Text>
                  </View>
                ))
            ) : (
              <Text style={styles.modeText}>
                {t('weekly_summary.achievement_start')}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.shareCard}>
          <View style={styles.shareCopy}>
            <Text style={styles.shareTitle}>
              {t('weekly_summary.share_title')}
            </Text>
            <Text style={styles.shareText}>
              {sharedCount > 0
                ? t('weekly_summary.shared_count', {
                    count: sharedCount,
                  })
                : t('weekly_summary.share_description')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSharePreviewVisible(true);
              ProductAnalytics.track(
                identity,
                'share_preview_opened',
                { pregnancyWeek: summary.week },
              );
            }}
            style={styles.shareButton}
          >
            <FontAwesomeIcon
              icon={faShareNodes}
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.shareButtonText}>
              {t('weekly_summary.preview')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.days}>
          {summary.days.map(day => (
            <View key={day.date} style={styles.day}>
              <View
                style={[
                  styles.dayDot,
                  day.active && styles.dayDotActive,
                ]}
              >
                {day.active ? (
                  <FontAwesomeIcon
                    icon={faCheck}
                    size={11}
                    color="#FFFFFF"
                  />
                ) : null}
              </View>
              <Text style={styles.dayLabel}>
                {displayWeekday(day.date, locale)}
              </Text>
            </View>
          ))}
        </View>

        {hasWeeklyHighlights ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('weekly_summary.weekly_highlights')}
            </Text>
            <View style={styles.metricGrid}>
              <View style={styles.metric}>
                <View
                  style={[
                    styles.metricIcon,
                    styles.metricIconHydration,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faDroplet}
                    size={13}
                    color="#307AA8"
                  />
                </View>
                <Text style={styles.metricValue}>
                  {summary.hydrationDays}/7
                </Text>
                <Text style={styles.metricLabel}>
                  {t('weekly_summary.hydration_days')}
                </Text>
              </View>
              <View style={styles.metric}>
                <View
                  style={[
                    styles.metricIcon,
                    styles.metricIconSleep,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faBed}
                    size={13}
                    color="#4C6F9F"
                  />
                </View>
                <Text style={styles.metricValue}>
                  {summary.sleepNights}/7
                </Text>
                <Text style={styles.metricLabel}>
                  {t('weekly_summary.sleep_nights')}
                </Text>
              </View>
              <View style={styles.metric}>
                <View
                  style={[
                    styles.metricIcon,
                    styles.metricIconRest,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faShieldHeart}
                    size={13}
                    color="#70428F"
                  />
                </View>
                <Text style={styles.metricValue}>
                  {summary.restSessions}
                </Text>
                <Text style={styles.metricLabel}>
                  {t('weekly_summary.rest_sessions')}
                </Text>
              </View>
              <View style={styles.metric}>
                <View
                  style={[
                    styles.metricIcon,
                    styles.metricIconExtra,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    size={13}
                    color={theme.colors.orange600}
                  />
                </View>
                <Text style={styles.metricValue}>
                  {summary.extraCompleted}
                </Text>
                <Text style={styles.metricLabel}>
                  {t('weekly_summary.extra_actions')}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {hasActionSummary ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('weekly_summary.care_areas')}
            </Text>
            <View style={styles.domainCard}>
              {actionSummaries.map((item, index) => {
                const color = DOMAIN_COLORS[item.domain];
                const width =
                  item.recommended > 0
                    ? (item.completed / item.recommended) * 100
                    : 0;
                return (
                  <View
                    key={item.domain}
                    style={[
                      styles.domainRow,
                      index === actionSummaries.length - 1 &&
                        styles.domainRowLast,
                    ]}
                  >
                    <View
                      style={[
                        styles.domainIcon,
                        { backgroundColor: `${color}16` },
                      ]}
                    >
                      <DomainIcon domain={item.domain} color={color} />
                    </View>
                    <Text style={styles.domainName}>
                      {t(`today.domain_${item.domain}`)}
                    </Text>
                    <View style={styles.domainTrack}>
                      <View
                        style={[
                          styles.domainFill,
                          {
                            width: `${Math.min(100, width)}%`,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.domainValue}>
                      {item.completed}/{item.recommended}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {hasSymptomLevels ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('weekly_summary.feeling_trend')}
            </Text>
            <View style={styles.insight}>
              <View style={styles.insightIcon}>
                <FontAwesomeIcon
                  icon={faBrain}
                  size={15}
                  color="#70428F"
                />
              </View>
              <View style={styles.insightCopy}>
                <Text style={styles.insightTitle}>
                  {t('weekly_summary.level_statistics')}
                </Text>
                <Text style={styles.insightText}>
                  {summary.symptomTrend}
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {hasRiskSummary ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('weekly_summary.environmental_health')}
            </Text>
            <View style={styles.progressCard}>
              <View style={styles.riskHeader}>
                <View
                  style={[
                    styles.progressIcon,
                    styles.progressIconMother,
                  ]}
                >
                  <FontAwesomeIcon
                    icon={faShieldHeart}
                    size={15}
                    color={theme.colors.orange600}
                  />
                </View>
                <View style={styles.riskHeaderCopy}>
                  <Text style={styles.riskTitle}>
                    {t('weekly_summary.risk_change_title')}
                  </Text>
                  <Text style={styles.riskOverview}>
                    {t(
                      `weekly_summary.risk_overview_${riskViewModel?.overview}`,
                    )}
                  </Text>
                </View>
              </View>

              {riskViewModel && riskViewModel.changes.length > 0 ? (
                <View style={styles.riskChangeList}>
                  {riskViewModel.changes.map((change, index) => {
                    const directionStyle =
                      change.direction === 'lower'
                        ? styles.riskChangeLower
                        : change.direction === 'higher'
                        ? styles.riskChangeHigher
                        : styles.riskChangeStable;
                    const directionColor =
                      change.direction === 'lower'
                        ? '#2E7D4A'
                        : change.direction === 'higher'
                        ? '#A83149'
                        : theme.colors.textSecondary;

                    return (
                      <React.Fragment key={change.audience}>
                        {index > 0 ? <View style={styles.riskRowDivider} /> : null}
                        <View style={styles.riskChangeRow}>
                          <View
                            style={[
                              styles.riskAudienceIcon,
                              change.audience === 'mother'
                                ? styles.riskAudienceIconMother
                                : styles.riskAudienceIconChild,
                            ]}
                          >
                            <FontAwesomeIcon
                              icon={
                                change.audience === 'mother'
                                  ? faPersonPregnant
                                  : faBaby
                              }
                              size={14}
                              color={
                                change.audience === 'mother'
                                  ? '#B45309'
                                  : '#287A6A'
                              }
                            />
                          </View>
                          <Text style={styles.riskAudienceLabel}>
                            {t(
                              change.audience === 'mother'
                                ? 'weekly_summary.risk_mother'
                                : 'weekly_summary.risk_child',
                            )}
                          </Text>
                          <View style={styles.riskChangeValue}>
                            <FontAwesomeIcon
                              icon={
                                change.direction === 'lower'
                                  ? faArrowTrendDown
                                  : change.direction === 'higher'
                                  ? faArrowTrendUp
                                  : faMinus
                              }
                              size={13}
                              color={directionColor}
                            />
                            <Text
                              style={[
                                styles.riskChangeValueText,
                                directionStyle,
                              ]}
                            >
                              {t(
                                `weekly_summary.risk_change_${change.direction}`,
                                {
                                  value: displayRiskPercent(
                                    change.value,
                                    locale,
                                  ),
                                },
                              )}
                            </Text>
                          </View>
                        </View>
                      </React.Fragment>
                    );
                  })}
                </View>
              ) : null}

              {riskViewModel?.completedCareReduction !== null &&
              riskViewModel?.completedCareReduction !== undefined ? (
                <View style={styles.riskCareImpact}>
                  <View style={styles.riskCareImpactIcon}>
                    <FontAwesomeIcon
                      icon={faCheck}
                      size={12}
                      color="#2E7D4A"
                    />
                  </View>
                  <Text style={styles.riskCareImpactText}>
                    {t('weekly_summary.risk_care_reduction', {
                      value: displayRiskPercent(
                        riskViewModel.completedCareReduction,
                        locale,
                      ),
                    })}
                  </Text>
                </View>
              ) : riskViewModel?.hasCompletedCareImpact ? (
                <View style={styles.riskCareImpact}>
                  <View style={styles.riskCareImpactIcon}>
                    <FontAwesomeIcon
                      icon={faCheck}
                      size={12}
                      color="#2E7D4A"
                    />
                  </View>
                  <Text style={styles.riskCareImpactText}>
                    {t('weekly_summary.risk_care_included')}
                  </Text>
                </View>
              ) : null}

              {riskViewModel &&
              riskViewModel.changes.length === 0 &&
              riskViewModel.trackedFactorCount > 0 ? (
                <View style={styles.riskFactorRow}>
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    size={12}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.riskFactorText}>
                    {t('weekly_summary.risk_factors_included', {
                      count: riskViewModel.trackedFactorCount,
                    })}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.riskDisclaimer}>
                {t('weekly_summary.risk_disclaimer')}
              </Text>
            </View>
          </>
        ) : null}
        <View style={styles.milestone}>
          <Text style={styles.milestoneLabel}>
            {t('weekly_summary.week_milestone', {
              week: summary.week,
            })}
          </Text>
          <Text style={styles.milestoneText}>
            {summary.milestone}
          </Text>
        </View>

        {summary.fetalSystems.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {t('weekly_summary.growing_systems')}
            </Text>
            <View style={styles.systemsCard}>
              {summary.fetalSystems.map((system, index) => {
                const rawKey = system.iconPath.replace(
                  '.svg',
                  '',
                );
                const label = t(
                  `baby.system_${rawKey}` as any,
                  { defaultValue: rawKey },
                );
                const svg =
                  SVG_ICONS[system.iconPath] ??
                  SVG_ICONS['heartSystem.svg'];
                return (
                  <View
                    key={system.iconPath}
                    style={[
                      styles.systemRow,
                      index ===
                        summary.fetalSystems.length - 1 &&
                        styles.systemRowLast,
                    ]}
                  >
                    <View style={styles.systemIcon}>
                      <SystemProgressIcon
                        svgXml={svg}
                        width={21}
                        height={21}
                        percentage={system.percentage}
                        uniqueId={`weekly-${summary.week}-${rawKey}`}
                      />
                    </View>
                    <View style={styles.systemCopy}>
                      <Text style={styles.systemName}>
                        {label}
                      </Text>
                    </View>
                    <Text style={styles.systemValue}>
                      {system.percentage}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        {summary.nextWeek ? (
          <View style={styles.nextWeekCard}>
            <Text style={styles.nextWeekLabel}>
              {t('weekly_summary.next_week', {
                week: summary.nextWeek.week,
              })}
            </Text>
            <Text style={styles.nextWeekText}>
              {summary.nextWeek.preview}
            </Text>
          </View>
        ) : null}
        {onReturnToPath ? (
          <Pressable
            accessibilityRole="button"
            onPress={onReturnToPath}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>
              {t('weekly_summary.return_to_path')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal
        transparent
        visible={ceremonyVisible}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View
          accessibilityViewIsModal
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>
              {progression.chapterLabel}
            </Text>
            <Text
              accessibilityRole="header"
              style={styles.modalTitle}
            >
              {t('weekly_summary.ceremony_title', {
                week: summary.week,
              })}
            </Text>
            <Text style={styles.modalBody}>
              {t('weekly_summary.ceremony_body')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!report) return;
                  useRecommendationExperienceStore
                    .getState()
                    .markWeeklyCeremonySeen(report.weekKey);
                  AccessibilityInfo.announceForAccessibility(
                    t('weekly_summary.ceremony_complete'),
                  );
                }}
                style={styles.modalPrimary}
              >
                <Text style={styles.modalPrimaryText}>
                  {t('weekly_summary.open_report')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={sharePreviewVisible}
        animationType="fade"
        onRequestClose={() => setSharePreviewVisible(false)}
      >
        <View
          accessibilityViewIsModal
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={() => setSharePreviewVisible(false)}
              style={styles.modalClose}
            >
              <FontAwesomeIcon
                icon={faXmark}
                size={18}
                color={theme.colors.textPrimary}
              />
            </Pressable>
            <Text style={styles.modalEyebrow}>
              {t('weekly_summary.private_preview')}
            </Text>
            <Text style={styles.modalTitle}>
              {t('weekly_summary.report_for_week', {
                week: summary.week,
              })}
            </Text>
            <ScrollView>
              <Text style={styles.modalBody}>
                {report?.shareText}
              </Text>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!report) return;
                  shareWeeklyReport(identity, report).catch(
                    () => {},
                  );
                }}
                style={styles.modalPrimary}
              >
                <Text style={styles.modalPrimaryText}>
                  {t('weekly_summary.share')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
