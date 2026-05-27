import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { BIRTHDAY_SVG, SUN_SVG, CLOUD_SVG } from '../utils/svgIcons';
import { WeekCycleView, MainHeader, FloatingActionButton, AccessLocationBottomSheet, OEMAutostartGuide } from '../components/ui';
import { detectOEM, needsAutostartGuide, wasAutostartGuideShown } from '../services/tracking/OEMAutostartHelper';
import { storage as appStorage } from '../store/useAuthStore';
import { SummaryService, SummaryResponse } from '../services/api/SummaryService';
import { ProfileService } from '../services/api/ProfileService';
import { WEEK_DESCRIPTIONS } from '../data/weekDescriptions';
import { useTasksStore } from '../store/useTasksStore';
import { computeCircleIconsForWeek } from '../data/babySystems';
import { locationTracker } from '../services/tracking/LocationTracker';
import { backgroundSync } from '../services/sync/BackgroundSync';
import { scheduleNotifications } from '../services/notifications/NotificationScheduler';

const SUN_SIZE = 52;
const CLOUD_SIZE = 32;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_PADDING = 16 * 2;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING;
const CARD_HEIGHT = CARD_WIDTH * 0.55;
const ICON_SIZE = CARD_WIDTH * 0.20; // icon circle
const NOTCH_DEPTH = ICON_SIZE * 0.7; // notch depth - creates gap

const getOrdinalSuffix = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

const HEADER_MARGIN_TOP = ICON_SIZE / 2;
const HEADER_MARGIN_BOTTOM = spacing('lg');
const HEADER_CARD_MARGIN_TOP = 24;
const HEADER_BUTTON_MARGIN_BOTTOM = 32;
const WEEK_ITEM_MARGIN_BOTTOM = spacing('lg');
// Extra scroll offset so the active week card sits a bit higher (circle + days clearly in view).
const WEEK_CARD_TEXT_SECTION_HEIGHT = 390;

interface HomeScreenProps {
  onNavigateToToday?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToBabyStatus?: () => void;
  onNavigateToBabyTwin?: () => void;
  onNavigateToPlanBirthday?: () => void;
  onNavigateToDebugLogs?: () => void;
}

interface WeekData {
  id: string;
  title: string;
  description: string;
  centerImage?: any;
  circleIcons?: Array<{ index: number; iconPath?: string; percentage?: number }>;
  weekDays: Array<{
    day: string;
    icons: Array<'heart' | 'basket' | 'running'>;
    isActive?: boolean;
    activeIcons?: Array<'heart' | 'basket' | 'running'>;
    isMissed?: boolean;
    isStartDay?: boolean;
  }>;
}

// Week image mapping
const WEEK_IMAGES: Record<number, any> = {
  2: require('../assets/weeks/week2.png'),
  3: require('../assets/weeks/week3.png'),
  4: require('../assets/weeks/week4.png'),
  5: require('../assets/weeks/week5.png'),
  6: require('../assets/weeks/week6.png'),
  7: require('../assets/weeks/week7.png'),
  8: require('../assets/weeks/week8.png'),
  9: require('../assets/weeks/week9.png'),
  10: require('../assets/weeks/week10.png'),
};

function getWeekImage(weekNum: number): any | undefined {
  if (weekNum <= 1) return undefined;
  if (weekNum <= 9) return WEEK_IMAGES[weekNum];
  return WEEK_IMAGES[10];
}

const DEFAULT_WEEK_DAYS = [
  { day: 'Mon', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isActive: false, activeIcons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'> },
  { day: 'Tue', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isStartDay: false },
  { day: 'Wed', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isActive: false, activeIcons: ['basket'] as Array<'heart' | 'basket' | 'running'> },
  { day: 'Thu', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isActive: false, activeIcons: ['heart', 'basket'] as Array<'heart' | 'basket' | 'running'> },
  { day: 'Fri', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isMissed: false },
  { day: 'Sat', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isActive: false },
  { day: 'Sun', icons: ['heart', 'basket', 'running'] as Array<'heart' | 'basket' | 'running'>, isActive: false },
];

// Week data array - dynamically generated with descriptions and baby system circle icons
export const WEEKS_DATA: WeekData[] = Array.from({ length: 40 }, (_, i) => {
  const weekNum = i + 1;
  const suffix = getOrdinalSuffix(weekNum);
  const circleIcons = weekNum >= 3 ? computeCircleIconsForWeek(weekNum) : undefined;
  return {
    id: String(weekNum),
    title: `${weekNum}${suffix} Week`,
    description: WEEK_DESCRIPTIONS[weekNum] || 'Your baby continues to grow and develop.',
    centerImage: getWeekImage(weekNum),
    ...(circleIcons && circleIcons.length > 0 ? { circleIcons } : {}),
    weekDays: DEFAULT_WEEK_DAYS.map(d => ({ ...d })),
  };
});

// Memoize SVG components to prevent unnecessary re-renders
const SunSVG = React.memo(() => (
  <SvgXml xml={SUN_SVG} width={SUN_SIZE} height={SUN_SIZE} />
));

const CloudSVG = React.memo(({ size }: { size: number }) => (
  <SvgXml xml={CLOUD_SVG} width={size} height={size} />
));

function HomeTopDecorations() {
  const sunRotation = useSharedValue(0);
  const cloud1TranslateX = useSharedValue(0);
  const cloud2TranslateX = useSharedValue(0);
  const cloud3TranslateX = useSharedValue(0);

  useEffect(() => {
    sunRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      true
    );
    cloud1TranslateX.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      true
    );
    cloud2TranslateX.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      true
    );
    cloud3TranslateX.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      true
    );
    // Cancel infinite loops on unmount — prevents UI-thread leaks across navigation
    return () => {
      cancelAnimation(sunRotation);
      cancelAnimation(cloud1TranslateX);
      cancelAnimation(cloud2TranslateX);
      cancelAnimation(cloud3TranslateX);
    };
  }, [sunRotation, cloud1TranslateX, cloud2TranslateX, cloud3TranslateX]);

  const sunAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sunRotation.value}deg` }],
  }));

  const cloud1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud1TranslateX.value * 200 }],
  }));

  const cloud2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud2TranslateX.value * 180 }],
  }));

  const cloud3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud3TranslateX.value * 190 }],
  }));

  return (
    <View style={topDecoStyles.container} pointerEvents="none">
      <Animated.View
        style={[topDecoStyles.sunContainer, sunAnimatedStyle]}
        shouldRasterizeIOS={true}
        renderToHardwareTextureAndroid={true}
      >
        <SunSVG />
      </Animated.View>
      <Animated.View style={[topDecoStyles.cloud1, cloud1AnimatedStyle]}>
        <CloudSVG size={CLOUD_SIZE} />
      </Animated.View>
      <Animated.View style={[topDecoStyles.cloud2, cloud2AnimatedStyle]}>
        <CloudSVG size={CLOUD_SIZE * 0.85} />
      </Animated.View>
      <Animated.View style={[topDecoStyles.cloud3, cloud3AnimatedStyle]}>
        <CloudSVG size={CLOUD_SIZE * 0.7} />
      </Animated.View>
    </View>
  );
}

const topDecoStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0.5,
    overflow: 'hidden',
  },
  sunContainer: {
    position: 'absolute',
    top: 120,
    right: 24,
    opacity: 0.65,
  },
  cloud1: {
    position: 'absolute',
    top: 100,
    right: SCREEN_WIDTH * 0.15,
    opacity: 0.5,
  },
  cloud2: {
    position: 'absolute',
    top: 180,
    right: -30,
    opacity: 0.4,
  },
  cloud3: {
    position: 'absolute',
    top: 140,
    right: SCREEN_WIDTH * 0.2,
    opacity: 0.35,
  },
});

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToToday, onNavigateToProfile, onNavigateToBabyStatus, onNavigateToBabyTwin, onNavigateToPlanBirthday, onNavigateToDebugLogs }) => {
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);

  // Active week state - can be loaded from storage (MMKV) on mount
  // Example with MMKV:
  // import { MMKV } from 'react-native-mmkv';
  // const storage = new MMKV();
  // const [activeWeek, setActiveWeek] = useState<number>(() => {
  //   const saved = storage.getNumber('activeWeek');
  //   return saved && saved >= 1 && saved <= 40 ? saved : 1;
  // });
  const { profile } = useUserStore();
  const tasks = useTasksStore(s => s.tasks);
  const fetchTasks = useTasksStore(s => s.fetchTasks);
  const [activeWeek, setActiveWeek] = useState<number>(profile.pregnancyWeek || 1);
  const [weeksData, setWeeksData] = useState<WeekData[]>(WEEKS_DATA);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [headerHeight, setHeaderHeight] = useState(350);
  const [weekItemHeight, setWeekItemHeight] = useState(600);
   const [isTodayLoading, setIsTodayLoading] = useState(false);

  // OEM autostart guide is no longer auto-shown here — the 3-second timer
  // raced with permission dialogs / FGS startup on OPPO/MIUI and tore down
  // the JS bridge. The modal is now opened from a button in the Profile screen.
  const totalWeeks = weeksData.length;

  // v25: bisect identified MotionGate.start (Activity Recognition Transition API)
  // as the crash source on customer device. MotionGate now disabled at source
  // (MotionGate.ts MOTION_GATE_DISABLED). Tracker + sync + notif scheduling are
  // safe to re-enable.
  useEffect(() => {
    fetchTasks();
    backgroundSync.init().catch((err: any) =>
      console.warn('[HomeScreen] Background sync failed to init:', err)
    );
    scheduleNotifications().catch((err: any) =>
      console.warn('[HomeScreen] Notification scheduling failed:', err)
    );
    const firstSync = setTimeout(() => {
      backgroundSync.performSync().catch((err: any) =>
        console.warn('[HomeScreen] Initial sync failed:', err)
      );
    }, 60000);
    const periodicSync = setInterval(() => {
      backgroundSync.performSync().catch((err: any) =>
        console.warn('[HomeScreen] Periodic sync failed:', err)
      );
    }, 15 * 60 * 1000);
    return () => {
      clearTimeout(firstSync);
      clearInterval(periodicSync);
    };
  }, []);

  // Tracker startup flow:
  //   1) On first eligible mount, show educational bottom sheet (one-shot, gated by
  //      MMKV flag) so the user understands why we ask for location BEFORE the
  //      system dialog appears with the Always/While-using-app choice.
  //   2) After they tap Allow we call startTracking() — which requests fine perms,
  //      then on Android 11+ deep-links to Settings for ACCESS_BACKGROUND_LOCATION.
  //   3) Once the tracker is up, on aggressive OEMs (Xiaomi/Oppo/Vivo/Huawei) show
  //      the autostart guide once per device.
  const LOCATION_INTRO_KEY = 'location_intro_shown_v1';
  const trackingStartedRef = useRef(false);
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [oemGuideVisible, setOemGuideVisible] = useState(false);

  const startTrackerAndMaybeShowOEM = useCallback(() => {
    if (trackingStartedRef.current) return;
    trackingStartedRef.current = true;
    locationTracker
      .startTracking()
      .then(() => {
        const vendor = detectOEM();
        if (needsAutostartGuide(vendor) && !wasAutostartGuideShown()) {
          setOemGuideVisible(true);
        }
      })
      .catch((err: any) =>
        console.warn('[HomeScreen] Location tracking failed to start:', err),
      );
  }, []);

  useEffect(() => {
    if (trackingStartedRef.current) return;
    if (!profile.agreementAccepted) return;
    const introShown = appStorage.getBoolean(LOCATION_INTRO_KEY) === true;
    if (!introShown) {
      setLocationSheetVisible(true);
      return;
    }
    startTrackerAndMaybeShowOEM();
  }, [profile.agreementAccepted, startTrackerAndMaybeShowOEM]);

  const handleLocationAllow = useCallback(() => {
    appStorage.set(LOCATION_INTRO_KEY, true);
    setLocationSheetVisible(false);
    startTrackerAndMaybeShowOEM();
  }, [startTrackerAndMaybeShowOEM]);

  const handleLocationNotNow = useCallback(() => {
    // Mark shown so we don't pester on every Home mount. Watchdog effect will
    // pick up the lack of tracker mode and won't restart since startTracking
    // was never called. User can re-trigger from Profile if/when we add a CTA.
    appStorage.set(LOCATION_INTRO_KEY, true);
    setLocationSheetVisible(false);
  }, []);

  // Tracker watchdog: every 5 min, restart if fully stopped.
  // Cap at 3 consecutive failures to avoid permission-prompt spam loops.
  const watchdogFailuresRef = useRef(0);
  useEffect(() => {
    if (!profile.agreementAccepted) return;
    const watchdog = setInterval(() => {
      if (locationTracker.isPermissionPermanentlyDenied()) return;
      if (watchdogFailuresRef.current >= 3) return;
      if (locationTracker.getMode() === 'stopped') {
        locationTracker.startTracking()
          .then(() => {
            if (locationTracker.getMode() === 'stopped') {
              watchdogFailuresRef.current += 1;
            } else {
              watchdogFailuresRef.current = 0;
            }
          })
          .catch(() => { watchdogFailuresRef.current += 1; });
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(watchdog);
  }, [profile.agreementAccepted]);

  // Fetch API Data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [summary, userProfile] = await Promise.all([
          SummaryService.getSummary(),
          ProfileService.getProfile()
        ]);

        if (mounted) {
          setSummaryData(summary);

          // Update active week (API field is week_of_pregnancy, not current_pregnancy_week)
          const apiWeek = summary.week_info?.week || userProfile.week_of_pregnancy || activeWeek;
          setActiveWeek(Math.max(1, Math.min(40, apiWeek)));

          // Update Weeks Data with API content
          const updatedWeeksData = [...WEEKS_DATA];
          const weekIndex = apiWeek - 1;

          if (updatedWeeksData[weekIndex]) {
            // Update description
            if (summary.week_info?.text) {
              updatedWeeksData[weekIndex] = {
                ...updatedWeeksData[weekIndex],
                description: summary.week_info.text
              };
            }

            // Build set of dates with activity (daily_checkins OR task_completions)
            const formatLocalDate = (d: Date) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${dd}`;
            };
            const activeDates = new Set<string>(summary.daily_checkins || []);
            (summary.task_completions || []).forEach((day: { date: string; tasks: string[] }) => {
              if (day.tasks?.length > 0) activeDates.add(day.date);
            });

            // Build a per-date map of which icon categories have any completed task.
            // Task type ('diet' | 'activity' | 'behaviour') maps to the icon shown in
            // the day pill ('basket' | 'running' | 'heart' respectively).
            const taskTypeById = new Map(tasks.map(t => [t.id, t.type]));
            const typeToIcon: Record<string, 'heart' | 'basket' | 'running'> = {
              diet: 'basket',
              activity: 'running',
              behaviour: 'heart',
            };
            const iconsByDate = new Map<string, Set<'heart' | 'basket' | 'running'>>();
            (summary.task_completions || []).forEach((day: { date: string; tasks: string[] }) => {
              const set = new Set<'heart' | 'basket' | 'running'>();
              day.tasks?.forEach((taskId: string) => {
                const type = taskTypeById.get(taskId);
                const icon = type ? typeToIcon[type] : undefined;
                if (icon) set.add(icon);
              });
              if (set.size > 0) iconsByDate.set(day.date, set);
            });

            // Use CURRENT calendar week (Mon-Sun) — works regardless of pregnancy_start_date.
            // This matches what the user sees in WeekCycleView (Mon, Tue, ..., Sun).
            const today = new Date();
            const todayJsDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
            const daysSinceMonday = todayJsDay === 0 ? 6 : todayJsDay - 1;
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - daysSinceMonday);
            weekStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const dayHistoryMap: Record<number, boolean> = {};
            const dayIconsMap: Record<number, Array<'heart' | 'basket' | 'running'>> = {};
            for (let d = 0; d < 7; d++) {
              const dayDate = new Date(weekStart);
              dayDate.setDate(weekStart.getDate() + d);
              if (dayDate > todayEnd) continue;
              const dateStr = formatLocalDate(dayDate);
              if (activeDates.has(dateStr)) {
                dayHistoryMap[d] = true;
              }
              const icons = iconsByDate.get(dateStr);
              if (icons && icons.size > 0) {
                dayIconsMap[d] = Array.from(icons);
              }
            }

            const updatedWeekDays = updatedWeeksData[weekIndex].weekDays.map((dayItem, dIndex) => {
              const hasHistory = !!dayHistoryMap[dIndex];
              const iconsForDay = dayIconsMap[dIndex];
              return {
                ...dayItem,
                isActive: hasHistory ? true : (dayItem.isActive || false),
                // Icons reflect which task categories were actually completed that day.
                // Fall back to ['running'] only when day has activity (e.g. GPS outdoor
                // exposure) but no task_completions — preserves prior behaviour.
                activeIcons: iconsForDay
                  ? iconsForDay
                  : hasHistory
                    ? (['running'] as ('heart' | 'basket' | 'running')[])
                    : dayItem.activeIcons,
              };
            });

            updatedWeeksData[weekIndex] = {
              ...updatedWeeksData[weekIndex],
              weekDays: updatedWeekDays
            };
          }
          setWeeksData(updatedWeeksData);
        }
      } catch (e) {
        console.error("Failed to fetch home data", e);
      }
    };
    fetchData();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get today's day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const getTodayDayOfWeek = useCallback((): number => {
    const today = new Date();
    const dayIndex = today.getDay();
    // Convert to our format: Monday = 0, Tuesday = 1, ..., Sunday = 6
    return dayIndex === 0 ? 6 : dayIndex - 1;
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
      paddingTop: spacing('lg'),
    },
    birthdayCardWrapper: {
      marginTop: HEADER_MARGIN_TOP,
      marginBottom: HEADER_MARGIN_BOTTOM,
      alignItems: 'center',
    },
    birthdayCardContainer: {
      position: 'relative',
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      marginTop: HEADER_CARD_MARGIN_TOP,
    },
    iconCircleContainer: {
      position: 'absolute',
      top: -ICON_SIZE / 1.5,
      left: (CARD_WIDTH - ICON_SIZE) / 2,
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2,
      backgroundColor: '#FF9A88',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20,
      elevation: 8,
    },
    cardOverlay: {
      position: 'absolute',
      top: NOTCH_DEPTH + 20,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing('lg'),
    },
    textContainer: {
      alignItems: 'center',
      marginBottom: spacing('md'),
    },
    title: {
      fontSize: CARD_WIDTH * 0.06,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: spacing('xs'),
    },
    subtitle: {
      fontSize: CARD_WIDTH * 0.04,
      fontFamily: theme.typography.fontFamily.regular,
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: CARD_WIDTH * 0.055,
      opacity: 0.95,
    },
    planButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 30,
      paddingVertical: 14,
      paddingHorizontal: 36,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginBottom: HEADER_BUTTON_MARGIN_BOTTOM
    },
    planButtonText: {
      color: theme.colors.orange500,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      textAlign: 'center',
    },
    weekItem: {
      marginBottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column-reverse',
    },
    loadingOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      backgroundColor: '#fff',
      borderRadius: spacing('md'),
      paddingVertical: spacing('lg'),
      paddingHorizontal: spacing('xl'),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    loadingText: {
      marginTop: spacing('sm'),
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    fixedBackground: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT / 1.5,
      zIndex: 0,
      opacity: 0.25,
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
    },
  }), [theme]);

  // Memoize the header component
  const handleHeaderLayout = useCallback((event: any) => {
    const height = event?.nativeEvent?.layout?.height ?? 0;
    if (height > 0 && height !== headerHeight) {
      setHeaderHeight(height);
    }
  }, [headerHeight]);

  const handleWeekItemLayout = useCallback((event: any) => {
    const height = event?.nativeEvent?.layout?.height ?? 0;
    if (height > 0 && height !== weekItemHeight) {
      setWeekItemHeight(height);
    }
  }, [weekItemHeight]);

  const renderHeader = useCallback(() => (
    <View style={styles.birthdayCardWrapper} onLayout={handleHeaderLayout}>
      <View style={styles.birthdayCardContainer}>
        {/* SVG Background with curved top */}
        <Svg width={CARD_WIDTH} height={CARD_HEIGHT} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFB86A" />
              <Stop offset="50%" stopColor="#FF9045" />
              <Stop offset="100%" stopColor="#FF6D5C" />
            </LinearGradient>
          </Defs>
          <Path
            d={`
              M 20 0
              L ${CARD_WIDTH * 0.3} 0
              C ${CARD_WIDTH * 0.35} 0, ${CARD_WIDTH * 0.38} ${NOTCH_DEPTH * 0.1}, ${CARD_WIDTH * 0.42} ${NOTCH_DEPTH * 0.5}
              C ${CARD_WIDTH * 0.45} ${NOTCH_DEPTH * 0.9}, ${CARD_WIDTH * 0.55} ${NOTCH_DEPTH * 0.9}, ${CARD_WIDTH * 0.58} ${NOTCH_DEPTH * 0.5}
              C ${CARD_WIDTH * 0.62} ${NOTCH_DEPTH * 0.1}, ${CARD_WIDTH * 0.65} 0, ${CARD_WIDTH * 0.7} 0
              L ${CARD_WIDTH - 20} 0
              Q ${CARD_WIDTH} 0, ${CARD_WIDTH} 20
              L ${CARD_WIDTH} ${CARD_HEIGHT - 20}
              Q ${CARD_WIDTH} ${CARD_HEIGHT}, ${CARD_WIDTH - 20} ${CARD_HEIGHT}
              L 20 ${CARD_HEIGHT}
              Q 0 ${CARD_HEIGHT}, 0 ${CARD_HEIGHT - 20}
              L 0 20
              Q 0 0, 20 0
              Z
            `}
            fill="url(#cardGradient)"
          />
        </Svg>

        {/* Icon inside circle */}
        <View style={styles.iconCircleContainer}>
          <SvgXml xml={BIRTHDAY_SVG} width={ICON_SIZE * 0.55} height={ICON_SIZE * 0.65} />
        </View>

        {/* Card Content Overlay */}
        <View style={styles.cardOverlay}>
          <View style={styles.textContainer}>
            <Text style={styles.title} allowFontScaling={false}>Pick your baby's birthday</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Pregnancy cycle is over and now you{'\n'}can pick birth date
            </Text>
          </View>

          <TouchableOpacity style={styles.planButton} onPress={onNavigateToPlanBirthday} activeOpacity={0.7}>
            <Text style={styles.planButtonText} allowFontScaling={false}>Plan Birthday</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [styles, handleHeaderLayout, onNavigateToPlanBirthday]);

  const handleNavigateToToday = useCallback(() => {
    if (isTodayLoading) {
      return;
    }
    setIsTodayLoading(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        onNavigateToToday?.();
        // Give navigation a brief moment before hiding loader
        setTimeout(() => setIsTodayLoading(false), 200);
      }, 120);
    });
  }, [isTodayLoading, onNavigateToToday]);

  // Memoize the render function for week items
  // Reversed array: index 0 = week 40, index 39 = week 1
  const renderWeekItem: ListRenderItem<WeekData> = useCallback(({ item, index }) => {
    const weekNumber = totalWeeks - index;
    const isActiveWeek = weekNumber === activeWeek;

    // Compute today's day index once
    const todayDayIndex = getTodayDayOfWeek();

    // For all weeks, derive isStartDay and isMissed based on
    // activeWeek + today's day:
    // - All days in weeks before activeWeek => missed
    // - In activeWeek: days before today => missed, today => start
    // - Future weeks keep their original missed state
    const updatedWeekDays = item.weekDays.map((dayData, dayIndex) => {
      const isBeforeToday =
        weekNumber < activeWeek ||
        (weekNumber === activeWeek && dayIndex < todayDayIndex);

      const isStartDay = weekNumber === activeWeek && dayIndex === todayDayIndex;

      // If active (completed), it's not missed. Only missed if before today AND not active.
      const isMissed = dayData.isActive ? false : (isBeforeToday ? true : (dayData.isMissed || false));

      return {
        ...dayData,
        isStartDay,
        isMissed,
      };
    });

    // Calculate if this week should be reversed (alternating pattern)
    // In reversed array: week 40 is at index 0 (no reverse), week 39 is at index 1 (reverse), etc.
    const shouldReverse = index % 2 === 1;

    return (
      <View style={styles.weekItem} onLayout={index === 0 ? handleWeekItemLayout : undefined}>
        <WeekCycleView
          title={item.title}
          description={item.description}
          centerImage={item.centerImage}
          circleIcons={item.circleIcons}
          weekDays={updatedWeekDays}
          onStartPress={handleNavigateToToday}
          onImagePress={isActiveWeek ? (onNavigateToBabyTwin || onNavigateToBabyStatus) : undefined}
          isActive={isActiveWeek}
          reversed={shouldReverse}
        />
      </View>
    );
  }, [styles.weekItem, handleNavigateToToday, onNavigateToBabyStatus, handleWeekItemLayout, activeWeek, totalWeeks, getTodayDayOfWeek]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: WeekData) => item.id, []);

  // Reversed data for display (week 40 first, week 1 last)
  const reversedWeeksData = useMemo(() => [...weeksData].reverse(), [weeksData]);

  // Header badge counts: completed tasks per category for the week
  const headerCounts = useMemo(() => {
    const days = summaryData?.task_completions || [];
    const taskTypeMap = new Map(tasks.map(t => [t.id, t.type]));
    const counts = { diet: 0, activity: 0, behaviour: 0 };
    days.forEach((day: { date: string; tasks: string[] }) => {
      day.tasks?.forEach((taskId: string) => {
        const type = taskTypeMap.get(taskId);
        if (type) counts[type]++;
      });
    });
    return counts;
  }, [summaryData?.task_completions, tasks]);

  // In reversed array: index 0 = week 40, so activeWeek 2 => index 38
  const activeWeekIndex = useMemo(() => {
    return totalWeeks - activeWeek;
  }, [activeWeek, totalWeeks]);

  // Get item layout for accurate scrolling
  // Note: Heights are approximate and may need adjustment based on actual measurements
  const getItemLayout = useCallback((data: any, index: number) => {
    const headerExtra =
      HEADER_MARGIN_TOP +
      HEADER_MARGIN_BOTTOM +
      HEADER_CARD_MARGIN_TOP +
      HEADER_BUTTON_MARGIN_BOTTOM;
    const headerLength = headerHeight + headerExtra;
    const itemLength = weekItemHeight + WEEK_ITEM_MARGIN_BOTTOM;
    return {
      length: itemLength,
      offset: headerLength + itemLength * index,
      index,
    };
  }, [headerHeight, weekItemHeight]);

  // NOTE: We use initialScrollIndex on FlatList instead of scrollToIndex in useEffect.
  // scrollToIndex with approximate getItemLayout is unreliable and can fail silently.

  // Scroll to active week. Earlier attempts kept missing because:
  //   - onContentSizeChange fires once and races with `activeWeek` coming from the API
  //   - gating on "weekItemHeight !== 600" silently NEVER unblocks when first
  //     measurement happens to land at the default, or fires too early (before API)
  //     and then refuses to re-scroll once activeWeek updates from default 1 → real.
  // New approach: re-scroll any time the *active week* changes, until the user
  // interacts with the list manually. Uses scrollToIndex (consumes our existing
  // getItemLayout) with a small delay for virtualisation to settle. Each successful
  // scroll is recorded by `lastScrolledWeekRef` so we only re-scroll when the
  // target actually moves.
  const lastScrolledWeekRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const handleContentSizeChange = useCallback(() => { /* no-op */ }, []);
  const handleScrollBeginDrag = useCallback(() => {
    userInteractedRef.current = true;
  }, []);
  useEffect(() => {
    if (userInteractedRef.current) return;
    if (activeWeekIndex < 0 || activeWeekIndex >= totalWeeks) return;
    if (lastScrolledWeekRef.current === activeWeek) return;
    const t = setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          index: activeWeekIndex,
          animated: false,
          viewPosition: 0.15,
        });
        lastScrolledWeekRef.current = activeWeek;
      } catch {
        // onScrollToIndexFailed handler will retry via scrollToOffset.
      }
    }, 250);
    return () => clearTimeout(t);
  }, [activeWeek, activeWeekIndex, totalWeeks]);

  // Handle scroll to index errors
  const handleScrollToIndexFailed = useCallback((info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    const offset = info.averageItemLength * info.index;
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset, animated: false });
    }, 200);
  }, []);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedBackground}>
        <Image
          source={require('../assets/images/homeBackground.png')}
          style={{ width: SCREEN_HEIGHT / 1.5, height: '100%' }}
          resizeMode="contain"
        />
      </View>
      <HomeTopDecorations />
      <MainHeader
        weekNumber={`${activeWeek}${getOrdinalSuffix(activeWeek)} Week`}
        icons={[
          { type: 'food', count: headerCounts.diet },
          { type: 'exercise', count: headerCounts.activity },
          { type: 'heart', count: headerCounts.behaviour },
        ]}
        onProfilePress={onNavigateToProfile}
      />

      <FlatList
        ref={flatListRef}
        style={{ backgroundColor: 'transparent', flex: 1, zIndex: 1 }}
        data={reversedWeeksData}
        renderItem={renderWeekItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: spacing('xl') }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={3}
        onContentSizeChange={handleContentSizeChange}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        onScrollBeginDrag={handleScrollBeginDrag}
        updateCellsBatchingPeriod={100}
      />


      {/* FAB */}
      <FloatingActionButton
        onApply={(data: { moods: string[]; symptoms: string[]; waterAmount: number }) => {
          // Handle apply with data
          console.log('Applied data:', data);
        }}
      />

      <Modal
        visible={isTodayLoading}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.orange500} />
            <Text style={styles.loadingText} allowFontScaling={false}>
              Loading your day...
            </Text>
          </View>
        </View>
      </Modal>

      <AccessLocationBottomSheet
        visible={locationSheetVisible}
        onClose={handleLocationNotNow}
        onAllow={handleLocationAllow}
        onNotNow={handleLocationNotNow}
      />
      <OEMAutostartGuide
        visible={oemGuideVisible}
        onClose={() => setOemGuideVisible(false)}
      />
    </SafeAreaView>
  );
};
