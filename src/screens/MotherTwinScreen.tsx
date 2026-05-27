import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faLink, faChartLine, faChevronDown, faCheck, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, Rect } from 'react-native-svg';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { useTheme, spacing } from '../theme';
import { BackButton, BottomSheet, BottomSheetOption } from '../components/ui';
import { responsiveUtils } from '../utils/responsiveUtils';
import { useUserStore } from '../store/useUserStore';
import { SummaryService, type SummaryResponse } from '../services/api/SummaryService';
import { ProfileService } from '../services/api/ProfileService';
import { TaskCompletionService, type TaskCompletionDay } from '../services/api/TaskCompletionService';
import { WellbeingService, type WellbeingLogDay } from '../services/api/WellbeingService';
import { SymptomsService, type MommySymptomStatisticItem } from '../services/api/SymptomsService';
import { STAT_TAB_TO_CATEGORY, getTasksByCategory } from '../data/taskDefinitions';
import { useTasksStore } from '../store/useTasksStore';

const WEEK_OPTIONS = Array.from({ length: 40 }, (_, i) => i + 1);

// Tabs for statistics
const STAT_TABS = ['Nutrition', 'Protection', 'Activity'] as const;
type StatTab = typeof STAT_TABS[number];

// Pie chart data
const PIE_DATA = [
  { value: 50, color: '#4CAF50' }, // Green - nutrition
  { value: 25, color: '#64B5F6' }, // Blue - Monday
  { value: 25, color: '#FFB74D' }, // Orange - Tuesday
];

// Days data
const DAYS_DATA = [
  { day: 'Monday', color: '#64B5F6', progress: '1/3', completed: true },
  { day: 'Tuesday', color: '#FFB74D', progress: '2/5', completed: true },
];

// Symptoms tracker data
const SYMPTOM_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type SymptomDay = typeof SYMPTOM_DAYS[number];

// Color palette for symptom filters — cycled by index over API-returned symptoms.
const SYMPTOM_COLOR_PALETTE = ['#E8B4D8', '#F5E6A3', '#C5A3E8', '#A3E8D8', '#FFB6C1', '#87CEEB', '#98FB98', '#FFE4B5'];
const ALL_FILTER = { id: 'all', label: 'All', color: '' };
type SymptomFilter = { id: string; label: string; color: string };

// Stable palette for risk-group sectors (assigned by sorted risk_id order).
// Drop when backend adds `color` to MommySymptomStatisticItem.
const SYMPTOM_GROUP_COLORS = ['#E8B4D8', '#C5A3E8', '#A3E8D8', '#F5E6A3', '#FFB6C1', '#87CEEB', '#98FB98'];

interface MotherTwinScreenProps {
  onBack?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MotherTwinScreen: React.FC<MotherTwinScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const { profile } = useUserStore();
  const tasks = useTasksStore(s => s.tasks);
  const currentWeek = profile.pregnancyWeek || 1;
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(null);
  const [taskWeekData, setTaskWeekData] = useState<TaskCompletionDay[]>([]);
  const [wellbeingWeekData, setWellbeingWeekData] = useState<WellbeingLogDay[]>([]);
  const [symptomFilters, setSymptomFilters] = useState<SymptomFilter[]>([ALL_FILTER]);
  const [statsItems, setStatsItems] = useState<MommySymptomStatisticItem[]>([]);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const [activeSymptomFilter, setActiveSymptomFilter] = useState('all');
  const allWeeksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    SummaryService.getSummary()
      .then(setSummary)
      .catch((err) => console.warn('[MotherTwin] Failed to load summary:', err));

    ProfileService.getProfile()
      .then((data) => setPregnancyStartDate(data.pregnancy_start_date || null))
      .catch((err) => console.warn('[MotherTwin] Failed to load profile:', err));

    // Default → backend returns current week (Mon → today)
    TaskCompletionService.getCompletionsRange()
      .then((data) => setTaskWeekData(data.items || []))
      .catch((err) => console.warn('[MotherTwin] Failed to load tasks:', err));

    WellbeingService.getLogRange()
      .then((data) => setWellbeingWeekData(data.items || []))
      .catch((err) => console.warn('[MotherTwin] Failed to load wellbeing:', err));

    // Symptom filters come from the mommy checklist — backend returns only symptoms
    // that participate in risk calculation (per Igor). Tolerate either an array or a
    // wrapper object since the API shape isn't formalized yet.
    SymptomsService.getMommyChecklist()
      .then((data: any) => {
        const raw = Array.isArray(data) ? data : data?.symptoms || data?.items || [];
        const mapped: SymptomFilter[] = raw.map((s: any, i: number) => ({
          id: String(s.id ?? s.code ?? s.name ?? i),
          label: String(s.name ?? s.label ?? s.title ?? ''),
          color: SYMPTOM_COLOR_PALETTE[i % SYMPTOM_COLOR_PALETTE.length],
        })).filter((s: SymptomFilter) => s.label);
        setSymptomFilters([ALL_FILTER, ...mapped]);
      })
      .catch((err) => console.warn('[MotherTwin] Failed to load symptom checklist:', err));
  }, []);

  // Symptoms grouped by risk_id. Current week fetched once on mount; all-weeks
  // fetched separately when user presses Weeks. We never re-fetch current-week
  // data when pregnancy_start_date arrives — it doesn't affect the no-param call.
  useEffect(() => {
    SymptomsService.getMommyStatistics({})
      .then(setStatsItems)
      .catch((err) => console.warn('[MotherTwin] Failed to load symptom stats:', err));
  }, []);

  useEffect(() => () => {
    if (allWeeksTimerRef.current) clearTimeout(allWeeksTimerRef.current);
  }, []);

  const handleWeeksPress = useCallback(() => {
    if (showAllWeeks || !pregnancyStartDate) return;
    // Backend requires both start_date and end_date together (returns 400 otherwise).
    // "All weeks since pregnancy started" = pregnancy_start_date → today.
    const today = new Date();
    const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    SymptomsService.getMommyStatistics({ start_date: pregnancyStartDate, end_date: endDate })
      .then((items) => {
        setStatsItems(items);
        setShowAllWeeks(true);
        allWeeksTimerRef.current = setTimeout(() => {
          // Restore current-week view
          SymptomsService.getMommyStatistics({})
            .then(setStatsItems)
            .catch((err) => console.warn('[MotherTwin] Failed to reload current-week stats:', err));
          setShowAllWeeks(false);
          allWeeksTimerRef.current = null;
        }, 3500);
      })
      .catch((err) => console.warn('[MotherTwin] Failed to load all-weeks stats:', err));
  }, [showAllWeeks, pregnancyStartDate]);

  // Pie shows ALL groups regardless of pill selection. Filtering an aggregate-by-group
  // chart by a single symptom is semantically wrong (a symptom belongs to one group,
  // so "filter" = "show 1 slice"). Instead we highlight the owning slice of the picked
  // symptom and fade the rest. Tap "All" (or the same pill again) to clear.
  const symptomGroupData = useMemo(() => {
    const groups = new Map<number, { name: string; total: number }>();
    statsItems.forEach((item) => {
      const cur = groups.get(item.risk_id);
      if (cur) cur.total += item.quantity;
      else groups.set(item.risk_id, { name: item.risk_name, total: item.quantity });
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([risk_id, { name, total }], i) => ({
        risk_id,
        name,
        value: total,
        color: SYMPTOM_GROUP_COLORS[i % SYMPTOM_GROUP_COLORS.length],
      }));
  }, [statsItems]);

  // Map filter-pill id (= stringified symptom_id from the checklist) → its risk_id,
  // so we know which slice to emphasize. Falls back to null if the active symptom
  // never appears in this period's stats (then nothing is highlighted, full chart shown).
  const symptomToRiskId = useMemo(() => {
    const m = new Map<string, number>();
    statsItems.forEach((item) => m.set(String(item.symptom_id), item.risk_id));
    return m;
  }, [statsItems]);

  const highlightedRiskId =
    activeSymptomFilter === 'all' ? null : symptomToRiskId.get(activeSymptomFilter) ?? null;

  const pieDataForGroupChart = useMemo(
    () =>
      symptomGroupData.map((g) => ({
        value: g.value,
        // Hex + '55' alpha = ~33% opacity for non-matching slices when a pill is active.
        color:
          highlightedRiskId == null || g.risk_id === highlightedRiskId
            ? g.color
            : g.color + '55',
      })),
    [symptomGroupData, highlightedRiskId],
  );

  // Progress based on exposure level (0-8 scale → percentage)
  // Protection = inverse of exposure: lower exposure = higher protection
  // Show 0% until summary loads to avoid misleading "100% protected" on error/load states
  const progress = useMemo(() => {
    const level = summary?.mom_exposure?.exposure_level;
    if (typeof level !== 'number') return 0;
    return Math.round(Math.max(0, (1 - level / 8) * 100));
  }, [summary?.mom_exposure?.exposure_level]);

  const [activeTab, setActiveTab] = useState<StatTab>('Nutrition');
  const [activeSymptomDay, setActiveSymptomDay] = useState<SymptomDay>('Monday');
  const [statsWeek, setStatsWeek] = useState(currentWeek);
  const [symptomsWeek, setSymptomsWeek] = useState(currentWeek);
  const [statsWeekSheetVisible, setStatsWeekSheetVisible] = useState(false);
  const [symptomsWeekSheetVisible, setSymptomsWeekSheetVisible] = useState(false);

  // Format start date for display (DD/MM/YYYY)
  const startDateFormatted = useMemo(() => {
    if (!pregnancyStartDate) return '—';
    const [y, m, d] = pregnancyStartDate.split('-');
    return `${d}/${m}/${y}`;
  }, [pregnancyStartDate]);

  // Daily progress in active category (e.g., "Monday: 1/3")
  const dailyProgress = useMemo(() => {
    const category = STAT_TAB_TO_CATEGORY[activeTab];
    const categoryTasks = getTasksByCategory(tasks, category);
    const categoryTaskIds = new Set(categoryTasks.map(t => t.id));
    const totalPerDay = categoryTasks.length;

    const dayColors = ['#64B5F6', '#FFB74D', '#A3E8D8', '#E8B4D8', '#F5E6A3', '#C5A3E8', '#98FB98'];

    return taskWeekData.map((day, index) => {
      // Parse YYYY-MM-DD as LOCAL date (default Date(string) parses as UTC, shifting weekday in negative-UTC zones)
      const [y, m, d] = day.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const completedInCategory = day.tasks.filter(t => categoryTaskIds.has(t)).length;
      return {
        day: dayName,
        color: dayColors[index % dayColors.length],
        progress: `${completedInCategory}/${totalPerDay}`,
        completed: completedInCategory > 0,
      };
    });
  }, [taskWeekData, activeTab, tasks]);

  // Pie chart shows completed vs remaining for the active tab category
  const pieData = useMemo(() => {
    const category = STAT_TAB_TO_CATEGORY[activeTab];
    const taskTypeMap = new Map(tasks.map(t => [t.id, t.type]));
    let completed = 0;
    taskWeekData.forEach(day => {
      day.tasks.forEach(taskId => {
        if (taskTypeMap.get(taskId) === category) completed++;
      });
    });
    const tasksInCategory = tasks.filter(t => t.type === category).length;
    const total = tasksInCategory * 7; // tasks × 7 days

    if (total === 0 || completed === 0) {
      return [{ value: 1, color: '#E0E0E0' }];
    }

    const colorByCategory: Record<string, string> = {
      diet: '#4CAF50',
      activity: '#FFB74D',
      behaviour: '#64B5F6',
    };
    return [
      { value: completed, color: colorByCategory[category] || '#4CAF50' },
      { value: Math.max(0, total - completed), color: '#E0E0E0' },
    ];
  }, [taskWeekData, activeTab, tasks]);

  // Tracking percentage = days with at least one completed task / 7 (full week)
  const trackingPercent = useMemo(() => {
    const activeDays = taskWeekData.filter(d => d.tasks.length > 0).length;
    return Math.round((activeDays / 7) * 100);
  }, [taskWeekData]);

  // Symptom chart data: feelings + moods count per day
  const symptomChartData = useMemo(() => {
    if (!wellbeingWeekData.length) {
      return Array.from({ length: 7 }, () => ({ value: 0 }));
    }
    return wellbeingWeekData.map(d => ({
      value: (d.feelings?.length || 0) + (d.moods?.length || 0),
    }));
  }, [wellbeingWeekData]);

  // Total water for the week
  const weeklyWaterTotal = useMemo(() => {
    return wellbeingWeekData.reduce((sum, d) => sum + (d.water_amount || 0), 0);
  }, [wellbeingWeekData]);
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
      gap: spacing('sm'),
      marginBottom: spacing('md'),
    },
    statsTab: {
      paddingHorizontal: spacing('md'),
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
    symptomsWeekDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      borderRadius: 8,
      paddingHorizontal: spacing('sm'),
      paddingVertical: 6,
      marginBottom: spacing('md'),
    },
    symptomsWeekText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
      marginRight: spacing('xs'),
    },
    symptomsDayTabs: {
      flexDirection: 'row',
      marginBottom: spacing('md'),
    },
    symptomsDayTabsScroll: {
      flexDirection: 'row',
      gap: spacing('sm'),
    },
    symptomsDayTab: {
      paddingHorizontal: spacing('md'),
      paddingVertical: spacing('sm'),
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.neutral300,
      backgroundColor: '#fff',
    },
    symptomsDayTabActive: {
      backgroundColor: theme.colors.orange100,
      borderColor: theme.colors.orange500,
    },
    symptomsDayTabText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    symptomsDayTabTextActive: {
      color: theme.colors.orange500,
      fontFamily: theme.typography.fontFamily.bold,
    },
    symptomsChartContainer: {
      marginBottom: spacing('md'),
      overflow: 'hidden',
      borderRadius: 12,
    },
    symptomsTimeline: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 30,
      marginTop: spacing('sm'),
    },
    symptomsTimelineLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF5F5',
      paddingHorizontal: spacing('sm'),
      paddingVertical: 4,
      borderRadius: 8,
    },
    symptomsTimelineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FF6B6B',
      marginRight: 3,
    },
    symptomsTimelineBar: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.neutral200,
      borderRadius: 4,
      marginHorizontal: spacing('sm'),
      position: 'relative',
    },
    symptomsTimelineProgress: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '60%',
      backgroundColor: '#FFB74D',
      borderRadius: 4,
    },
    symptomsTimelineSun: {
      position: 'absolute',
      left: '50%',
      top: -4,
    },
    symptomsTimelineMarker: {
      position: 'absolute',
      right: '30%',
      bottom: 0,
      alignItems: 'center',
      width: 24,
      marginRight: -12,
    },
    symptomsTimelineMarkerTriangle: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: theme.colors.orange500,
    },
    symptomsTimelineMarkerLine: {
      width: 2,
      height: 24,
      backgroundColor: theme.colors.orange500,
      alignSelf: 'center',
    },
    symptomsTimelineMarkerDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.orange500,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    symptomsTimelineMarkerText: {
      fontSize: 10,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#fff',
    },
    symptomsFilters: {
      marginTop: spacing('md'),
    },
    symptomsFiltersContent: {
      paddingHorizontal: spacing('xs'),
      gap: spacing('md'),
    },
    symptomsFilterItem: {
      alignItems: 'center',
      width: 76,
    },
    symptomsFilterCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginBottom: spacing('xs'),
      justifyContent: 'center',
      alignItems: 'center',
    },
    symptomsFilterCircleActive: {
      borderWidth: 2,
      borderColor: theme.colors.orange500,
    },
    symptomsFilterLabel: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 2,
    },
    symptomsFilterLabelActive: {
      color: theme.colors.orange500,
      fontFamily: theme.typography.fontFamily.bold,
    },
    // Symptoms-by-group pie chart section
    groupStatsSection: {
      marginTop: spacing('md'),
      paddingTop: spacing('md'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.neutral200,
    },
    groupStatsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing('md'),
    },
    groupStatsTitle: {
      flex: 1,
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    weeksToggle: {
      paddingHorizontal: spacing('md'),
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.orange500,
      backgroundColor: '#fff',
    },
    weeksToggleActive: {
      backgroundColor: theme.colors.orange100,
    },
    weeksToggleDisabled: {
      opacity: 0.4,
    },
    weeksToggleText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.orange500,
    },
    groupStatsPieWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing('md'),
    },
    groupStatsLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('sm'),
    },
    groupStatsLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    groupStatsLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    groupStatsLegendText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
    groupStatsEmpty: {
      paddingVertical: spacing('lg'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    groupStatsEmptyText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing('md'),
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>Mother Twin</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing('md') }}
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
            <Text style={styles.percentageText} allowFontScaling={false}>{progress}%</Text>
          </View>
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
            <Text style={styles.infoText} allowFontScaling={false}>start Date: {startDateFormatted}</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.infoIcon}>
              <View style={styles.infoIconCircle} />
            </View>
            <Text style={styles.infoText} allowFontScaling={false}>Tracking: {trackingPercent}%</Text>
          </View>
        </View>

        {/* Badges Container */}
        <View style={styles.badgesContainer}>
          {/* Badge Card — hidden until backend provides badges API and accrual logic. */}
          {false && (
          <View style={styles.badgeCard}>
            <View style={styles.badgeCardContent}>
              <View style={styles.badgeImageContainer}>
                <Image
                  source={require('../assets/images/motherBadge.png')}
                  style={styles.badgeImage}
                />
              </View>

              <View style={styles.badgeContentRight}>
                <View style={styles.badgeTitleRow}>
                  <Text style={styles.badgeCardTitle} allowFontScaling={false}>Your Badges</Text>
                  <View style={styles.badgeAmountContainer}>
                    <Text style={styles.badgeAmountText} allowFontScaling={false}>2$</Text>
                  </View>
                </View>

                <View style={styles.badgeButtonsContainer}>
                  <TouchableOpacity
                    style={styles.badgeButton}
                    activeOpacity={0.7}
                  >
                    <FontAwesomeIcon
                      icon={faLink as any}
                      size={16}
                      color={theme.colors.textPrimary}
                      style={styles.badgeButtonIcon}
                    />
                    <Text style={styles.badgeButtonText} allowFontScaling={false}>Copy link</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.badgeButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.badgeButtonText} allowFontScaling={false}>Share on</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          )}

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
              <Text style={styles.statsHeaderTitle} allowFontScaling={false}>Stats On Active Actions</Text>
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
                <Text style={styles.statsDateText} allowFontScaling={false}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</Text>
              </View>

              <TouchableOpacity
                style={styles.statsWeekDropdown}
                activeOpacity={0.7}
                onPress={() => setStatsWeekSheetVisible(true)}
              >
                <Text style={styles.statsWeekText} allowFontScaling={false}>Week {statsWeek}</Text>
                <FontAwesomeIcon 
                  icon={faChevronDown as any} 
                  size={12} 
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.statsTabs}>
              {STAT_TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.statsTab,
                    activeTab === tab && styles.statsTabActive,
                  ]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.statsTabText,
                    activeTab === tab && styles.statsTabTextActive,
                  ]} allowFontScaling={false}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chart Container */}
            <View style={styles.statsChartContainer}>
              {/* Chart Header */}
              <View style={styles.statsChartHeader}>
                <View style={styles.statsChartIcon}>
                  <View style={styles.statsChartIconInner} />
                </View>
                <Text style={styles.statsChartTitle} allowFontScaling={false}>{activeTab}</Text>
              </View>

              {/* Pie Chart */}
              <View style={styles.statsChartWrapper}>
                <PieChart
                  data={pieData}
                  radius={80}
                  donut={false}
                  showText={false}
                  focusOnPress={false}
                />
              </View>

              {/* Legend */}
              <View style={styles.statsLegend}>
                <View style={styles.statsLegendDot} />
                <Text style={styles.statsLegendText} allowFontScaling={false}>nutrition</Text>
              </View>
            </View>

            {/* Days Progress */}
            {dailyProgress.map((day, index) => (
              <View
                key={day.day}
                style={[
                  styles.statsDayRow,
                  index === dailyProgress.length - 1 && styles.statsDayRowLast,
                ]}
              >
                <View style={[styles.statsDayDot, { backgroundColor: day.color }]} />
                <Text style={styles.statsDayName} allowFontScaling={false}>{day.day}</Text>
                <Text style={styles.statsDayProgress} allowFontScaling={false}>{day.progress}</Text>
                {day.completed && (
                  <View style={styles.statsDayCheck}>
                    <FontAwesomeIcon 
                      icon={faCheck as any} 
                      size={14} 
                      color="#fff"
                    />
                  </View>
                )}
              </View>
            ))}
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
              <Text style={styles.symptomsHeaderTitle} allowFontScaling={false}>weekly Feelings Tracker</Text>
            </View>

            {/* Description */}
            <Text style={styles.symptomsDescription} allowFontScaling={false}>
              Your feelings are slightly improving this week. Today your fatigue is lower than yesterday.
            </Text>

            {/* Week Dropdown */}
            <TouchableOpacity
              style={styles.symptomsWeekDropdown}
              activeOpacity={0.7}
              onPress={() => setSymptomsWeekSheetVisible(true)}
            >
              <Text style={styles.symptomsWeekText} allowFontScaling={false}>Week {symptomsWeek}</Text>
              <FontAwesomeIcon 
                icon={faChevronDown as any} 
                size={12} 
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>

            {/* Day Tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.symptomsDayTabs}
              contentContainerStyle={styles.symptomsDayTabsScroll}
            >
              {SYMPTOM_DAYS.slice(0, 4).map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.symptomsDayTab,
                    activeSymptomDay === day && styles.symptomsDayTabActive,
                  ]}
                  onPress={() => setActiveSymptomDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.symptomsDayTabText,
                    activeSymptomDay === day && styles.symptomsDayTabTextActive,
                  ]} allowFontScaling={false}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Area Chart — single real series of mood+feelings count per day */}
            <View style={styles.symptomsChartContainer}>
              <LineChart
                data={symptomChartData}
                width={Dimensions.get('window').width - 80}
                height={180}
                curved
                areaChart
                hideDataPoints
                hideYAxisText
                hideAxesAndRules
                color1="#C5A3E8"
                startFillColor1="#C5A3E880"
                endFillColor1="#C5A3E820"
                initialSpacing={0}
                endSpacing={0}
                thickness={2}
              />

              {/* Timeline — hidden until backend provides meaningful timeline data */}
            </View>

            {/* Symptoms by Group — section is ALWAYS rendered so the Weeks toggle stays
                reachable. Only the pie body switches to a placeholder when there's no data. */}
            <View style={styles.groupStatsSection}>
              <View style={styles.groupStatsHeader}>
                <Text style={styles.groupStatsTitle} allowFontScaling={false}>
                  Symptoms by Group {showAllWeeks ? '(all weeks)' : '(this week)'}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.weeksToggle,
                    showAllWeeks && styles.weeksToggleActive,
                    !pregnancyStartDate && styles.weeksToggleDisabled,
                  ]}
                  onPress={handleWeeksPress}
                  disabled={showAllWeeks || !pregnancyStartDate}
                  activeOpacity={0.7}
                >
                  <Text style={styles.weeksToggleText} allowFontScaling={false}>Weeks</Text>
                </TouchableOpacity>
              </View>

              {symptomGroupData.length > 0 ? (
                <>
                  <View style={styles.groupStatsPieWrapper}>
                    <PieChart
                      data={pieDataForGroupChart}
                      radius={70}
                      donut
                      innerRadius={35}
                      showText={false}
                      focusOnPress={false}
                    />
                  </View>

                  <View style={styles.groupStatsLegend}>
                    {symptomGroupData.map((g) => {
                      const dim = highlightedRiskId != null && g.risk_id !== highlightedRiskId;
                      return (
                        <View
                          key={g.risk_id}
                          style={[styles.groupStatsLegendItem, dim && { opacity: 0.4 }]}
                        >
                          <View style={[styles.groupStatsLegendDot, { backgroundColor: g.color }]} />
                          <Text style={styles.groupStatsLegendText} allowFontScaling={false}>
                            {g.name} · {g.value}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <View style={styles.groupStatsEmpty}>
                  <Text style={styles.groupStatsEmptyText} allowFontScaling={false}>
                    No symptoms logged {showAllWeeks ? 'yet' : 'this week'}.
                    {!showAllWeeks && pregnancyStartDate ? ' Tap Weeks to see all-time data.' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Symptom Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.symptomsFilters}
              contentContainerStyle={styles.symptomsFiltersContent}
            >
              {symptomFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={styles.symptomsFilterItem}
                  onPress={() =>
                    setActiveSymptomFilter((prev) =>
                      prev === filter.id && filter.id !== 'all' ? 'all' : filter.id,
                    )
                  }
                  activeOpacity={0.7}
                >
                  {filter.id === 'all' ? (
                    <View style={[
                      styles.symptomsFilterCircle,
                      activeSymptomFilter === filter.id && styles.symptomsFilterCircleActive,
                    ]}>
                      <Svg width={44} height={44}>
                        <Defs>
                          <LinearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#FFB6C1" />
                            <Stop offset="25%" stopColor="#FFE4B5" />
                            <Stop offset="50%" stopColor="#87CEEB" />
                            <Stop offset="75%" stopColor="#98FB98" />
                            <Stop offset="100%" stopColor="#DDA0DD" />
                          </LinearGradient>
                        </Defs>
                        <Circle cx={22} cy={22} r={20} fill="url(#rainbowGradient)" />
                      </Svg>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.symptomsFilterCircle,
                        { backgroundColor: filter.color },
                        activeSymptomFilter === filter.id && styles.symptomsFilterCircleActive,
                      ]}
                    />
                  )}
                  <Text
                    style={[
                      styles.symptomsFilterLabel,
                      activeSymptomFilter === filter.id && styles.symptomsFilterLabelActive,
                    ]}
                    allowFontScaling={false}
                    numberOfLines={2}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <BottomSheet
        visible={statsWeekSheetVisible}
        onClose={() => setStatsWeekSheetVisible(false)}
        title="Select week"
      >
        <ScrollView
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing('xl') }}
        >
          {WEEK_OPTIONS.map((week) => (
            <BottomSheetOption
              key={week}
              label={`Week ${week}`}
              selected={statsWeek === week}
              onPress={() => {
                setStatsWeek(week);
                setStatsWeekSheetVisible(false);
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={symptomsWeekSheetVisible}
        onClose={() => setSymptomsWeekSheetVisible(false)}
        title="Select week"
      >
        <ScrollView
          style={{ maxHeight: 320 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing('xl') }}
        >
          {WEEK_OPTIONS.map((week) => (
            <BottomSheetOption
              key={week}
              label={`Week ${week}`}
              selected={symptomsWeek === week}
              onPress={() => {
                setSymptomsWeek(week);
                setSymptomsWeekSheetVisible(false);
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};

