import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  findNodeHandle,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faBaby,
  faBed,
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faHeart,
  faRotateRight,
  faShieldHeart,
  faTimes,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme, radius, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import {
  BottomSheet,
  AccessLocationBottomSheet,
  ExposureAccordion,
  SystemProgressIcon,
  useToast,
  WaveCard,
} from '../components/ui';
import { DailyPlanView } from '../components/recommendations/DailyPlanView';
import { ExploreMoreView } from '../components/recommendations/ExploreMoreView';
import { ImprovePlanView } from '../components/recommendations/ImprovePlanView';
import { PlanInputEmptyState } from '../components/recommendations/PlanInputEmptyState';
import {
  TodayQuickCheckInSheet,
  type TodayQuickCheckInKind,
} from '../components/today/TodayQuickCheckInSheet';
import { InlineAd } from '../components/ads/InlineAd';
import { shouldShowPostPlanAd } from '../data/ads';
import {
  SummaryService,
  type SummaryResponse,
} from '../services/api/SummaryService';
import { LifestyleService } from '../services/api/LifestyleService';
import { DailyCheckinService } from '../services/api/DailyCheckinService';
import {
  ExposureService,
  type AirExposure,
} from '../services/api/ExposureService';
import { getCurrentPregnancyWeek } from '../utils/pregnancyUtils';
import { formatLocalDate } from '../utils/dateUtils';
import { SVG_ICONS } from '../utils/svgIcons';
import { WEEKS_DATA } from './HomeScreen';
import {
  completedRiskImpactValue,
  loadDailyPlanExperience,
  riskImpactCompletionPercent,
  updateDailyPlanActionState,
} from '../services/recommendationExperience/DailyPlanRepository';
import { loadFeelingCheckInExperience } from '../services/recommendationExperience/FeelingCheckInRepository';
import {
  completeTodayPresentation,
  loadWeeklySummaryExperience,
} from '../services/recommendationExperience/PresentationJourneyRepository';
import { useRecommendationExperienceStore } from '../store/useRecommendationExperienceStore';
import type {
  DailyActionState,
  DailyMomentRecord,
  DailyPlanAction,
  DailyPlanExperience,
  FeelingCheckInExperience,
  FeelingCheckInItem,
  ExposureTrendPoint,
  RecommendationExperienceIdentity,
} from '../types/recommendationExperience';
import { EveningWindDown } from '../components/today/EveningWindDown';
import { DEV_LOCAL_SESSION } from '../config/dev';
import { ExposureTrendView } from '../components/today/ExposureTrendView';
import { loadExposureTrend } from '../services/recommendationExperience/ExposureTrendRepository';
import { ProductAnalytics } from '../services/recommendationExperience/ProductAnalytics';
import { getPersistentStreak } from '../services/recommendationExperience/ProgressionRepository';
import { subscribeToMommySymptomSync } from '../services/recommendationExperience/MommySymptomSyncService';
import { type LocationPermissionStatus } from '../services/tracking/LocationTracker';
import { locationAccessCoordinator } from '../services/tracking/LocationAccessCoordinator';
import { resolvePlanInputReadiness } from '../utils/planReadiness';
import { isApiConnectionError } from '../utils/apiErrors';

const getTodayDate = (): string => formatLocalDate(new Date());
const EMPTY_DAILY_MOMENTS: Record<string, DailyMomentRecord> = {};

const DASHBOARD_CAROUSEL_GAP = 12;
const DASHBOARD_CAROUSEL_PEEK = 24;

const isReleaseVisibleDailyPlanAction = (action: DailyPlanAction): boolean =>
  action.domain !== 'service';

type DashboardDetailSheet = 'snapshot' | 'risks' | null;
type DashboardStatus = 'stable' | 'attention' | 'context' | 'unavailable';

interface TodayScreenProps {
  onCompletePlanProfile?: () => void;
  onCompletePlanCheckIn?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToBabyStatus?: () => void;
  onNavigateToSymptomsHistory?: () => void;
  onNavigateToWeeklySummary?: () => void;
  onBackPress?: () => void;
  initialActionKey?: string;
  initialFocus?: 'plan' | 'progress';
}

const selectedItemSummary = (
  keys: string[],
  items: FeelingCheckInItem[],
  emptyLabel: string,
): string => {
  if (keys.length === 0) return emptyLabel;
  const first = items.find(item => keys.includes(item.key));
  if (!first) return emptyLabel;
  return keys.length > 1 ? `${first.name} +${keys.length - 1}` : first.name;
};

const statusColor = (status: DashboardStatus): string =>
  status === 'attention'
    ? '#B93838'
    : status === 'stable'
    ? '#2D7B46'
    : status === 'context'
    ? '#C95600'
    : '#6B6B6B';

export const TodayScreen: React.FC<TodayScreenProps> = React.memo(
  ({
    onCompletePlanProfile,
    onCompletePlanCheckIn,
    onNavigateToProfile,
    onNavigateToBabyStatus,
    onNavigateToSymptomsHistory,
    onNavigateToWeeklySummary,
    onBackPress,
    initialActionKey,
    initialFocus,
  }) => {
    const theme = useTheme();
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const locale =
      i18n.resolvedLanguage === 'fr'
        ? 'fr-FR'
        : i18n.resolvedLanguage === 'sw'
        ? 'sw-KE'
        : 'en-US';
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const { profile } = useUserStore();
    const [summary, setSummary] = useState<SummaryResponse | null>(null);
    const [lifestyle, setLifestyle] = useState<any | null>(null);
    const [dailyPlan, setDailyPlan] = useState<DailyPlanExperience | null>(
      null,
    );
    const [dailyPlanLoadStatus, setDailyPlanLoadStatus] = useState<
      'loading' | 'available' | 'unavailable' | 'needsInput'
    >('loading');
    const [medicalSafetyAlerts, setMedicalSafetyAlerts] = useState<
      DailyPlanExperience['medicalAttention']
    >([]);
    const [importantGuidanceItems, setImportantGuidanceItems] = useState<
      DailyPlanExperience['importantGuidanceRecommendations']
    >([]);
    const [improvePlanPrompts, setImprovePlanPrompts] = useState<
      DailyPlanExperience['optionalSupportRecommendations']
    >([]);
    const [checkIn, setCheckIn] = useState<FeelingCheckInExperience | null>(
      null,
    );
    const [airExposure, setAirExposure] = useState<AirExposure | null>(null);
    const [locationPermissionStatus, setLocationPermissionStatus] =
      useState<LocationPermissionStatus | null>(() =>
        locationAccessCoordinator.isTracking() ? 'granted' : null,
      );
    const [showLocationSheet, setShowLocationSheet] = useState(false);
    const [isDashboardLoading, setIsDashboardLoading] = useState(true);
    const [showConnectionSheet, setShowConnectionSheet] = useState(false);
    const [
      isPresentationMotherBabyContext,
      setIsPresentationMotherBabyContext,
    ] = useState(false);
    const [exposureTrend, setExposureTrend] = useState<ExposureTrendPoint[]>(
      [],
    );
    const [quickCheckInKind, setQuickCheckInKind] =
      useState<TodayQuickCheckInKind | null>(null);
    const [detailSheet, setDetailSheet] = useState<DashboardDetailSheet>(null);
    const [showDailyWin, setShowDailyWin] = useState(false);
    const [streakDays, setStreakDays] = useState(0);
    const [dashboardPage, setDashboardPage] = useState(0);
    const [dashboardCardHeight, setDashboardCardHeight] = useState(0);
    const hasFocusedOnce = useRef(false);
    const waveAnimationProgress = useRef(new Animated.Value(0)).current;
    const lastSheetTrigger = useRef<React.ElementRef<typeof Pressable> | null>(
      null,
    );
    const dashboardCarouselRef = useRef<ScrollView | null>(null);
    const pageScrollRef = useRef<ScrollView | null>(null);
    const planSectionY = useRef(0);
    const appliedFocusKey = useRef<string | null>(null);

    const dashboardViewportWidth = Math.max(
      280,
      Math.min(windowWidth, 680) - spacing('md') * 2,
    );
    const dashboardCardWidth = dashboardViewportWidth - DASHBOARD_CAROUSEL_PEEK;
    const dashboardSecondOffset =
      dashboardCardWidth + DASHBOARD_CAROUSEL_GAP - DASHBOARD_CAROUSEL_PEEK;
    const dashboardCardInnerWidth = dashboardCardWidth - spacing('md') * 2;
    const dashboardCardStyle = useMemo(
      () => ({ width: dashboardCardWidth }),
      [dashboardCardWidth],
    );
    const weekCardHeightStyle = useMemo(
      () =>
        dashboardCardHeight > 0
          ? { minHeight: dashboardCardHeight }
          : undefined,
      [dashboardCardHeight],
    );

    const date = useMemo(() => getTodayDate(), []);
    const storedCheckIn = useRecommendationExperienceStore(
      state => state.checkIns[date] ?? null,
    );
    const pendingMommySymptoms = useRecommendationExperienceStore(
      state => state.pendingMommySymptomSelections[date] ?? null,
    );
    const planInputReadiness = useMemo(
      () =>
        resolvePlanInputReadiness(profile, storedCheckIn, pendingMommySymptoms),
      [pendingMommySymptoms, profile, storedCheckIn],
    );
    const hasLocationPermission = locationPermissionStatus === 'granted';
    const isLocationPermissionRequired =
      locationPermissionStatus !== null && !hasLocationPermission;
    const dailyMoments = useRecommendationExperienceStore(
      state => state.dailyMoments[date] ?? EMPTY_DAILY_MOMENTS,
    );
    const identity = useMemo<RecommendationExperienceIdentity>(
      () => ({
        backendUserId: profile.backendUserId,
        email: profile.email,
      }),
      [profile.backendUserId, profile.email],
    );
    const currentWeek =
      getCurrentPregnancyWeek(
        profile.pregnancyWeek,
        profile.pregnancyWeekSetDate,
      ) ||
      summary?.week_info?.week ||
      19;

    const currentDateLabel = useMemo(
      () =>
        new Date().toLocaleDateString(locale, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      [locale],
    );

    const refreshToday = useCallback(async () => {
      setIsDashboardLoading(true);
      if (planInputReadiness.ready) {
        setDailyPlanLoadStatus(current =>
          current === 'available' ? current : 'loading',
        );
      } else {
        setDailyPlan(null);
        setDailyPlanLoadStatus('needsInput');
        setMedicalSafetyAlerts([]);
        setImportantGuidanceItems([]);
        setImprovePlanPrompts([]);
      }

      const [planLoad, summaryLoad, checkInLoad, lifestyleLoad, exposureLoad] =
        await Promise.allSettled([
          planInputReadiness.ready
            ? loadDailyPlanExperience(identity, date, {
                inputReadiness: planInputReadiness,
                translate: (key, fallback) =>
                  t(key, { defaultValue: fallback }),
              })
            : Promise.resolve(null),
          planInputReadiness.ready || DEV_LOCAL_SESSION
            ? Promise.resolve(null)
            : SummaryService.getSummary(),
          loadFeelingCheckInExperience(identity, date),
          DEV_LOCAL_SESSION
            ? Promise.resolve(null)
            : LifestyleService.getLifestyle(),
          !hasLocationPermission || DEV_LOCAL_SESSION
            ? Promise.resolve(null)
            : ExposureService.getAirExposure(),
        ]);

      const planResult =
        planLoad.status === 'fulfilled' ? planLoad.value : null;
      const directSummary =
        summaryLoad.status === 'fulfilled' ? summaryLoad.value : null;
      const checkInExperience =
        checkInLoad.status === 'fulfilled' ? checkInLoad.value : null;
      const lifestyleData =
        lifestyleLoad.status === 'fulfilled' ? lifestyleLoad.value : null;
      const airExposureData =
        exposureLoad.status === 'fulfilled' ? exposureLoad.value : null;
      const hasConnectionError =
        Boolean(planResult?.connectionError) ||
        [planLoad, summaryLoad, lifestyleLoad, exposureLoad].some(
          result =>
            result.status === 'rejected' &&
            isApiConnectionError(result.reason),
        );

      setShowConnectionSheet(hasConnectionError);

      const pregnancyWeek =
        getCurrentPregnancyWeek(
          profile.pregnancyWeek,
          profile.pregnancyWeekSetDate,
        ) ??
        planResult?.summary?.week_info?.week ??
        directSummary?.week_info?.week ??
        19;
      const completedPresentation = checkInExperience
        ? completeTodayPresentation({
            identity,
            date,
            pregnancyWeek,
            summary: planResult?.summary ?? directSummary,
            airExposure: airExposureData,
            lifestyle: lifestyleData,
            checkIn: checkInExperience,
          })
        : null;

      setSummary(completedPresentation?.summary ?? directSummary);
      if (planResult) {
        setDailyPlan(
          planResult.status === 'available' ? planResult.experience : null,
        );
        setDailyPlanLoadStatus(planResult.status);
        setMedicalSafetyAlerts(planResult.experience.medicalAttention);
        setImportantGuidanceItems(
          planResult.experience.importantGuidanceRecommendations,
        );
        setImprovePlanPrompts([
          ...planResult.experience.importantGuidanceRecommendations.slice(1),
          ...planResult.experience.guidanceRecommendations,
          ...planResult.experience.optionalSupportRecommendations,
        ]);
      }
      setCheckIn(completedPresentation?.checkIn ?? checkInExperience);
      setLifestyle(completedPresentation?.lifestyle ?? lifestyleData);
      setAirExposure(
        hasLocationPermission
          ? completedPresentation?.airExposure ?? airExposureData
          : null,
      );
      setIsPresentationMotherBabyContext(
        completedPresentation?.sourceFlags.motherBabyContext ?? false,
      );
      if (hasLocationPermission) {
        loadExposureTrend({
          summary: completedPresentation?.summary ?? directSummary,
          endDate: date,
          pregnancyWeek,
        })
          .then(result => setExposureTrend(result.points))
          .catch(() => setExposureTrend([]));
      } else {
        setExposureTrend([]);
      }
      const milestone =
        completedPresentation?.summary.week_info?.text ??
        directSummary?.week_info?.text ??
        t(`home.week_desc_w${String(pregnancyWeek).padStart(2, '0')}`);
      setStreakDays(
        loadWeeklySummaryExperience({
          identity,
          pregnancyWeek,
          endDate: date,
          milestone,
          backendSummary: completedPresentation?.summary ?? directSummary,
        }).streakDays,
      );
      setIsDashboardLoading(false);
    }, [
      date,
      identity,
      hasLocationPermission,
      t,
      profile.pregnancyWeek,
      profile.pregnancyWeekSetDate,
      planInputReadiness,
    ]);

    useFocusEffect(
      useCallback(() => {
        let mounted = true;
        const statusRequest = locationAccessCoordinator.isTracking()
          ? Promise.resolve<LocationPermissionStatus>('granted')
          : locationAccessCoordinator.getTrackingStatus();

        statusRequest
          .then(status => {
            if (mounted) {
              setLocationPermissionStatus(status);
            }
          })
          .catch(() => {
            if (mounted) {
              setLocationPermissionStatus('unavailable');
            }
          });

        return () => {
          mounted = false;
        };
      }, []),
    );

    const handleLocationAllow = useCallback(async () => {
      setShowLocationSheet(false);
      const status = await locationAccessCoordinator
        .enable()
        .catch(() => 'unavailable' as const);
      setLocationPermissionStatus(status);
      if (status === 'blocked') {
        Linking.openSettings().catch(() => {});
      }
    }, []);

    const handleLocationDecline = useCallback(() => {
      setShowLocationSheet(false);
      locationAccessCoordinator.decline();
      setLocationPermissionStatus('denied');
    }, []);

    useEffect(() => {
      refreshToday().catch(() => {
        setDailyPlan(null);
        setDailyPlanLoadStatus('unavailable');
        setIsDashboardLoading(false);
        setShowConnectionSheet(true);
      });
      if (planInputReadiness.ready) {
        DailyCheckinService.ensureCheckin(date);
      }
    }, [date, planInputReadiness.ready, refreshToday]);

    useEffect(
      () =>
        subscribeToMommySymptomSync(() => {
          refreshToday().catch(() => {
            setIsDashboardLoading(false);
          });
        }),
      [refreshToday],
    );

    useFocusEffect(
      useCallback(() => {
        if (!hasFocusedOnce.current) {
          hasFocusedOnce.current = true;
          return undefined;
        }
        refreshToday().catch(() => {
          setIsDashboardLoading(false);
        });
        return undefined;
      }, [refreshToday]),
    );

    useFocusEffect(
      useCallback(() => {
        waveAnimationProgress.setValue(0);
        const animation = Animated.loop(
          Animated.timing(waveAnimationProgress, {
            toValue: 1,
            duration: 11000,
            easing: Easing.linear,
            useNativeDriver: true,
            isInteraction: false,
          }),
        );
        animation.start();

        return () => {
          animation.stop();
          waveAnimationProgress.stopAnimation();
        };
      }, [waveAnimationProgress]),
    );

    const visiblePrimaryActions =
      dailyPlan?.primaryActions.filter(isReleaseVisibleDailyPlanAction) ?? [];
    const totalTasks = visiblePrimaryActions.length;
    const doneTasks = visiblePrimaryActions.filter(
      action => action.completed,
    ).length;
    const impactCompletionPct = dailyPlan
      ? riskImpactCompletionPercent(dailyPlan)
      : 0;
    const completedRiskImpact = dailyPlan
      ? completedRiskImpactValue(dailyPlan)
      : 0;
    const totalRiskImpact = dailyPlan?.riskImpact?.totalValue ?? 0;
    const hasRiskImpactProgress =
      dailyPlan?.riskImpact !== undefined && totalRiskImpact !== 0;
    const protectionPct = hasRiskImpactProgress
      ? impactCompletionPct
      : totalTasks > 0
      ? Math.round((doneTasks / totalTasks) * 100)
      : 0;

    const handleChangeActionState = useCallback(
      async (
        action: DailyPlanAction,
        state: DailyActionState,
      ): Promise<boolean> => {
        if (!dailyPlan) return false;
        const visibleDailyPlanPrimaryActions = dailyPlan.primaryActions.filter(
          isReleaseVisibleDailyPlanAction,
        );
        const hadCompletedAction = visibleDailyPlanPrimaryActions.some(
          item => item.completed,
        );
        const isPrimary = visibleDailyPlanPrimaryActions.some(
          item => item.key === action.key,
        );
        try {
          const update = await updateDailyPlanActionState(
            identity,
            dailyPlan,
            action.key,
            state,
          );
          setDailyPlan(update.experience);
          if (state === 'completed' && !action.completed) {
            ProductAnalytics.track(identity, 'task_complete', {
              kind: isPrimary ? 'primary' : 'extra',
              domain: action.domain,
            });
            ProductAnalytics.track(identity, 'domain_participation', {
              domain: action.domain,
              completedCount: 1,
            });
            if (isPrimary) {
              const streak = getPersistentStreak(identity, date);
              ProductAnalytics.track(identity, 'streak_progress', {
                days: streak.days,
                freezeAvailable: streak.freezeAvailable,
              });
            }
          }

          if (
            state === 'completed' &&
            isPrimary &&
            !hadCompletedAction &&
            !useRecommendationExperienceStore
              .getState()
              .hasCelebratedDailyWin(date)
          ) {
            useRecommendationExperienceStore
              .getState()
              .markDailyWinCelebrated(date);
            setShowDailyWin(true);
          }
          const milestone = t(
            `home.week_desc_w${String(currentWeek).padStart(2, '0')}`,
          );
          setStreakDays(
            loadWeeklySummaryExperience({
              identity,
              pregnancyWeek: currentWeek,
              endDate: date,
              milestone,
              backendSummary: summary,
            }).streakDays,
          );
          return true;
        } catch {
          showToast({
            type: 'error',
            title: t('today.task_update_failed_title'),
            message: t('today.task_update_failed_message'),
          });
          return false;
        }
      },
      [currentWeek, dailyPlan, date, identity, showToast, summary, t],
    );

    const handleToggleAction = useCallback(
      (action: DailyPlanAction, completed: boolean): Promise<boolean> =>
        handleChangeActionState(action, completed ? 'completed' : 'pending'),
      [handleChangeActionState],
    );

    const medicalAttention = medicalSafetyAlerts[0] ?? null;
    const importantGuidance = importantGuidanceItems[0] ?? null;

    const motherDataAvailable = Boolean(
      summary?.mom_exposure || summary?.risks_delta?.mom !== undefined,
    );
    const babyDataAvailable = Boolean(
      summary?.baby_exposure || summary?.risks_delta?.baby !== undefined,
    );
    const motherStatus: DashboardStatus =
      isPresentationMotherBabyContext && !motherDataAvailable
        ? 'context'
        : !motherDataAvailable
        ? 'unavailable'
        : (summary?.risks_delta?.mom ?? 0) > 0
        ? 'attention'
        : 'stable';
    const babyStatus: DashboardStatus =
      isPresentationMotherBabyContext && !babyDataAvailable
        ? 'context'
        : !babyDataAvailable
        ? 'unavailable'
        : (summary?.risks_delta?.baby ?? 0) > 0
        ? 'attention'
        : 'stable';
    const motherAndBabyAttention =
      motherStatus === 'attention' || babyStatus === 'attention';
    const motherAndBabyStatus: DashboardStatus = motherAndBabyAttention
      ? 'attention'
      : motherStatus === 'context' && babyStatus === 'context'
      ? 'context'
      : motherDataAvailable || babyDataAvailable
      ? 'stable'
      : 'unavailable';

    const statusLabel = (status: DashboardStatus): string =>
      t(
        status === 'stable'
          ? 'today.status_stable'
          : status === 'attention'
          ? 'today.status_attention'
          : status === 'context'
          ? 'today.status_care_context'
          : isDashboardLoading
          ? 'today.status_updating'
          : 'today.status_unavailable',
      );

    const moodSummary = checkIn
      ? selectedItemSummary(
          checkIn.selection.moodKeys,
          checkIn.moods,
          t('today.log_now'),
        )
      : t('today.log_now');
    const feelingSummary = checkIn
      ? selectedItemSummary(
          checkIn.selection.feelingKeys,
          checkIn.feelings,
          t('today.log_now'),
        )
      : t('today.log_now');
    const hydrationTarget =
      lifestyle?.hydration_target_ml_per_day ?? checkIn?.waterGoalMl ?? 0;
    const waterProgress = Math.min(
      100,
      hydrationTarget > 0
        ? Math.round(
            ((checkIn?.waterDailyTotalMl ?? 0) / hydrationTarget) * 100,
          )
        : 0,
    );
    const moodProgress =
      checkIn && checkIn.moods.length > 0
        ? Math.min(
            100,
            Math.round(
              (checkIn.selection.moodKeys.length / checkIn.moods.length) * 100,
            ),
          )
        : 0;
    const feelingProgress =
      checkIn && checkIn.feelings.length > 0
        ? Math.min(
            100,
            Math.round(
              (checkIn.selection.feelingKeys.length / checkIn.feelings.length) *
                100,
            ),
          )
        : 0;
    const selectedMommySymptomKeys = new Set(
      checkIn?.selection.mommySymptomKeys ?? [],
    );
    const selectedMommySymptoms =
      checkIn?.mommySymptoms.filter(item =>
        selectedMommySymptomKeys.has(item.key),
      ) ?? [];
    const warningSymptoms = selectedMommySymptoms.filter(
      item => item.group === 'warning',
    );
    const symptomCount = selectedMommySymptoms.length;
    const symptomRecordKnown = checkIn?.recordState === 'recorded';
    const symptomSummary =
      warningSymptoms.length > 0
        ? t('today.warning_symptoms_recorded', {
            count: warningSymptoms.length,
            total: symptomCount,
          })
        : symptomCount > 0
        ? t('today.symptoms_recorded', {
            count: symptomCount,
          })
        : symptomRecordKnown
        ? t('today.no_symptoms_reported')
        : t('today.log_symptoms');
    const symptomUtilitySummary =
      warningSymptoms.length > 0
        ? t('today.symptom_warning_compact', {
            count: warningSymptoms.length,
            total: symptomCount,
          })
        : symptomCount > 0
        ? t('today.symptom_count_compact', {
            count: symptomCount,
          })
        : symptomRecordKnown
        ? t('today.symptom_none_compact')
        : t('today.log_symptoms');
    const quickRest = dailyMoments['quick-rest'];
    const restSummary = quickRest?.completed
      ? t('today.rest_logged', {
          minutes: quickRest.durationMinutes ?? 10,
        })
      : t('today.log_rest');
    const growingSystems = useMemo(() => {
      const weekIndex = Math.max(
        0,
        Math.min(WEEKS_DATA.length - 1, currentWeek - 1),
      );
      const systems = WEEKS_DATA[weekIndex]?.circleIcons ?? [];
      if (systems.length > 0) return systems.slice(0, 3);
      return [
        {
          index: 0,
          iconPath: 'brainSystem.svg',
          percentage: 0,
        },
        {
          index: 1,
          iconPath: 'senseSystem.svg',
          percentage: 0,
        },
      ];
    }, [currentWeek]);

    const getSystemLabel = (iconPath?: string): string => {
      const rawKey = (iconPath || 'heartSystem.svg').replace('.svg', '');
      const translated = t(`baby.system_${rawKey}` as any, {
        defaultValue: '',
      });
      return (
        translated ||
        rawKey
          .replace(/System$/, '')
          .replace(/([A-Z])/g, ' $1')
          .trim()
      );
    };

    const openQuickCheckIn = (
      kind: TodayQuickCheckInKind,
      trigger: React.ElementRef<typeof Pressable> | null,
    ) => {
      lastSheetTrigger.current = trigger;
      setQuickCheckInKind(kind);
    };

    const openDetailSheet = (
      sheet: Exclude<DashboardDetailSheet, null>,
      trigger: React.ElementRef<typeof Pressable> | null,
    ) => {
      lastSheetTrigger.current = trigger;
      setDetailSheet(sheet);
    };

    const restoreSheetTriggerFocus = () => {
      const trigger = lastSheetTrigger.current;
      setTimeout(() => {
        const node = trigger ? findNodeHandle(trigger) : null;
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 350);
    };

    const closeQuickCheckIn = () => {
      setQuickCheckInKind(null);
      restoreSheetTriggerFocus();
    };

    const closeDetailSheet = () => {
      setDetailSheet(null);
      restoreSheetTriggerFocus();
    };

    const waterRef = useRef<React.ElementRef<typeof Pressable> | null>(null);
    const moodRef = useRef<React.ElementRef<typeof Pressable> | null>(null);
    const feelingRef = useRef<React.ElementRef<typeof Pressable> | null>(null);
    const snapshotRef = useRef<React.ElementRef<typeof Pressable> | null>(null);
    const symptomRef = useRef<React.ElementRef<typeof Pressable> | null>(null);
    const restRef = useRef<React.ElementRef<typeof Pressable> | null>(null);

    const formatRiskDelta = (delta: number | undefined): string => {
      if (delta === undefined) {
        return t('today.status_unavailable');
      }
      if (delta === 0) return t('today.no_change');
      return `${Math.abs(delta).toFixed(1)}% ${t(
        delta < 0 ? 'today.decrease' : 'today.increase',
      )}`;
    };
    const formatSignedPercent = (value: number): string =>
      `${value < 0 ? '-' : '+'}${Math.abs(value).toFixed(1)}%`;

    const handleDashboardCardLayout = useCallback((event: any) => {
      const nextHeight = Math.ceil(event.nativeEvent.layout.height);
      setDashboardCardHeight(previousHeight =>
        Math.abs(previousHeight - nextHeight) > 1 ? nextHeight : previousHeight,
      );
    }, []);

    const handleDashboardScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nextPage =
          event.nativeEvent.contentOffset.x >= dashboardSecondOffset / 2
            ? 1
            : 0;
        setDashboardPage(nextPage);
      },
      [dashboardSecondOffset],
    );

    const showDashboardPage = useCallback(
      (page: number) => {
        const nextPage = page === 1 ? 1 : 0;
        dashboardCarouselRef.current?.scrollTo({
          x: nextPage === 1 ? dashboardSecondOffset : 0,
          animated: true,
        });
        setDashboardPage(nextPage);
      },
      [dashboardSecondOffset],
    );

    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            flex: 1,
            backgroundColor: '#FFFFFF',
          },
          pageGradient: {
            ...StyleSheet.absoluteFillObject,
          },
          navHeader: {
            minHeight: 64,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing('sm'),
            paddingVertical: spacing('xs'),
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.colors.neutral200,
            backgroundColor: 'rgba(255, 255, 255, 0.97)',
          },
          backButton: {
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          },
          navTitle: {
            flex: 1,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 18,
          },
          scroll: {
            flex: 1,
          },
          content: {
            width: '100%',
            maxWidth: 680,
            alignSelf: 'center',
            paddingHorizontal: spacing('md'),
            paddingBottom: spacing('xl') + 96,
          },
          warning: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: spacing('md'),
            marginTop: spacing('md'),
            borderRadius: radius('lg'),
            borderWidth: 1,
            borderColor: '#E8A4A4',
            backgroundColor: '#FFF1F1',
            gap: spacing('sm'),
          },
          warningCopy: {
            flex: 1,
          },
          warningTitle: {
            color: '#852525',
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 15,
          },
          warningBody: {
            marginTop: spacing('xs'),
            color: '#6E2B2B',
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 13,
            lineHeight: 19,
          },
          importantGuidance: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: spacing('md'),
            marginTop: spacing('md'),
            borderRadius: radius('lg'),
            borderWidth: 1,
            borderColor: '#F0C78A',
            backgroundColor: '#FFF8EA',
            gap: spacing('sm'),
          },
          importantGuidanceTitle: {
            color: theme.colors.orange800,
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 15,
          },
          importantGuidanceBody: {
            marginTop: spacing('xs'),
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 13,
            lineHeight: 19,
          },
          section: {
            marginTop: spacing('md'),
          },
          sectionTitle: {
            marginBottom: spacing('sm'),
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 20,
          },
          dashboardCarouselShell: {
            marginTop: spacing('md'),
          },
          dashboardCarousel: {
            overflow: 'visible',
          },
          dashboardCarouselContent: {
            alignItems: 'stretch',
            paddingVertical: 10,
            gap: DASHBOARD_CAROUSEL_GAP,
          },
          dashboardSlide: {
            justifyContent: 'flex-start',
          },
          carouselPagination: {
            minHeight: 28,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          },
          pageIndicatorHit: {
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
          },
          pageIndicator: {
            width: 7,
            height: 5,
            borderRadius: 3,
            backgroundColor: '#D8D2CF',
          },
          pageIndicatorActive: {
            width: 22,
            backgroundColor: theme.colors.orange500,
          },
          liveCard: {
            padding: spacing('md'),
            borderRadius: 24,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: '#E9E5E2',
            backgroundColor: '#FFFFFF',
            shadowColor: '#5F4858',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 18,
            elevation: 5,
          },
          liveMeta: {
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
          },
          liveMetaCopy: {
            flex: 1,
          },
          liveWeek: {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 16,
          },
          liveDate: {
            marginTop: 3,
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 11,
          },
          liveDivider: {
            height: StyleSheet.hairlineWidth,
            marginVertical: spacing('sm'),
            backgroundColor: '#ECE9E6',
          },
          signalsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing('sm'),
          },
          signalsLabel: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 10,
            letterSpacing: 0.55,
            textTransform: 'uppercase',
          },
          careStatusRow: {
            minHeight: 58,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing('md'),
            paddingHorizontal: spacing('sm'),
            borderRadius: 16,
            backgroundColor: '#F7F6F5',
          },
          careStatusIcon: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing('sm'),
            backgroundColor: '#FFFFFF',
          },
          careStatusCopy: {
            flex: 1,
          },
          careStatusLabel: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 10,
          },
          careStatusValue: {
            marginTop: 2,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 12,
          },
          statusDot: {
            width: 7,
            height: 7,
            marginRight: spacing('sm'),
            borderRadius: 4,
          },
          heroCard: {
            overflow: 'hidden',
            marginTop: spacing('md'),
            borderRadius: 24,
            shadowColor: '#C63A22',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 18,
            elevation: 8,
          },
          heroGradient: {
            minHeight: 220,
            padding: spacing('lg'),
          },
          heroGlowOne: {
            position: 'absolute',
            top: -55,
            right: -30,
            width: 155,
            height: 155,
            borderRadius: 78,
            backgroundColor: 'rgba(255,255,255,0.16)',
          },
          heroGlowTwo: {
            position: 'absolute',
            bottom: -70,
            left: -25,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: 'rgba(126,35,118,0.18)',
          },
          heroTop: {
            flexDirection: 'row',
            alignItems: 'center',
          },
          heroCopy: {
            flex: 1,
            paddingRight: spacing('md'),
          },
          heroEyebrow: {
            color: 'rgba(255,255,255,0.82)',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 12,
            letterSpacing: 0.7,
            textTransform: 'uppercase',
          },
          heroWeek: {
            marginTop: spacing('xs'),
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 25,
            lineHeight: 32,
          },
          heroDate: {
            marginTop: 2,
            color: 'rgba(255,255,255,0.84)',
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 13,
          },
          progressRing: {
            width: 82,
            height: 82,
            alignItems: 'center',
            justifyContent: 'center',
          },
          progressRingValue: {
            position: 'absolute',
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 17,
          },
          progressRingLabel: {
            marginTop: spacing('xs'),
            color: 'rgba(255,255,255,0.8)',
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 10,
            textAlign: 'center',
          },
          heroStatuses: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing('lg'),
            gap: spacing('sm'),
          },
          heroStatus: {
            minHeight: 55,
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing('sm'),
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            borderRadius: radius('md'),
            backgroundColor: 'rgba(255,255,255,0.16)',
          },
          heroStatusIcon: {
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing('xs'),
            backgroundColor: 'rgba(255,255,255,0.22)',
          },
          heroStatusCopy: {
            flex: 1,
          },
          heroStatusLabel: {
            color: 'rgba(255,255,255,0.72)',
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 10,
          },
          heroStatusValue: {
            marginTop: 1,
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 12,
          },
          heroFooter: {
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: spacing('sm'),
            paddingHorizontal: spacing('sm'),
            borderRadius: radius('md'),
            backgroundColor: 'rgba(29,9,19,0.16)',
          },
          heroFooterText: {
            flex: 1,
            marginHorizontal: spacing('sm'),
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 12,
          },
          checkInCard: {
            flexDirection: 'row',
            gap: spacing('sm'),
          },
          checkInItem: {
            borderRadius: 9,
          },
          checkInUtilityRail: {
            flexDirection: 'row',
            alignItems: 'stretch',
            marginTop: spacing('sm'),
            overflow: 'hidden',
            borderRadius: 14,
            backgroundColor: '#FAF9F7',
          },
          checkInUtilityItem: {
            flex: 1,
            minHeight: 66,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing('sm'),
            paddingVertical: spacing('xs'),
          },
          checkInUtilityDivider: {
            width: StyleSheet.hairlineWidth,
            marginVertical: spacing('sm'),
            backgroundColor: theme.colors.neutral200,
          },
          checkInUtilityIcon: {
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing('xs'),
            backgroundColor: theme.colors.orange50,
          },
          checkInUtilityIconWarning: {
            backgroundColor: '#FFF0F0',
          },
          checkInUtilityIconRest: {
            backgroundColor: '#F3EAF8',
          },
          checkInUtilityCopy: {
            flex: 1,
            minWidth: 0,
          },
          checkInUtilityTitle: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 9,
            letterSpacing: 0.35,
            textTransform: 'uppercase',
          },
          checkInUtilityValue: {
            marginTop: 2,
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 11,
            lineHeight: 14,
          },
          checkInUtilityWarning: {
            color: '#8A2525',
          },
          checkInUtilityChevron: {
            marginLeft: 3,
          },
          preparingPlan: {
            minHeight: 110,
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing('lg'),
            marginTop: spacing('lg'),
            borderRadius: radius('lg'),
            borderWidth: 1,
            borderColor: theme.colors.orange200,
            backgroundColor: theme.colors.orange50,
          },
          preparingText: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
          },
          retryPlanButton: {
            minHeight: 36,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing('md'),
            paddingHorizontal: spacing('md'),
            borderRadius: 18,
            backgroundColor: theme.colors.orange500,
            gap: spacing('xs'),
          },
          retryPlanButtonText: {
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 12,
          },
          riskCard: {
            overflow: 'hidden',
            borderRadius: 22,
            backgroundColor: '#24222D',
            shadowColor: '#17151D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.22,
            shadowRadius: 14,
            elevation: 6,
          },
          riskSummary: {
            minHeight: 92,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing('md'),
            paddingVertical: spacing('sm'),
          },
          riskIcon: {
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing('sm'),
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.18)',
            backgroundColor: 'rgba(255,255,255,0.11)',
          },
          riskCopy: {
            flex: 1,
          },
          riskLabel: {
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 15,
          },
          riskDetail: {
            marginTop: 3,
            color: 'rgba(255,255,255,0.64)',
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 12,
          },
          riskStatusPill: {
            marginRight: spacing('sm'),
            paddingHorizontal: spacing('sm'),
            paddingVertical: 6,
            borderRadius: 15,
            backgroundColor: 'rgba(255,255,255,0.13)',
          },
          riskStatusText: {
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 11,
            textAlign: 'right',
          },
          weekCard: {
            position: 'relative',
            overflow: 'hidden',
            padding: spacing('md'),
            borderRadius: 24,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: '#E7E0E9',
            backgroundColor: '#FFFFFF',
            shadowColor: '#654676',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 18,
            elevation: 5,
          },
          weekAccent: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
          },
          weekGlow: {
            position: 'absolute',
            top: -72,
            right: -58,
            width: 170,
            height: 170,
            borderRadius: 85,
            backgroundColor: 'rgba(112,66,143,0.07)',
          },
          weekHeader: {
            minHeight: 54,
            flexDirection: 'row',
            alignItems: 'center',
          },
          weekHeaderIcon: {
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing('sm'),
            backgroundColor: '#F3EAF8',
          },
          weekHeaderCopy: {
            flex: 1,
          },
          weekLabel: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 10,
            letterSpacing: 0.55,
            textTransform: 'uppercase',
          },
          weekBadge: {
            paddingHorizontal: spacing('sm'),
            paddingVertical: 6,
            borderRadius: 14,
            backgroundColor: '#FFF0E2',
          },
          weekBadgeText: {
            color: '#A84E13',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 10,
          },
          weekSummary: {
            marginTop: spacing('xs'),
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 14,
            lineHeight: 21,
          },
          systemsLabel: {
            marginTop: spacing('md'),
            marginBottom: 3,
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 10,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          },
          systemsList: {
            flex: 1,
          },
          systemRow: {
            minHeight: 62,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing('sm'),
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#F0E5DC',
          },
          systemRowLast: {
            borderBottomWidth: 0,
          },
          systemIcon: {
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing('sm'),
            backgroundColor: '#FFF0E2',
          },
          systemCopy: {
            flex: 1,
          },
          systemName: {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 12,
          },
          systemProgressRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 6,
            gap: spacing('sm'),
          },
          systemPercentage: {
            color: theme.colors.orange700,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 10,
          },
          systemProgressTrack: {
            height: 5,
            flex: 1,
            overflow: 'hidden',
            borderRadius: 3,
            backgroundColor: '#F5D7BE',
          },
          systemProgressFill: {
            height: 5,
            borderRadius: 3,
            backgroundColor: theme.colors.orange500,
          },
          weekAction: {
            minHeight: 46,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing('sm'),
            paddingTop: spacing('sm'),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: '#E7E0E9',
            gap: spacing('xs'),
          },
          weekActionText: {
            color: theme.colors.orange700,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 13,
          },
          sheet: {
            maxHeight: 620,
            paddingBottom: insets.bottom + spacing('xs'),
          },
          connectionSheet: {
            paddingHorizontal: spacing('md'),
            paddingBottom: insets.bottom + spacing('md'),
          },
          connectionTitle: {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.extraBold,
            fontSize: 21,
            lineHeight: 28,
          },
          connectionBody: {
            marginTop: spacing('sm'),
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 14,
            lineHeight: 21,
          },
          connectionRetry: {
            minHeight: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing('xs'),
            marginTop: spacing('lg'),
            borderRadius: radius('md'),
            backgroundColor: theme.colors.orange500,
          },
          connectionRetryText: {
            color: '#FFFFFF',
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 15,
          },
          connectionClose: {
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing('xs'),
          },
          connectionCloseText: {
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 14,
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
          closeButton: {
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.neutral100,
          },
          sheetScroll: {
            maxHeight: 480,
          },
          detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing('md'),
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.neutral200,
          },
          detailIcon: {
            width: 38,
            alignItems: 'center',
            marginRight: spacing('sm'),
          },
          detailCopy: {
            flex: 1,
          },
          detailLabel: {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 14,
          },
          detailText: {
            marginTop: 2,
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 12,
            lineHeight: 18,
          },
          detailValue: {
            marginLeft: spacing('sm'),
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 13,
            textAlign: 'right',
          },
          recordedSymptoms: {
            marginBottom: spacing('md'),
            padding: spacing('md'),
            borderRadius: radius('md'),
            backgroundColor: '#FFF8F2',
          },
          recordedSymptomsWarning: {
            borderWidth: 1,
            borderColor: '#E8B3B3',
            backgroundColor: '#FFF4F4',
          },
          recordedSymptomsHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing('xs'),
          },
          recordedSymptomsTitle: {
            flex: 1,
            marginLeft: spacing('sm'),
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 14,
          },
          recordedSymptomRow: {
            paddingVertical: spacing('xs'),
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.fontFamily.medium,
            fontSize: 13,
            lineHeight: 18,
          },
          symptomWarningNote: {
            marginTop: spacing('sm'),
            color: '#8A2525',
            fontFamily: theme.typography.fontFamily.regular,
            fontSize: 12,
            lineHeight: 18,
          },
          historyButton: {
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: spacing('sm'),
            borderRadius: 21,
            backgroundColor: '#FFFFFF',
            gap: spacing('xs'),
          },
          historyButtonText: {
            color: theme.colors.orange600,
            fontFamily: theme.typography.fontFamily.bold,
            fontSize: 13,
          },
        }),
      [insets.bottom, theme],
    );

    const renderSheetHeader = (title: string) => (
      <View style={styles.sheetHeader}>
        <Text accessibilityRole="header" style={styles.sheetTitle}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={closeDetailSheet}
          style={styles.closeButton}
        >
          <FontAwesomeIcon
            icon={faTimes}
            size={18}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      </View>
    );

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          pointerEvents="none"
          colors={['#FFFFFF', '#FFFEFD', '#FAFAFC']}
          locations={[0, 0.62, 1]}
          style={styles.pageGradient}
        />
        <View style={styles.navHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={onBackPress}
            style={styles.backButton}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              size={19}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Text accessibilityRole="header" style={styles.navTitle}>
            {t('today.title')}
          </Text>
          {dailyPlan ? (
            <ExploreMoreView
              experience={dailyPlan}
              onChangeActionState={handleChangeActionState}
            />
          ) : null}
        </View>

        <ScrollView
          ref={pageScrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {medicalAttention ? (
            <View accessibilityRole="alert" style={styles.warning}>
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                size={19}
                color="#A63232"
              />
              <View style={styles.warningCopy}>
                <Text style={styles.warningTitle}>
                  {medicalAttention.title || t('today.attention_required')}
                </Text>
                <Text style={styles.warningBody}>
                  {medicalAttention.alert || medicalAttention.message}
                </Text>
              </View>
            </View>
          ) : null}
          {importantGuidance ? (
            <View style={styles.importantGuidance}>
              <FontAwesomeIcon
                icon={faCircleExclamation}
                size={18}
                color={theme.colors.orange700}
              />
              <View style={styles.warningCopy}>
                <Text style={styles.importantGuidanceTitle}>
                  {importantGuidance.title}
                </Text>
                {importantGuidance.alert || importantGuidance.message ? (
                  <Text style={styles.importantGuidanceBody}>
                    {importantGuidance.alert || importantGuidance.message}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.dashboardCarouselShell}>
            <ScrollView
              ref={dashboardCarouselRef}
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              decelerationRate="fast"
              disableIntervalMomentum
              snapToOffsets={[0, dashboardSecondOffset]}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleDashboardScrollEnd}
              style={styles.dashboardCarousel}
              contentContainerStyle={styles.dashboardCarouselContent}
            >
              <View style={[styles.dashboardSlide, dashboardCardStyle]}>
                <View
                  onLayout={handleDashboardCardLayout}
                  style={styles.liveCard}
                >
                  <View style={styles.liveMeta}>
                    <View style={styles.liveMetaCopy}>
                      <Text style={styles.liveWeek}>
                        {t('today.week_label', {
                          week: currentWeek,
                        })}
                      </Text>
                      <Text style={styles.liveDate}>
                        {`${t('today.day_week', {
                          week: currentWeek,
                        })
                          .split('/')[0]
                          .trim()} · ${currentDateLabel}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.liveDivider} />
                  <ExposureAccordion
                    airExposure={airExposure}
                    embedded
                    locationPermissionGranted={!isLocationPermissionRequired}
                    onRequestLocation={() => setShowLocationSheet(true)}
                    loading={isDashboardLoading && hasLocationPermission}
                    onRetry={
                      isDashboardLoading || !hasLocationPermission
                        ? undefined
                        : () => {
                            refreshToday().catch(() => {
                              setIsDashboardLoading(false);
                            });
                          }
                    }
                    ventilation={profile.ventilation}
                    onOpenHistory={() => openDetailSheet('risks', null)}
                  />
                  <View style={styles.liveDivider} />

                  <View style={styles.signalsHeader}>
                    <Text style={styles.signalsLabel}>
                      {t('today.todays_checkin')}
                    </Text>
                  </View>
                  <View style={styles.checkInCard}>
                    <Pressable
                      ref={waterRef}
                      accessibilityRole="button"
                      accessibilityLabel={t(
                        'today.water_checkin_accessibility',
                        {
                          amount: checkIn?.waterDailyTotalMl ?? 0,
                          target: hydrationTarget,
                        },
                      )}
                      onPress={() =>
                        openQuickCheckIn('water', waterRef.current)
                      }
                      style={styles.checkInItem}
                    >
                      <WaveCard
                        type="water"
                        percentage={waterProgress}
                        label={t('today.water')}
                        animationProgress={waveAnimationProgress}
                        value={`${
                          checkIn?.waterDailyTotalMl ?? 0
                        }/${hydrationTarget} ml`}
                        compact
                        availableWidth={dashboardCardInnerWidth}
                      />
                    </Pressable>

                    <Pressable
                      ref={moodRef}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('today.mood')}. ${moodSummary}`}
                      onPress={() => openQuickCheckIn('mood', moodRef.current)}
                      style={styles.checkInItem}
                    >
                      <WaveCard
                        type="mood"
                        percentage={moodProgress}
                        label={t('today.mood')}
                        animationProgress={waveAnimationProgress}
                        value={moodSummary}
                        compact
                        availableWidth={dashboardCardInnerWidth}
                      />
                    </Pressable>

                    <Pressable
                      ref={feelingRef}
                      accessibilityRole="button"
                      accessibilityLabel={`${t(
                        'today.feeling',
                      )}. ${feelingSummary}`}
                      onPress={() =>
                        openQuickCheckIn('feeling', feelingRef.current)
                      }
                      style={styles.checkInItem}
                    >
                      <WaveCard
                        type="feeling"
                        percentage={feelingProgress}
                        label={t('today.feeling')}
                        animationProgress={waveAnimationProgress}
                        value={feelingSummary}
                        compact
                        availableWidth={dashboardCardInnerWidth}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.checkInUtilityRail}>
                    <Pressable
                      ref={symptomRef}
                      accessibilityRole="button"
                      accessibilityLabel={symptomSummary}
                      onPress={() =>
                        openQuickCheckIn('symptom', symptomRef.current)
                      }
                      style={styles.checkInUtilityItem}
                    >
                      <View
                        style={[
                          styles.checkInUtilityIcon,
                          warningSymptoms.length > 0 &&
                            styles.checkInUtilityIconWarning,
                        ]}
                      >
                        <FontAwesomeIcon
                          icon={
                            warningSymptoms.length > 0
                              ? faTriangleExclamation
                              : faCheck
                          }
                          size={12}
                          color={
                            warningSymptoms.length > 0
                              ? '#B93838'
                              : theme.colors.orange500
                          }
                        />
                      </View>
                      <View style={styles.checkInUtilityCopy}>
                        <Text style={styles.checkInUtilityTitle}>
                          {t('today.symptoms')}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={[
                            styles.checkInUtilityValue,
                            warningSymptoms.length > 0 &&
                              styles.checkInUtilityWarning,
                          ]}
                        >
                          {symptomUtilitySummary}
                        </Text>
                      </View>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        size={10}
                        color={theme.colors.neutral500}
                        style={styles.checkInUtilityChevron}
                      />
                    </Pressable>

                    <View style={styles.checkInUtilityDivider} />

                    <Pressable
                      ref={restRef}
                      accessibilityRole="button"
                      accessibilityLabel={restSummary}
                      onPress={() => openQuickCheckIn('rest', restRef.current)}
                      style={styles.checkInUtilityItem}
                    >
                      <View
                        style={[
                          styles.checkInUtilityIcon,
                          styles.checkInUtilityIconRest,
                        ]}
                      >
                        <FontAwesomeIcon
                          icon={quickRest?.completed ? faCheck : faBed}
                          size={12}
                          color="#70428F"
                        />
                      </View>
                      <View style={styles.checkInUtilityCopy}>
                        <Text style={styles.checkInUtilityTitle}>
                          {t('today.rest')}
                        </Text>
                        <Text
                          numberOfLines={2}
                          style={styles.checkInUtilityValue}
                        >
                          {restSummary}
                        </Text>
                      </View>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        size={10}
                        color={theme.colors.neutral500}
                        style={styles.checkInUtilityChevron}
                      />
                    </Pressable>
                  </View>

                  <Pressable
                    ref={snapshotRef}
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      'today.mother_and_baby_status_accessibility',
                    )}
                    accessibilityHint={t('today.opens_mother_baby_details')}
                    onPress={() =>
                      openDetailSheet('snapshot', snapshotRef.current)
                    }
                    style={styles.careStatusRow}
                  >
                    <View style={styles.careStatusIcon}>
                      <FontAwesomeIcon
                        icon={
                          motherAndBabyStatus === 'attention'
                            ? faCircleExclamation
                            : faShieldHeart
                        }
                        size={14}
                        color={statusColor(motherAndBabyStatus)}
                      />
                    </View>
                    <View style={styles.careStatusCopy}>
                      <Text style={styles.careStatusLabel}>
                        {t('today.mother_and_baby_status')}
                      </Text>
                      <Text numberOfLines={1} style={styles.careStatusValue}>
                        {statusLabel(motherAndBabyStatus)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: statusColor(motherAndBabyStatus),
                        },
                      ]}
                    />
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={11}
                      color={theme.colors.neutral500}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.dashboardSlide, dashboardCardStyle]}>
                <View style={[styles.weekCard, weekCardHeightStyle]}>
                  <LinearGradient
                    pointerEvents="none"
                    colors={['#70428F', '#C87898', '#FF8A48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.weekAccent}
                  />
                  <View pointerEvents="none" style={styles.weekGlow} />

                  <View style={styles.weekHeader}>
                    <View style={styles.weekHeaderIcon}>
                      <FontAwesomeIcon
                        icon={faBaby}
                        size={17}
                        color="#70428F"
                      />
                    </View>
                    <View style={styles.weekHeaderCopy}>
                      <Text style={styles.weekLabel}>
                        {t('today.this_week')}
                      </Text>
                    </View>
                    <View style={styles.weekBadge}>
                      <Text style={styles.weekBadgeText}>
                        {t('today.week_label', {
                          week: currentWeek,
                        })}
                      </Text>
                    </View>
                  </View>

                  <Text numberOfLines={3} style={styles.weekSummary}>
                    {summary?.week_info?.text || t('today.week_default_text')}
                  </Text>

                  <Text style={styles.systemsLabel}>
                    {t('baby.development_systems')}
                  </Text>
                  <View style={styles.systemsList}>
                    {growingSystems.map((system, index) => {
                      const iconPath = system.iconPath || 'heartSystem.svg';
                      const svg =
                        SVG_ICONS[iconPath] || SVG_ICONS['heartSystem.svg'];
                      const percentage = Math.min(
                        100,
                        Math.max(0, system.percentage ?? 0),
                      );
                      return (
                        <View
                          key={`${system.index}-${iconPath}`}
                          style={[
                            styles.systemRow,
                            index === growingSystems.length - 1 &&
                              styles.systemRowLast,
                          ]}
                        >
                          <View style={styles.systemIcon}>
                            <SystemProgressIcon
                              svgXml={svg}
                              width={25}
                              height={25}
                              percentage={percentage}
                              uniqueId={`today-week-${currentWeek}-${system.index}-${iconPath}`}
                            />
                          </View>
                          <View style={styles.systemCopy}>
                            <Text numberOfLines={1} style={styles.systemName}>
                              {getSystemLabel(iconPath)}
                            </Text>
                            <View style={styles.systemProgressRow}>
                              <View style={styles.systemProgressTrack}>
                                <View
                                  style={[
                                    styles.systemProgressFill,
                                    {
                                      width: `${percentage}%`,
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.systemPercentage}>
                                {percentage}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={
                      onNavigateToWeeklySummary ?? onNavigateToBabyStatus
                    }
                    style={styles.weekAction}
                  >
                    <Text style={styles.weekActionText}>
                      {t(
                        onNavigateToWeeklySummary
                          ? 'today.view_weekly_summary'
                          : 'today.view_weekly_development',
                      )}
                    </Text>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      size={12}
                      color={theme.colors.orange700}
                    />
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            <View style={styles.carouselPagination}>
              {[0, 1].map(page => (
                <Pressable
                  key={page}
                  accessibilityRole="button"
                  accessibilityLabel={`${
                    page === 0 ? t('today.exposure') : t('today.this_week')
                  } ${page + 1}/2`}
                  accessibilityState={{
                    selected: dashboardPage === page,
                  }}
                  onPress={() => showDashboardPage(page)}
                  style={styles.pageIndicatorHit}
                >
                  <View
                    style={[
                      styles.pageIndicator,
                      dashboardPage === page && styles.pageIndicatorActive,
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {dailyPlanLoadStatus === 'needsInput' ? (
            <View
              onLayout={event => {
                planSectionY.current = event.nativeEvent.layout.y;
                if (
                  initialFocus === 'plan' &&
                  appliedFocusKey.current !== 'plan-inputs'
                ) {
                  appliedFocusKey.current = 'plan-inputs';
                  requestAnimationFrame(() => {
                    pageScrollRef.current?.scrollTo({
                      y: Math.max(0, planSectionY.current - spacing('sm')),
                      animated: true,
                    });
                  });
                }
              }}
            >
              <PlanInputEmptyState
                readiness={planInputReadiness}
                onCompleteProfile={onCompletePlanProfile}
                onCompleteCheckIn={onCompletePlanCheckIn}
              />
            </View>
          ) : dailyPlan ? (
            <View
              onLayout={event => {
                planSectionY.current = event.nativeEvent.layout.y;
                const focusKey = initialActionKey ?? initialFocus ?? null;
                if (focusKey && appliedFocusKey.current !== focusKey) {
                  appliedFocusKey.current = focusKey;
                  requestAnimationFrame(() => {
                    pageScrollRef.current?.scrollTo({
                      y: Math.max(0, planSectionY.current - spacing('sm')),
                      animated: true,
                    });
                  });
                }
              }}
            >
              <DailyPlanView
                experience={dailyPlan}
                identity={identity}
                onToggleAction={handleToggleAction}
                onChangeActionState={handleChangeActionState}
                dailyWinVisible={showDailyWin}
                onCloseDailyWin={() => setShowDailyWin(false)}
                streakDays={streakDays}
                onOpenWeeklySummary={onNavigateToWeeklySummary}
                highlightedActionKey={initialActionKey}
                onHighlightedActionLayout={offsetY => {
                  if (!initialActionKey) return;
                  requestAnimationFrame(() => {
                    pageScrollRef.current?.scrollTo({
                      y: Math.max(
                        0,
                        planSectionY.current + offsetY - spacing('lg'),
                      ),
                      animated: true,
                    });
                  });
                }}
              />
            </View>
          ) : dailyPlanLoadStatus === 'unavailable' ? (
            <View style={styles.preparingPlan}>
              <Text style={styles.preparingText}>
                {t('today.plan_unavailable')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('feeling_checkin.try_again')}
                onPress={() => {
                  setDailyPlanLoadStatus('loading');
                  refreshToday().catch(() => {
                    setDailyPlan(null);
                    setDailyPlanLoadStatus('unavailable');
                  });
                }}
                style={styles.retryPlanButton}
              >
                <FontAwesomeIcon
                  icon={faRotateRight}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.retryPlanButtonText}>
                  {t('feeling_checkin.try_again')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.preparingPlan}>
              <Text style={styles.preparingText}>
                {t('today.preparing_plan')}
              </Text>
            </View>
          )}

          {dailyPlanLoadStatus !== 'needsInput' ? (
            <ImprovePlanView
              prompts={improvePlanPrompts}
              onOpenProfile={onNavigateToProfile}
            />
          ) : null}

          <EveningWindDown date={date} identity={identity} />
          {shouldShowPostPlanAd({
            totalTasks,
            doneTasks,
            dailyWinVisible: showDailyWin,
            hasMedicalAlert: medicalSafetyAlerts.length > 0,
          }) ? (
            <InlineAd date={date} identity={identity} />
          ) : null}
        </ScrollView>

        <TodayQuickCheckInSheet
          visible={quickCheckInKind !== null}
          kind={quickCheckInKind}
          experience={checkIn}
          identity={identity}
          date={date}
          onClose={closeQuickCheckIn}
          onSaved={refreshToday}
          onOpenHistory={() => {
            closeQuickCheckIn();
            onNavigateToSymptomsHistory?.();
          }}
        />

        <BottomSheet
          visible={detailSheet !== null}
          onClose={closeDetailSheet}
          showHandle
        >
          <View
            accessibilityViewIsModal
            accessibilityLabel={
              detailSheet === 'snapshot'
                ? t('today.mother_and_baby_status')
                : t('today.risks_and_exposure')
            }
            style={styles.sheet}
          >
            {renderSheetHeader(
              detailSheet === 'snapshot'
                ? t('today.mother_and_baby_status')
                : t('today.risks_and_exposure'),
            )}
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator
              nestedScrollEnabled
            >
              {detailSheet === 'snapshot' ? (
                <View
                  style={[
                    styles.recordedSymptoms,
                    warningSymptoms.length > 0 &&
                      styles.recordedSymptomsWarning,
                  ]}
                >
                  <View style={styles.recordedSymptomsHeader}>
                    <FontAwesomeIcon
                      icon={
                        warningSymptoms.length > 0
                          ? faTriangleExclamation
                          : faCheck
                      }
                      size={15}
                      color={
                        warningSymptoms.length > 0
                          ? '#B93838'
                          : theme.colors.orange500
                      }
                    />
                    <Text style={styles.recordedSymptomsTitle}>
                      {t('today.todays_reported_symptoms')}
                    </Text>
                  </View>
                  {selectedMommySymptoms.length > 0 ? (
                    selectedMommySymptoms.map(item => (
                      <Text key={item.key} style={styles.recordedSymptomRow}>
                        • {item.name}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.recordedSymptomRow}>
                      {t('today.no_symptoms_reported')}
                    </Text>
                  )}
                  {warningSymptoms.length > 0 ? (
                    <Text style={styles.symptomWarningNote}>
                      {t('feeling_checkin.warning_note')}
                    </Text>
                  ) : null}
                  {onNavigateToSymptomsHistory ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        setDetailSheet(null);
                        setTimeout(() => onNavigateToSymptomsHistory(), 180);
                      }}
                      style={styles.historyButton}
                    >
                      <Text style={styles.historyButtonText}>
                        {t('today.view_symptom_history')}
                      </Text>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        size={10}
                        color={theme.colors.orange600}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              {detailSheet === 'snapshot' ? (
                <>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <FontAwesomeIcon
                        icon={faHeart}
                        size={17}
                        color={statusColor(motherStatus)}
                      />
                    </View>
                    <View style={styles.detailCopy}>
                      <Text style={styles.detailLabel}>
                        {t('today.mother')}
                      </Text>
                      <Text style={styles.detailText}>
                        {t(
                          isPresentationMotherBabyContext
                            ? 'today.mother_context'
                            : 'today.mother_risk_change',
                        )}
                      </Text>
                    </View>
                    {!isPresentationMotherBabyContext ? (
                      <Text style={styles.detailValue}>
                        {formatRiskDelta(summary?.risks_delta?.mom)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <FontAwesomeIcon
                        icon={faBaby}
                        size={18}
                        color={statusColor(babyStatus)}
                      />
                    </View>
                    <View style={styles.detailCopy}>
                      <Text style={styles.detailLabel}>{t('today.baby')}</Text>
                      <Text style={styles.detailText}>
                        {t(
                          isPresentationMotherBabyContext
                            ? 'today.baby_context'
                            : 'today.baby_risk_change',
                          { week: currentWeek },
                        )}
                      </Text>
                    </View>
                    {!isPresentationMotherBabyContext ? (
                      <Text style={styles.detailValue}>
                        {formatRiskDelta(summary?.risks_delta?.baby)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <FontAwesomeIcon
                        icon={faCheck}
                        size={15}
                        color="#2D7B46"
                      />
                    </View>
                    <View style={styles.detailCopy}>
                      <Text style={styles.detailLabel}>
                        {t('today.protection_progress_title')}
                      </Text>
                      <Text style={styles.detailText}>
                        {hasRiskImpactProgress
                          ? t('today.risk_impact_progress_detail', {
                              applied: formatSignedPercent(completedRiskImpact),
                              total: formatSignedPercent(totalRiskImpact),
                            })
                          : t('today.actions_completed_summary', {
                              completed: doneTasks,
                              total: totalTasks,
                            })}
                      </Text>
                    </View>
                    <Text style={styles.detailValue}>{protectionPct}%</Text>
                  </View>
                </>
              ) : null}
              {detailSheet === 'risks' ? (
                <ExposureTrendView points={exposureTrend} />
              ) : null}
            </ScrollView>
          </View>
        </BottomSheet>

        <BottomSheet
          visible={showConnectionSheet}
          onClose={() => setShowConnectionSheet(false)}
          showHandle
        >
          <View accessibilityViewIsModal style={styles.connectionSheet}>
            <Text style={styles.connectionTitle}>
              {t('today.connection_issue_title')}
            </Text>
            <Text style={styles.connectionBody}>
              {t('today.connection_issue_body')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setShowConnectionSheet(false);
                refreshToday().catch(() => {
                  setIsDashboardLoading(false);
                  setShowConnectionSheet(true);
                });
              }}
              style={styles.connectionRetry}
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.connectionRetryText}>
                {t('feeling_checkin.try_again')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowConnectionSheet(false)}
              style={styles.connectionClose}
            >
              <Text style={styles.connectionCloseText}>
                {t('common.close')}
              </Text>
            </Pressable>
          </View>
        </BottomSheet>

        <AccessLocationBottomSheet
          visible={showLocationSheet}
          onClose={handleLocationDecline}
          onAllow={handleLocationAllow}
          onNotNow={handleLocationDecline}
        />

      </SafeAreaView>
    );
  },
);
