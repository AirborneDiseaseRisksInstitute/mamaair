import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faGift } from '@fortawesome/free-solid-svg-icons';
import Svg, { Circle, Defs, LinearGradient, Stop, ClipPath, Mask, Rect, Path, G, Pattern } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../theme';
import { BackButton } from '../components/ui';
import { SVG_ICONS, WAVE_BACKGROUND_SVG } from '../utils/svgIcons';
import { responsiveUtils } from '../utils/responsiveUtils';

interface BabyTwinScreenProps {
  onBack?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baby system data
interface BabySystem {
  id: string;
  name: string;
  iconKey: string;
  percentage: number;
  increment: number;
  isActive: boolean;
  startInWeeks?: number;
}

const BABY_SYSTEMS: BabySystem[] = [
  { id: 'cardiovascular', name: 'Cardiovascular', iconKey: 'heartSystem.svg', percentage: 75, increment: 3, isActive: true },
  { id: 'nervous', name: 'Nervous', iconKey: 'brainSystem.svg', percentage: 24, increment: 4, isActive: true },
  { id: 'sensory', name: 'Sensory', iconKey: 'senseSystem.svg', percentage: 50, increment: 0, isActive: false, startInWeeks: 2 },
  { id: 'digestive', name: 'Digestive', iconKey: 'digestiveSystem.svg', percentage: 55, increment: 6, isActive: true },
  { id: 'reproductive', name: 'Reproductive', iconKey: 'reproductiveSystem.svg', percentage: 66, increment: 12, isActive: true },
  { id: 'musculoskeletal', name: 'Musculoskeletal', iconKey: 'boneSystem.svg', percentage: 18, increment: 8, isActive: true },
  { id: 'endocrine', name: 'Endocrine', iconKey: 'endocrineSystem.svg', percentage: 32, increment: 0, isActive: false, startInWeeks: 4 },
  { id: 'respiratory', name: 'Respiratory', iconKey: 'respiratorySystem.svg', percentage: 100, increment: 0, isActive: true },
  { id: 'integumentary', name: 'Integumentary', iconKey: 'integumentarySystem.svg', percentage: 14, increment: 4, isActive: true },
  { id: 'immune', name: 'Immune', iconKey: 'immuneSystem.svg', percentage: 100, increment: 0, isActive: true },
  { id: 'urinary', name: 'Urinary', iconKey: 'urinary.svg', percentage: 85, increment: 1, isActive: true },
];

const ICON_SIZE = 40;
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

// Helper function to change SVG colors to gray
const changeSvgColorToGray = (svgXml: string): string => {
  return svgXml
    .replace(/fill="white"/g, 'fill="#E5E5E5"')
    .replace(/fill='white'/g, "fill='#E5E5E5'")
    .replace(/stroke="#FFAA72"/g, 'stroke="#A1A1A1"')
    .replace(/stroke='#FFAA72'/g, "stroke='#A1A1A1'");
};

// Component for static icon with fill (no animation)
const StaticIconWithFill: React.FC<{
  svgXml: string;
  width: number;
  height: number;
  percentage: number;
  uniqueId: string;
}> = ({ svgXml, width, height, percentage, uniqueId }) => {
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

  return (
    <View style={{ width, height }}>
      {percentage > 0 && iconPathData.length > 0 ? (
        <Svg width={width} height={height} viewBox={viewBox.join(' ')}>
          <Defs>
            <ClipPath id={`staticPercentageClip-${uniqueId}`}>
              <Rect 
                x="0" 
                y={svgHeight - fillHeight} 
                width={svgWidth} 
                height={fillHeight} 
              />
            </ClipPath>
            <Mask id={`staticIconMask-${uniqueId}`}>
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
          <G mask={`url(#staticIconMask-${uniqueId})`} clipPath={`url(#staticPercentageClip-${uniqueId})`}>
            <Rect
              x="0"
              y={svgHeight - fillHeight}
              width={svgWidth}
              height={fillHeight}
              fill="#FF6900"
            />
          </G>
        </Svg>
      ) : (
        <SvgXml xml={svgXml} width={width} height={height} />
      )}
    </View>
  );
};

// Component for icon with wave effect (animated)
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

export const BabyTwinScreen: React.FC<BabyTwinScreenProps> = ({ onBack }) => {
  const theme = useTheme();
  const progress = 5; // 5% progress
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
      padding: spacing('md'),
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
      marginBottom: spacing('md'),
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
    },
    systemCard: {
      width: '48%',
      aspectRatio: 1,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: spacing('sm'),
      marginBottom: spacing('sm'),
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
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <BackButton onPress={onBack} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle} allowFontScaling={false}>Baby Twin</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing('md') }}
      >
        <Text style={styles.sectionTitle} allowFontScaling={false}>Baby's Digital twin</Text>
        
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
              source={require('../assets/babyDigital/bd1.png')}
              style={styles.centerImage}
            />
          </View>

          {/* Percentage Badge */}
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText} allowFontScaling={false}>{progress}%</Text>
          </View>

          {/* Week Info */}
          <View style={styles.weekContainer}>
            <FontAwesomeIcon 
              icon={faCalendar as any} 
              size={18} 
              color={theme.colors.orange500}
              style={styles.weekIcon}
            />
            <Text style={styles.weekText} allowFontScaling={false}>19th Week</Text>
          </View>
        </View>

        {/* Description Text */}
        <Text style={styles.descriptionText} allowFontScaling={false}>
          A delicate layer begins to form, the skin and its soft covering start to protect the growing life within.
        </Text>

        {/* Baby System Progress Card */}
        <View style={styles.systemProgressCard}>
          <View style={styles.systemProgressHeader}>
            <View style={styles.systemProgressTitleContainer}>
              <Text style={styles.systemProgressTitle} allowFontScaling={false}>Baby System Progress</Text>
              <Text style={styles.systemProgressSubtitle} allowFontScaling={false}>Milestone Trackers</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailButton} activeOpacity={0.7}>
              <Text style={styles.viewDetailText} allowFontScaling={false}>View detail</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.systemGrid}>
            {BABY_SYSTEMS.map((system, index) => {
              const svgXml = SVG_ICONS[system.iconKey];
              if (!svgXml) return null;

              const isComplete = system.percentage === 100;
              const processedSvg = system.isActive 
                ? increaseStrokeWidth(svgXml, ICON_STROKE_WIDTH)
                : changeSvgColorToGray(increaseStrokeWidth(svgXml, ICON_STROKE_WIDTH));

              // For complete systems, change icon color to orange500
              const completeSvg = isComplete 
                ? processedSvg
                  .replace(/fill="white"/g, `fill="${theme.colors.orange500}"`)
                  .replace(/fill='white'/g, `fill='${theme.colors.orange500}'`)
                  .replace(/fill="#fff"/g, `fill="${theme.colors.orange500}"`)
                  .replace(/fill='#fff'/g, `fill='${theme.colors.orange500}'`)
                  .replace(/stroke="#FFAA72"/g, `stroke="${theme.colors.orange500}"`)
                  .replace(/stroke='#FFAA72'/g, `stroke='${theme.colors.orange500}'`)
                : processedSvg;

              return (
                <View 
                  key={system.id} 
                  style={[
                    styles.systemCard,
                    !system.isActive && styles.systemCardInactive
                  ]}
                >

                     {/* Start in badge for inactive systems */}
                     {!system.isActive && system.startInWeeks && (
                      <View style={styles.startInBadge}>
                        <Text style={styles.startInText} allowFontScaling={false}>
                          start in next {system.startInWeeks} weeks
                        </Text>
                      </View>
                    )}

                  <View style={[
                    styles.systemIconContainer,
                    isComplete && styles.systemIconContainerComplete
                  ]}>
                   

                    {/* Increment badge for active systems with increment > 0 */}
                    {system.isActive && system.increment > 0 && !isComplete && (
                      <View style={styles.incrementBadge}>
                        <Text style={styles.incrementText} allowFontScaling={false}>+{system.increment}%</Text>
                      </View>
                    )}

                    {/* Icon - no animation for complete systems */}
                    {isComplete ? (
                      <SvgXml xml={completeSvg} width={ICON_SIZE} height={ICON_SIZE} />
                    ) : system.isActive && system.percentage > 0 ? (
                      <IconWithWave
                        svgXml={processedSvg}
                        width={ICON_SIZE}
                        height={ICON_SIZE}
                        percentage={system.percentage}
                        uniqueId={`system-${system.id}`}
                      />
                    ) : (
                      <SvgXml xml={processedSvg} width={ICON_SIZE} height={ICON_SIZE} />
                    )}
                  </View>

                  <Text style={[
                    styles.systemName,
                    !system.isActive && styles.systemNameInactive
                  ]} allowFontScaling={false}>
                    {system.name}
                  </Text>
                  <Text style={[
                    styles.systemPercentage,
                    !system.isActive && styles.systemPercentageInactive
                  ]} allowFontScaling={false}>
                    {system.percentage}%
                  </Text>
                </View>
              );
            })}

            {/* Weekly Surprise Gift Card */}
            <TouchableOpacity style={styles.giftCard} activeOpacity={0.7}>
              <View style={styles.giftIconContainer}>
                <FontAwesomeIcon 
                  icon={faGift as any} 
                  size={22} 
                  color="#fff"
                />
              </View>
              <Text style={styles.giftText} allowFontScaling={false}>Weekly Surprise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

