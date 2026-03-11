import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { G, Path, Defs, ClipPath, Mask, Rect, Pattern } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { WaveCard, ExposureAccordion, TaskCard, FloatingActionButton, useToast, ReminderTimePicker } from '../components/ui';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SVG_ICONS, WAVE_BACKGROUND_SVG, DIET_SVG, RUNNING_SVG, BEHAVIOUR_SVG, MOTHER_RISK_SVG, BABY_RISK_SVG } from '../utils/svgIcons';
import { responsiveUtils } from '../utils/responsiveUtils';
import { SummaryService, type SummaryResponse } from '../services/api/SummaryService';
import { LifestyleService } from '../services/api/LifestyleService';

const ICON_SIZE = 48;
const ICON_STROKE_WIDTH = 1.5;

// Helper function to increase stroke-width in SVG
const increaseStrokeWidth = (svgXml: string, strokeWidth: number): string => {
  return svgXml.replace(
    /stroke-width="([^"]*)"/g,
    `stroke-width="${strokeWidth}"`
  ).replace(
    /stroke-width='([^']*)'/g,
    `stroke-width='${strokeWidth}'`
  );
};

// Component for icon with wave effect (copied from WeekCycleView)
const IconWithWave: React.FC<{
  svgXml: string;
  width: number;
  height: number;
  percentage: number;
  uniqueId: string;
}> = ({ svgXml, width, height, percentage, uniqueId }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [waveTranslateX, setWaveTranslateX] = React.useState(0);
  
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

  const viewBoxMatch = svgXml.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, width, height];
  const svgWidth = viewBox[2] || width;
  const svgHeight = viewBox[3] || height;
  const fillHeight = (svgHeight * percentage) / 100;

  const pathMatches = svgXml.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
  const iconPathData = pathMatches ? pathMatches.map(m => {
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
  }).filter(p => p.d) : [];
  
  const wavePathMatches = WAVE_BACKGROUND_SVG.match(/<path[^>]*d="([^"]*)"[^>]*fill="([^"]*)"[^>]*>/g);
  const wavePaths = wavePathMatches ? wavePathMatches.map(m => {
    const dMatch = m.match(/d="([^"]*)"/);
    const fillMatch = m.match(/fill="([^"]*)"/);
    return {
      d: dMatch ? dMatch[1] : '',
      fill: fillMatch ? fillMatch[1] : '#FF6900',
    };
  }).filter(p => p.d) : [];

  return (
    <View style={{ width, height }}>
      {percentage > 0 && wavePaths.length > 0 && iconPathData.length > 0 ? (
        <Svg width={width} height={height} viewBox={viewBox.join(' ')}>
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
              <Rect 
                x="0" 
                y={svgHeight - fillHeight} 
                width={svgWidth} 
                height={fillHeight} 
              />
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
          
          {iconPathData.map((pathData, idx) => (
            <Path
              key={`icon-${idx}`}
              d={pathData.d}
              stroke={pathData.stroke}
              fill={pathData.fill}
              strokeWidth={pathData.strokeWidth}
            />
          ))}
          
          <G mask={`url(#iconMask-${uniqueId})`} clipPath={`url(#percentageClip-${uniqueId})`}>
            <Rect
              x="0"
              y="0"
              width={svgWidth}
              height={svgHeight}
              fill={`url(#wavePattern-${uniqueId})`}
            />
          </G>
        </Svg>
      ) : (
        <SvgXml xml={svgXml} width={width} height={height} />
      )}
    </View>
  );
};

interface TodayScreenProps {
  onNavigateToProfile?: () => void;
  onBackPress?: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = React.memo(({ onNavigateToProfile: _onNavigateToProfile, onBackPress }) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { profile } = useUserStore();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [lifestyle, setLifestyle] = useState<any | null>(null);
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const currentWeek = summary?.week_info?.week || profile.pregnancyWeek || 19;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [summaryData, lifestyleData] = await Promise.all([
          SummaryService.getSummary(),
          LifestyleService.getLifestyle()
        ]);
        if (mounted) {
          setSummary(summaryData);
          setLifestyle(lifestyleData);
        }
      } catch {
        if (mounted) setError('Failed to load data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleDelayTask = (taskTitle: string) => {
    showToast({
      type: 'success',
      title: taskTitle,
      message: 'This task was delayed by 15 minutes.',
    });
  };

  const [reminderPickerVisible, setReminderPickerVisible] = useState(false);
  const [reminderTaskTitle, setReminderTaskTitle] = useState<string | null>(null);

  const openReminderPicker = (taskTitle: string) => {
    setReminderTaskTitle(taskTitle);
    setReminderPickerVisible(true);
  };

  const handleReminderConfirm = (hour: number, minute: number) => {
    const titleForToast = reminderTaskTitle ?? 'Reminder';
    setReminderPickerVisible(false);
    setReminderTaskTitle(null);
    showToast({
      type: 'success',
      title: titleForToast,
      message: `Reminder set for ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}.`,
    });
  };

  // Get current date info
  const today = new Date();
  const dateString = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).replace(/\//g, '/');
  const tasksDayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing('md'),
      paddingTop: insets.top + spacing('md'),
      paddingBottom: spacing('md'),
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 3,
    },
    backButton: {
      padding: spacing('sm'),
      marginRight: spacing('sm'),
    },
    headerTitle: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing('md'),
    },
    dateSection: {
      paddingTop: spacing('lg'),
    },
    dateText: {
      fontSize: responsiveUtils.getFixedFontSize(24),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    dayWeekText: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.neutral500,
    },
    cardsSection: {
      paddingTop: spacing('lg'),
      alignItems: 'center',
    },
    cardsContainer: {
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: theme.colors.neutral100,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      alignSelf: 'center',
    },
    cardsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    weekCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: spacing('md'),
      marginTop: spacing('md'),
      shadowColor: theme.colors.orange500,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    weekTitle: {
      fontSize: responsiveUtils.getFixedFontSize(20),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('sm'),
    },
    weekDescription: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      lineHeight: responsiveUtils.getFixedLineHeight(14, 20),
      marginBottom: spacing('md'),
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.neutral200,
      marginBottom: spacing('md'),
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('md'),
      marginBottom: spacing('md'),
    },
    iconCircle: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      borderRadius: ICON_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.orange100,
    },
    featureText: {
      flex: 1,
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.orange500,
    },
    showMoreButton: {
      alignItems: 'center',
      paddingTop: spacing('sm'),
    },
    showMoreText: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    protectionCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: spacing('md'),
      marginTop: spacing('md'),
      shadowColor: theme.colors.orange500,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    headerBadges: {
      flexDirection: 'row',
      gap: spacing('sm'),
      marginBottom: spacing('lg'),
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    badgeGreen: {
      backgroundColor: '#E8F5E9',
    },
    badgeYellow: {
      backgroundColor: '#FFF9E6',
    },
    badgeRed: {
      backgroundColor: '#FFE5E5',
    },
    badgeText: {
      fontSize: responsiveUtils.getBadgeFontSize(),
      fontFamily: theme.typography.fontFamily.medium,
    },
    badgeTextGreen: {
      color: '#4CAF50',
    },
    badgeTextYellow: {
      color: '#FF9800',
    },
    badgeTextRed: {
      color: '#F44336',
    },
    protectionSection: {
      marginBottom: spacing('lg'),
    },
    protectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('md'),
      marginBottom: spacing('sm'),
    },
    protectionIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    protectionIconGreen: {
      backgroundColor: '#E8F5E9',
    },
    protectionIconYellow: {
      backgroundColor: '#FFF9E6',
    },
    protectionTitle: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      flex: 1,
    },
    progressContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
    },
    progressBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressBarEmpty: {
      height: '100%',
      flex: 1,
      borderRadius: 4,
    },
    progressBarFillGreen: {
      backgroundColor: '#4CAF50',
    },
    progressBarFillOrange: {
      backgroundColor: '#FF6900',
    },
    progressBarEmptyGreen: {
      backgroundColor: '#E8F5E9',
    },
    progressBarEmptyOrange: {
      backgroundColor: '#FFF5E0',
    },
    progressText: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.bold,
      minWidth: 40,
      textAlign: 'right',
    },
    progressTextGreen: {
      color: '#4CAF50',
    },
    progressTextOrange: {
      color: '#FF6900',
    },

    tasksContainer:{
      display:'flex',
      flexDirection:'column',
      flex:1,
    },
    healthRisksCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: spacing('md'),
      marginTop: spacing('lg'),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      marginBottom:100,
    },
    healthRisksHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing('md'),
      gap: spacing('sm'),
    },
    healthRisksTitle: {
      fontSize: responsiveUtils.getFixedFontSize(18),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
    },
    riskSection: {
      backgroundColor: '#FFF',
      borderRadius: 8,
      padding: spacing('md'),
      marginBottom: spacing('md'),
    },
    riskSectionMother: {
      backgroundColor: '#FFF6F0',
    },
    riskSectionBaby: {
      backgroundColor: '#FFF8FA',
    },
    riskTitle: {
      fontSize: responsiveUtils.getFixedFontSize(16),
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      marginBottom: spacing('xs'),
    },
    riskDecrease: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.medium,
      color: '#4CAF50',
      marginBottom: spacing('sm'),
    },
    riskIncrease: {
      fontSize: responsiveUtils.getFixedFontSize(14),
      fontFamily: theme.typography.fontFamily.medium,
      color: '#F44336',
      marginBottom: spacing('sm'),
    },
    riskProgressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('sm'),
      marginBottom: spacing('sm'),
    },
    riskProgressBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    riskProgressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    riskProgressBarEmpty: {
      height: '100%',
      flex: 1,
      borderRadius: 4,
    },
    riskProgressBarFillMother: {
      backgroundColor: '#FF6900',
    },
    riskProgressBarFillBaby: {
      backgroundColor: '#9C27B0',
    },
    riskProgressBarEmptyMother: {
      backgroundColor: '#FFE0B2',
    },
    riskProgressBarEmptyBaby: {
      backgroundColor: '#E1BEE7',
    },
    riskTag: {
      paddingHorizontal: spacing('sm'),
      paddingVertical: spacing('xs'),
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    riskTagMother: {
      backgroundColor: '#FFE0B2',
    },
    riskTagBaby: {
      backgroundColor: '#E1BEE7',
    },
    riskTagText: {
      fontSize: responsiveUtils.getFixedFontSize(12),
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textPrimary,
    },
  }), [theme, insets.top]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackPress}
          activeOpacity={0.7}
        >
          <FontAwesomeIcon 
            icon={faArrowLeft as any} 
            size={20} 
            color={theme.colors.textPrimary} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>Today</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Section */}
        <View style={styles.dateSection}>
          <Text style={styles.dateText} allowFontScaling={false}>{dateString}</Text>
          <Text style={styles.dayWeekText} allowFontScaling={false}>Day 4 / Week {currentWeek}</Text>
        </View>

        {/* Wave Cards Section */}
        <View style={styles.cardsSection}>
          <View style={styles.cardsContainer}>
            <View style={styles.cardsRow}>
              <WaveCard 
                type="water"
                percentage={0} // TODO: Connect to water consumption endpoint when available
                label={`Water\nTarget: ${lifestyle?.hydration_target_ml_per_day || 2000}ml`}
              />
              <WaveCard 
                type="mood"
                percentage={12}
                label="Mood"
              />
              <WaveCard 
                type="feeling"
                percentage={48}
                label="Feeling"
              />
            </View>
          </View>
        </View>

        {/* Exposure Accordion */}
        <ExposureAccordion level={summary?.mom_exposure?.exposure_level ?? 0} maxLevel={8} />

        {/* Week Info Card */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle} allowFontScaling={false}>Week: {currentWeek}</Text>
          <Text style={styles.weekDescription} allowFontScaling={false}>
            {summary?.week_info?.text || 'A delicate layer begins to form, the skin and its soft covering start to protect the growing life within.'}
          </Text>
          
          <View style={styles.divider} />
          
          {/* Feature Items */}
          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              {SVG_ICONS['senseSystem.svg'] && (
                <IconWithWave
                  svgXml={increaseStrokeWidth(SVG_ICONS['senseSystem.svg'], ICON_STROKE_WIDTH)}
                  width={28}
                  height={28}
                  percentage={60}
                  uniqueId="sense-week19"
                />
              )}
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>
              Focus on nervous system development
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              {SVG_ICONS['brainSystem.svg'] && (
                <IconWithWave
                  svgXml={increaseStrokeWidth(SVG_ICONS['brainSystem.svg'], ICON_STROKE_WIDTH)}
                  width={28}
                  height={28}
                  percentage={70}
                  uniqueId="brain-week19"
                />
              )}
            </View>
            <Text style={styles.featureText} allowFontScaling={false}>
              New senses begin to awaken
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.showMoreButton} activeOpacity={0.7}>
            <Text style={styles.showMoreText} allowFontScaling={false}>Show more</Text>
          </TouchableOpacity>
        </View>

        {/* Protection Card */}
        <View style={styles.protectionCard}>
          {/* Header Badges */}
          <View style={styles.headerBadges}>
            <View style={[styles.badge, styles.badgeGreen]}>
              <SvgXml xml={DIET_SVG} width={18} height={18} />
              <Text style={[styles.badgeText, styles.badgeTextGreen]} allowFontScaling={false}>1/5</Text>
            </View>
            <View style={[styles.badge, styles.badgeYellow]}>
              <SvgXml xml={RUNNING_SVG} width={18} height={18} />
              <Text style={[styles.badgeText, styles.badgeTextYellow]} allowFontScaling={false}>2/6</Text>
            </View>
            <View style={[styles.badge, styles.badgeRed]}>
              <SvgXml xml={BEHAVIOUR_SVG} width={18} height={18} />
              <Text style={[styles.badgeText, styles.badgeTextRed]} allowFontScaling={false}>5/5</Text>
            </View>
          </View>

          {/* Mother's Protection */}
          <View style={styles.protectionSection}>
            <View style={styles.protectionRow}>
              <View style={[styles.protectionIcon, styles.protectionIconGreen]}>
                <SvgXml xml={MOTHER_RISK_SVG} width={40} height={40} />
              </View>
              <Text style={styles.protectionTitle} allowFontScaling={false}>Mother's Protection</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, styles.progressBarFillGreen, { width: '30%' }]} />
                <View style={[styles.progressBarEmpty, styles.progressBarEmptyGreen]} />
              </View>
              <Text style={[styles.progressText, styles.progressTextGreen]} allowFontScaling={false}>30%</Text>
            </View>
          </View>

          {/* Baby's Protection */}
          <View style={styles.protectionSection}>
            <View style={styles.protectionRow}>
              <View style={[styles.protectionIcon, styles.protectionIconYellow]}>
                <SvgXml xml={BABY_RISK_SVG} width={40} height={40} />
              </View>
              <Text style={styles.protectionTitle} allowFontScaling={false}>Baby's Protection</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, styles.progressBarFillOrange, { width: '48%' }]} />
                <View style={[styles.progressBarEmpty, styles.progressBarEmptyOrange]} />
              </View>
              <Text style={[styles.progressText, styles.progressTextOrange]} allowFontScaling={false}>48%</Text>
            </View>
          </View>
        </View>

        {/* Today's Tasks Section */}
        <View style={styles.dateSection}>
          <Text style={styles.dateText} allowFontScaling={false}>Today's Tasks</Text>
          <Text style={styles.dayWeekText} allowFontScaling={false}>{tasksDayLabel}</Text>
        </View>

        <View style={styles.tasksContainer}>

        <TaskCard
          type="behaviour"
          title="Cooking Smoke Period"
          description="Charcoal smoke peaks between 18:00–19:00.\nImprove airflow or take a break outdoors."
          buttons={[
            {
              label: 'Set Reminder',
              onPress: () => openReminderPicker('Cooking Smoke Period'),
              variant: 'reminder',
            },
          ]}
          onCheck={(checked) => console.log('Task checked:', checked)}
        />

         

<TaskCard
          type="diet"
          title="Drink Water"
          description="Charcoal smoke peaks between 18:00–19:00.\nImprove airflow or take a break outdoors."
          buttons={[
            {
              label: 'Delay my water',
              onPress: () => handleDelayTask('Drink Water'),
              variant: 'delay',
            },
            {
              label: 'Set Reminder',
              onPress: () => openReminderPicker('Drink Water'),
              variant: 'reminder',
            },
          ]}
          onCheck={(checked) => console.log('Task checked:', checked)}
        />

<TaskCard
          type="activity"
          title="Morning Walk Shift"
          description="06:30–07:15 walk: 15 high-risk minutes (dust pockets along road)."
          buttons={[
            {
              label: 'Delay my walk',
              onPress: () => handleDelayTask('Morning Walk Shift'),
              variant: 'delay',
            },
            {
              label: 'Set Reminder',
              onPress: () => openReminderPicker('Morning Walk Shift'),
              variant: 'reminder',
            },
          ]}
          onCheck={(checked) => console.log('Task checked:', checked)}
        />


</View>

        {/* Health Risks Card */}
        <View style={styles.healthRisksCard}>
          <View style={styles.healthRisksHeader}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                fill="none"
                stroke="#FFB86A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <Path
                d="M12 2C6.48 2 2 6.48 2 12"
                fill="none"
                stroke="#FF6900"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="31.4"
                strokeDashoffset="18.84"
              />
            </Svg>
            <Text style={styles.healthRisksTitle} allowFontScaling={false}>Health Risks</Text>
          </View>

          {/* Mother's Risk Section */}
          <View style={[styles.riskSection, styles.riskSectionMother]}>
            <Text style={styles.riskTitle} allowFontScaling={false}>Mother's Risk</Text>
            <Text 
              style={summary?.risks_delta?.mom && summary.risks_delta.mom > 0 ? styles.riskIncrease : styles.riskDecrease} 
              allowFontScaling={false}
            >
              {summary?.risks_delta?.mom ? `${Math.abs(summary.risks_delta.mom).toFixed(1)}% ${summary.risks_delta.mom < 0 ? 'Decrease' : 'Increase'}` : 'No Change'}
            </Text>
            <View style={styles.riskProgressContainer}>
              <View style={styles.riskProgressBar}>
                <View style={[styles.riskProgressBarFill, styles.riskProgressBarFillMother, { width: `${((summary?.mom_exposure?.exposure_level || 0) / 8) * 100}%` }]} />
                <View style={[styles.riskProgressBarEmpty, styles.riskProgressBarEmptyMother]} />
              </View>
            </View>
            <View style={[styles.riskTag, styles.riskTagMother]}>
              <Text style={styles.riskTagText} allowFontScaling={false}>
                {(summary?.mom_exposure?.exposure_level || 0)}/8 Exposure Level
              </Text>
            </View>
          </View>

          {/* Baby's Risk Section */}
          <View style={[styles.riskSection, styles.riskSectionBaby]}>
            <Text style={styles.riskTitle} allowFontScaling={false}>Baby's Risk</Text>
            <Text 
              style={summary?.risks_delta?.baby && summary.risks_delta.baby > 0 ? styles.riskIncrease : styles.riskDecrease} 
              allowFontScaling={false}
            >
              {summary?.risks_delta?.baby ? `${Math.abs(summary.risks_delta.baby).toFixed(1)}% ${summary.risks_delta.baby < 0 ? 'Decrease' : 'Increase'}` : 'No Change'}
            </Text>
            <View style={styles.riskProgressContainer}>
              <View style={styles.riskProgressBar}>
                <View style={[styles.riskProgressBarFill, styles.riskProgressBarFillBaby, { width: `${((summary?.baby_exposure?.exposure_level || 0) / 8) * 100}%` }]} />
                <View style={[styles.riskProgressBarEmpty, styles.riskProgressBarEmptyBaby]} />
              </View>
            </View>
            <View style={[styles.riskTag, styles.riskTagBaby]}>
              <Text style={styles.riskTagText} allowFontScaling={false}>
                {(summary?.baby_exposure?.exposure_level || 0)}/8 Exposure Level
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <FloatingActionButton
        onApply={(data: { moods: string[]; symptoms: string[]; waterAmount: number }) => {
          // Handle apply with data
          console.log('Applied data:', data);
        }}
      />

      <ReminderTimePicker
        visible={reminderPickerVisible}
        onClose={() => {
          setReminderPickerVisible(false);
          setReminderTaskTitle(null);
        }}
        onConfirm={handleReminderConfirm}
        taskTitle={reminderTaskTitle ?? undefined}
      />
    </SafeAreaView>
  );
});
