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
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faLink, faChartLine, faChevronDown, faCheck, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { useTheme, spacing } from '../theme';
import { BackButton, BottomSheet, BottomSheetOption } from '../components/ui';
import { responsiveUtils } from '../utils/responsiveUtils';
import { SymptomsService } from '../services/api/SymptomsService';

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

// Symptom class colors
// Class 1: Acute & Emergency (Red), Class 2: Systemic (Gray), Class 3: Fetal Activity (Orange), Class 4: Lifestyle (Blue)
const SYMPTOM_CLASSES = [
  { id: 'class1', label: 'Emergency', color: '#E53935' },
  { id: 'class2', label: 'Systemic', color: '#757575' },
  { id: 'class3', label: 'Fetal', color: '#F9AA01' },
  { id: 'class4', label: 'Lifestyle', color: '#1E88E5' },
];

const WEEK_DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY_WEEK_DATA = Array(7).fill({ value: 0 });

// Returns Monday and Sunday of the current week as YYYY-MM-DD strings
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

interface MotherTwinScreenProps {
  onBack?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MotherTwinScreen: React.FC<MotherTwinScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const progress = 36; // 36% progress
  const [activeTab, setActiveTab] = useState<StatTab>('Nutrition');
  const [activeSymptomClass, setActiveSymptomClass] = useState<string | null>(null);
  const [statsWeek, setStatsWeek] = useState(1);
  const [statsWeekSheetVisible, setStatsWeekSheetVisible] = useState(false);
  const [symptomChartData, setSymptomChartData] = useState<{
    class1: { value: number }[];
    class2: { value: number }[];
    class3: { value: number }[];
    class4: { value: number }[];
  }>({
    class1: [...EMPTY_WEEK_DATA],
    class2: [...EMPTY_WEEK_DATA],
    class3: [...EMPTY_WEEK_DATA],
    class4: [...EMPTY_WEEK_DATA],
  });

  useEffect(() => {
    const { start } = getCurrentWeekRange();

    // Build the 7 dates of the current week (Mon–Sun)
    const weekDates = Array(7).fill(null).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    // One request per day — response shape:
    // { start_date, end_date, classes: [{ symptom_class, class_name, color_flag, quantity, symptoms }] }
    Promise.all(
      weekDates.map((date) =>
        SymptomsService.getMommyStatisticsClasses({ start_date: date, end_date: date })
          .catch(() => null)
      )
    ).then((results) => {
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
    });
  }, []);
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
            <Text style={styles.infoText} allowFontScaling={false}>start Date: 07/09/2025</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.infoIcon}>
              <View style={styles.infoIconCircle} />
            </View>
            <Text style={styles.infoText} allowFontScaling={false}>Tracking: {progress}%</Text>
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
                  <Text style={styles.badgeCardTitle} allowFontScaling={false}>Your Badges</Text>
                  <View style={styles.badgeAmountContainer}>
                    <Text style={styles.badgeAmountText} allowFontScaling={false}>2$</Text>
                  </View>
                </View>

                {/* Row 2: Buttons */}
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
              <Text style={styles.statsHeaderTitle} allowFontScaling={false}>Statics On Active Actions</Text>
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
                <Text style={styles.statsDateText} allowFontScaling={false}>Wednesday</Text>
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
                <Text style={styles.statsChartTitle} allowFontScaling={false}>Nutrition</Text>
              </View>

              {/* Pie Chart */}
              <View style={styles.statsChartWrapper}>
                <PieChart
                  data={PIE_DATA}
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
            {DAYS_DATA.map((day, index) => (
              <View 
                key={day.day}
                style={[
                  styles.statsDayRow,
                  index === DAYS_DATA.length - 1 && styles.statsDayRowLast,
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
              <Text style={styles.symptomsHeaderTitle} allowFontScaling={false}>weekly Symptoms Tracker</Text>
            </View>

            {/* Description */}
            <Text style={styles.symptomsDescription} allowFontScaling={false}>
              Your symptoms are slightly improving this week. Today your fatigue is lower than yesterday.
            </Text>

            {/* Area Chart — 4 classes, current week day by day
                Render order: bottom→top = Lifestyle→Systemic→Fetal→Emergency
                so the most critical class (red) is always visible on top */}
            <View style={styles.symptomsChartContainer}>
              <LineChart
                data={symptomChartData.class4}
                data2={symptomChartData.class2}
                data3={symptomChartData.class3}
                data4={symptomChartData.class1}
                width={Dimensions.get('window').width - 80}
                height={180}
                curved
                areaChart
                hideDataPoints
                hideYAxisText
                hideAxesAndRules
                color1="#1E88E5"
                color2="#757575"
                color3="#F9AA01"
                color4="#E53935"
                startFillColor1="#1E88E550"
                startFillColor2="#75757540"
                startFillColor3="#F9AA0150"
                startFillColor4="#E5393560"
                endFillColor1="#1E88E515"
                endFillColor2="#75757515"
                endFillColor3="#F9AA0115"
                endFillColor4="#E5393520"
                initialSpacing={0}
                endSpacing={0}
                thickness={2}
              />
            </View>

            {/* X-axis day labels */}
            <View style={styles.symptomsXAxisRow}>
              {WEEK_DAYS_SHORT.map((d) => (
                <Text key={d} style={styles.symptomsXAxisLabel} allowFontScaling={false}>{d}</Text>
              ))}
            </View>

            {/* Class Legend */}
            <View style={styles.symptomsLegend}>
              {SYMPTOM_CLASSES.map((cls) => {
                const isActive = activeSymptomClass === cls.id;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    style={[
                      styles.symptomsLegendItem,
                      isActive && [styles.symptomsLegendItemActive, { borderColor: cls.color }],
                    ]}
                    onPress={() => setActiveSymptomClass(isActive ? null : cls.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.symptomsLegendDot, { backgroundColor: cls.color }]} />
                    <Text style={[
                      styles.symptomsLegendLabel,
                      isActive && [styles.symptomsLegendLabelActive, { color: cls.color }],
                    ]} allowFontScaling={false}>
                      {cls.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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

    </SafeAreaView>
  );
};

