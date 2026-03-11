import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Text, Dimensions, Animated, TouchableOpacity } from 'react-native';
import Svg, { Circle, G, ForeignObject, Path, Defs, ClipPath, Mask, Rect, Pattern } from "react-native-svg";
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../theme';
import { SVG_ICONS, WAVE_BACKGROUND_SVG, DIET_SVG } from '../../utils/svgIcons';
import { responsiveUtils } from '../../utils/responsiveUtils';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faHeart,
  faShoppingBasket,
  faRunning,
  faFaceSadTear,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';

const MAIN_CIRCLE_DIAMETER = responsiveUtils.getWeekCycleMainCircleDiameter();
const MAIN_RADIUS = MAIN_CIRCLE_DIAMETER / 2;

const DOT_SIZE = responsiveUtils.getWeekCycleDotSize();
const DOT_RADIUS = DOT_SIZE / 2;
const ICON_SIZE = responsiveUtils.getWeekCycleIconSize();
const ICON_STROKE_WIDTH = 1.5;

// Helper function to increase stroke-width in SVG
const increaseStrokeWidth = (svgXml: string, strokeWidth: number): string => {
  // Replace stroke-width in SVG string
  return svgXml.replace(
    /stroke-width="([^"]*)"/g,
    `stroke-width="${strokeWidth}"`
  ).replace(
    /stroke-width='([^']*)'/g,
    `stroke-width='${strokeWidth}'`
  );
};

// Helper function to change SVG colors to white
const changeSvgColorToWhite = (svgXml: string): string => {
  return svgXml
    .replace(/fill="([^"]*)"/g, 'fill="#FFF"')
    .replace(/fill='([^']*)'/g, "fill='#FFF'")
    .replace(/stroke="([^"]*)"/g, 'stroke="#FFF"')
    .replace(/stroke='([^']*)'/g, "stroke='#FFF'");
};

// Helper function to change SVG colors to a specific color
const changeSvgColor = (svgXml: string, color: string): string => {
  return svgXml
    .replace(/fill="([^"]*)"/g, `fill="${color}"`)
    .replace(/fill='([^']*)'/g, `fill='${color}'`)
    .replace(/stroke="([^"]*)"/g, `stroke="${color}"`)
    .replace(/stroke='([^']*)'/g, `stroke='${color}'`);
};

const BORDER_WIDTH = 2;

const TOTAL_DOTS = 11;

interface CircleIcon {
  index: number;
  iconPath?: string;
  percentage?: number; // Icon fill percentage (0-100)
}

// Component for static icon with fill (no animation) - for inactive weeks
const StaticIconWithFill: React.FC<{
  svgXml: string;
  width: number;
  height: number;
  percentage: number;
  uniqueId: string;
}> = ({ svgXml, width, height, percentage, uniqueId }) => {
  // Extract viewBox from icon SVG
  const viewBoxMatch = svgXml.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, width, height];
  const svgWidth = viewBox[2] || width;
  const svgHeight = viewBox[3] || height;
  const fillHeight = (svgHeight * percentage) / 100;

  // Extract icon paths for use in mask
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
            {/* ClipPath to limit to percentage */}
            <ClipPath id={`staticPercentageClip-${uniqueId}`}>
              <Rect 
                x="0" 
                y={svgHeight - fillHeight} 
                width={svgWidth} 
                height={fillHeight} 
              />
            </ClipPath>
            
            {/* Mask to limit fill to icon shape */}
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
          
          {/* Main icon with stroke */}
          {iconPathData.map((pathData, idx) => (
            <Path
              key={`icon-${idx}`}
              d={pathData.d}
              stroke={pathData.stroke}
              fill={pathData.fill}
              strokeWidth={pathData.strokeWidth}
            />
          ))}
          
          {/* Static fill limited by Mask and ClipPath */}
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

// Component for icon with wave effect (animated) - for active week only
const IconWithWave: React.FC<{
  svgXml: string;
  width: number;
  height: number;
  percentage: number;
  uniqueId: string;
}> = ({ svgXml, width, height, percentage, uniqueId }) => {
  // Use useRef to preserve animation value across re-renders
  const waveAnim = useRef(new Animated.Value(0)).current;
  const [waveTranslateX, setWaveTranslateX] = React.useState(0);
  
  // Extract wave SVG information (before useEffect so it's available in listener)
  const waveViewBoxMatch = WAVE_BACKGROUND_SVG.match(/viewBox="([^"]*)"/);
  const waveViewBox = waveViewBoxMatch ? waveViewBoxMatch[1].split(' ').map(Number) : [0, 0, 113, 29];
  const waveWidth = waveViewBox[2] || 113;
  const waveHeight = waveViewBox[3] || 29;
  
  useEffect(() => {
    // Smooth infinite animation
    const animation = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 5000, // Animation speed
        useNativeDriver: false, // Must be false for animating SVG properties
      })
    );
    
    animation.start();
    
    // Optimization: convert animation value to transform value
    // Animation moves from 0 to full wave width to create a complete loop
    const listener = waveAnim.addListener(({ value }) => {
      const translateX = value * -waveWidth; // Move from right to left
      setWaveTranslateX(translateX);
    });
    
    return () => {
      animation.stop(); // Stop animation when component unmounts
      waveAnim.removeListener(listener);
    };
  }, [waveAnim, waveWidth]);

  // Extract viewBox from icon SVG
  const viewBoxMatch = svgXml.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, width, height];
  const svgWidth = viewBox[2] || width;
  const svgHeight = viewBox[3] || height;
  const fillHeight = (svgHeight * percentage) / 100;

  // Extract icon paths for use in mask
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
            {/* Pattern for animated wave background */}
            <Pattern
              id={`wavePattern-${uniqueId}`}
              x="0" // x is fixed, movement happens inside Pattern
              y={svgHeight - fillHeight}
              width={waveWidth} // Pattern width equals one wave width
              height={waveHeight}
              patternUnits="userSpaceOnUse"
            >
              {/* This G will be animated */}
              <G transform={`translate(${waveTranslateX}, 0)`}>
                {/* First wave copy */}
                <G>
                  {wavePaths.map((wavePath, idx) => (
                    <Path key={idx} d={wavePath.d} fill={wavePath.fill} />
                  ))}
                </G>
                {/* Second wave copy with 1px overlap to fix gap issue */}
                <G transform={`translate(${waveWidth - 1}, 0)`}>
                  {wavePaths.map((wavePath, idx) => (
                    <Path key={idx} d={wavePath.d} fill={wavePath.fill} />
                  ))}
                </G>
              </G>
            </Pattern>
            
            {/* ClipPath to limit to percentage */}
            <ClipPath id={`percentageClip-${uniqueId}`}>
              <Rect 
                x="0" 
                y={svgHeight - fillHeight} 
                width={svgWidth} 
                height={fillHeight} 
              />
            </ClipPath>
            
            {/* Mask to limit wave to icon shape */}
            <Mask id={`iconMask-${uniqueId}`}>
              {/* In Mask, white color indicates visible parts and black indicates hidden parts */}
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
          
          {/* Main icon with stroke */}
          {iconPathData.map((pathData, idx) => (
            <Path
              key={`icon-${idx}`}
              d={pathData.d}
              stroke={pathData.stroke}
              fill={pathData.fill}
              strokeWidth={pathData.strokeWidth}
            />
          ))}
          
          {/* Animated wave limited by Mask and ClipPath */}
          <G mask={`url(#iconMask-${uniqueId})`} clipPath={`url(#percentageClip-${uniqueId})`}>
            <Rect
              x="0"
              y="0" // Set y to 0 because pattern y is already set
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

interface WeekDay {
  day: string;
  icons: Array<'heart' | 'basket' | 'running'>;
  isActive?: boolean;
  activeIcons?: Array<'heart' | 'basket' | 'running'>; // Which icons are active
  isMissed?: boolean; // Day is completely missed
  isStartDay?: boolean; // Day can be started
}

// Icon colors for active state
const ICON_COLORS = {
  heart: { bg: '#FFF5E0', icon: '#F5B800' },      // Yellow
  basket: { bg: '#E8F5E9', icon: '#4CAF50' },     // Green
  running: { bg: '#E3F2FD', icon: '#2196F3' },    // Blue
};

interface WeekCycleViewProps {
  reversed?: boolean;
  centerImage?: any;
  circleIcons?: CircleIcon[];
  weekDays?: WeekDay[];
  title?: string;
  description?: string;
  onStartPress?: () => void;
  onImagePress?: () => void; // Callback when center image is pressed
  isActive?: boolean; // If true, enables wave animations; otherwise shows static fills
}

const DEFAULT_WEEK_DAYS: WeekDay[] = [
  { day: 'Mon', icons: ['heart', 'basket', 'running'] },
  { day: 'Tue', icons: ['heart', 'basket', 'running'] },
  { day: 'Wed', icons: ['heart', 'basket', 'running'] },
  { day: 'Thu', icons: ['heart', 'basket', 'running'] },
  { day: 'Fri', icons: ['heart', 'basket', 'running'] },
  { day: 'Sat', icons: ['heart', 'basket', 'running'] },
  { day: 'Sun', icons: ['heart', 'basket', 'running'] },
];


const WeekCycleViewComponent: React.FC<WeekCycleViewProps> = ({
  reversed = false,
  centerImage = require('../../assets/weeks/week1.png'),
  circleIcons = [],
  weekDays = DEFAULT_WEEK_DAYS,
  title,
  description,
  onStartPress,
  onImagePress,
  isActive = false, // Default to false for performance - only active week gets animations
}) => {

  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const weekSectionMarginRight = reversed ? Math.round(screenWidth * 0.22) : 0;

  // Create map from circleIcons for fast access
  const iconMap = React.useMemo(() => {
    const map: Record<number, { iconPath: string; percentage?: number }> = {};
    circleIcons.forEach(icon => {
      if (icon.index >= 0 && icon.index < TOTAL_DOTS && icon.iconPath) {
        map[icon.index] = {
          iconPath: icon.iconPath,
          percentage: icon.percentage,
        };
      }
    });
    return map;
  }, [circleIcons]);

  const handleStartPress = React.useCallback(() => {
    requestAnimationFrame(() => {
      onStartPress?.();
    });
  }, [onStartPress]);

  const renderCircleSvg = () => {
    // Add padding to prevent circles and icons from being hidden
    // Use the largest size (ICON_SIZE or DOT_SIZE)
    const maxElementSize = Math.max(ICON_SIZE, DOT_SIZE);
    const padding = maxElementSize / 2 + 2; // Extra space for circles and icons
    const svgSize = MAIN_CIRCLE_DIAMETER + padding * 2;
    const centerOffset = MAIN_RADIUS + padding;

    const angleStep = 360 / TOTAL_DOTS;
    const dotNodes = [];

    for (let i = 0; i < TOTAL_DOTS; i++) {
      const angleRad = ((-90 + i * angleStep) * Math.PI) / 180;

      // Calculate position considering padding
      const cx = centerOffset + Math.cos(angleRad) * MAIN_RADIUS;
      const cy = centerOffset + Math.sin(angleRad) * MAIN_RADIUS;

      // Check if an icon exists for this index
      const iconData = iconMap[i];
      
      if (iconData && SVG_ICONS[iconData.iconPath]) {
        // If icon exists, render SVG
        const svgXml = SVG_ICONS[iconData.iconPath];
        // Increase stroke-width for better visibility
        const svgXmlWithThickerStroke = increaseStrokeWidth(svgXml, ICON_STROKE_WIDTH);
        const iconRadius = ICON_SIZE / 2;
        const percentage = iconData.percentage || 0;
        
        dotNodes.push(
          <ForeignObject 
            key={i}
            x={cx - iconRadius} 
            y={cy - iconRadius} 
            width={ICON_SIZE} 
            height={ICON_SIZE}
          >
            {percentage > 0 ? (
              // Use animated wave only for active week, static fill for inactive weeks
              isActive ? (
                <IconWithWave
                  svgXml={svgXmlWithThickerStroke}
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  percentage={percentage}
                  uniqueId={`icon-${i}`}
                />
              ) : (
                <StaticIconWithFill
                  svgXml={svgXmlWithThickerStroke}
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  percentage={percentage}
                  uniqueId={`icon-${i}`}
                />
              )
            ) : (
              <SvgXml 
                xml={svgXmlWithThickerStroke} 
                width={ICON_SIZE} 
                height={ICON_SIZE}
              />
            )}
          </ForeignObject>
        );
      } else {
        // If icon doesn't exist, render circle
        dotNodes.push(
          <Circle 
            key={i}
            cx={cx}
            cy={cy}
            r={DOT_RADIUS}
            fill="#FFD7BD"
          />
        );
      }
    }

    return (
      <Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* border circle stroke perfectly centered */}
        <Circle
          cx={centerOffset}
          cy={centerOffset}
          r={MAIN_RADIUS - BORDER_WIDTH / 2} 
          stroke="#FFC299"
          strokeWidth={BORDER_WIDTH}
          fill="transparent"
        />

        <G>{dotNodes}</G>
      </Svg>
    );
  };

  // Render week days as an arc from top to bottom with equal spacing
  const renderWeekDays = () => {
    const iconMap: Record<string, any> = { 
      heart: faHeart, 
      basket: faShoppingBasket, 
      running: faRunning 
    };

    // Equal spacing between days
    const verticalSpacing = 26; // Vertical spacing between each day
    const rowHeightNormal = 30; // Approximate height of each row
    const rowHeightStart = 30; // Start day now same height as other days
    const startY = 0; // Start from top
    
    // Helper function to get row height based on state
    const getRowHeight = (day: typeof weekDays[0]) => {
      return day.isStartDay ? rowHeightStart : rowHeightNormal;
    };
    
    // Calculate cumulative Y positions
    const cumulativeYPositions = weekDays.reduce((acc: number[], day, idx) => {
      if (idx === 0) {
        acc.push(startY);
      } else {
        const prevY = acc[idx - 1];
        const prevHeight = getRowHeight(weekDays[idx - 1]);
        acc.push(prevY + prevHeight + verticalSpacing);
      }
      return acc;
    }, []);
    
    // Calculate arc position for horizontal positioning
    const arcRadius = MAIN_RADIUS + 30; // Distance from circle center
    
    // In reversed mode, invert angles so arc goes to the left
    let startAngle, endAngle;
    if (reversed) {
      // In reversed: Monday at top right, Sunday at bottom right
      // Arc should go to the left (concave to the left)
      // Use similar angles to normal but with offset to create inverted arc
      startAngle = -90; // Monday at top
      endAngle = 90; // Sunday at bottom
    } else {
      // In normal: Monday at top left, Sunday at bottom left
      // Arc goes to the right (concave to the right)
      startAngle = -90; // Monday at top left
      endAngle = 90; // Sunday at bottom left
    }
    
    const angleStep = (endAngle - startAngle) / (weekDays.length - 1);

    return (
      <View style={styles.weekDaysContainer}>
        {weekDays.map((weekDay, index) => {
          // Vertical position: reversed so Monday at bottom, Sunday at top
          const relativeY = cumulativeYPositions[weekDays.length - 1] - cumulativeYPositions[index];
          
          // Horizontal position based on arc: reversed so Monday at bottom, Sunday at top
          const angle = endAngle - angleStep * index;
          const radian = (angle * Math.PI) / 180;
          let x = arcRadius * Math.cos(radian);
          
          // Horizontal position relative to container
          const containerWidth = 200;
          let relativeX;
          if (reversed) {
            // In reversed: Monday and Sunday should be on the right
            // x for Monday and Sunday = 0, so we need to add offset
            // Middle days have positive x, need to be inverted so arc goes to the left
            // Use formula: offset + invert x to create arc to the left
            const maxX = arcRadius; // Maximum x (for middle days)
            x = maxX - x; // Invert x to create arc to the left
            relativeX = containerWidth - 120 + x; // Monday and Sunday on the right
          } else {
            // In normal: Monday and Sunday on the left (x = 0)
            relativeX = x - 60; // 60 = half width of weekDayRow
          }

          const isActive = weekDay.isActive || false;
          const isMissed = weekDay.isMissed || false;
          const isStartDay = weekDay.isStartDay || false;
          const activeIcons = weekDay.activeIcons || [];

          // Get background style based on state
          const getBackgroundStyle = () => {
            if (isMissed) return styles.weekDayRowMissed;
            if (isStartDay) return styles.weekDayRowStart;
            if (isActive) return styles.weekDayRowActive;
            return { backgroundColor: theme.colors.neutral100 };
          };

          const RowComponent: any = isStartDay ? TouchableOpacity : View;

          return (
            <RowComponent
              key={index}
              style={[
                styles.weekDayRow,
                {
                  position: 'absolute',
                  left: relativeX,
                  top: relativeY,
                },
                getBackgroundStyle(),
              ]}
              activeOpacity={isStartDay ? 0.8 : undefined}
              onPress={isStartDay ? handleStartPress : undefined}
            >
              {/* Orange check mark for active state - not shown on start day */}
              {isActive && !isStartDay && (
                <View style={styles.checkMark}>
                  <View style={styles.checkMarkInner}>
                    <Text 
                      style={styles.checkMarkIcon}
                      allowFontScaling={false}
                    >
                      ✓
                    </Text>
                  </View>
                </View>
              )}

              {/* Red sad face for missed state - not shown on start day */}
              {isMissed && !isStartDay && (
                <View style={styles.sadMark}>
                  <View style={styles.sadMarkInner}>
                    <FontAwesomeIcon 
                      icon={faFaceSadTear as any} 
                      size={12} 
                      color="#FFF"
                    />
                  </View>
                </View>
              )}

              {/* Play button for start day - shown in top-right */}
              {isStartDay && (
                <View style={styles.startPlay}>
                  <View style={styles.startPlayInner}>
                    <FontAwesomeIcon
                      icon={faPlay as any}
                      size={8}
                      color="#FFF"
                    />
                  </View>
                </View>
              )}

              {/* Content row (text + icons) */}
              <View style={styles.weekDayContent}>
                <Text 
                  style={[
                    styles.weekDayText, 
                    { 
                      color: isMissed
                        ? '#FFF'
                        : isStartDay
                          ? '#FFF'
                          : isActive
                            ? theme.colors.textPrimary 
                            : theme.colors.neutral400,
                      zIndex: 1,
                    }
                  ]}
                  allowFontScaling={false}
                >
                  {weekDay.day}
                </Text>
                
                <View style={[styles.iconsRow, { zIndex: 1 }]}>
                  {weekDay.icons.map((iconName, iconIndex) => {
                    const isIconActive = isActive && activeIcons.includes(iconName);
                    const colors = ICON_COLORS[iconName];
                    
                    return (
                      <View 
                        key={iconIndex} 
                        style={[
                          styles.iconCircle, 
                          { 
                            backgroundColor: isStartDay
                              ? 'rgba(255,255,255,0.2)'
                              : isMissed
                                ? '#C57474'
                                : isIconActive 
                                  ? colors.bg 
                                  : theme.colors.neutral200 
                          }
                        ]}
                      >
                        {iconName === 'basket' ? (
                          <SvgXml 
                            xml={
                              isStartDay
                                ? changeSvgColorToWhite(DIET_SVG)
                                : isMissed 
                                  ? changeSvgColorToWhite(DIET_SVG) 
                                  : isIconActive 
                                    ? DIET_SVG 
                                    : changeSvgColor(DIET_SVG, theme.colors.neutral400)
                            } 
                            width={10} 
                            height={10}
                          />
                        ) : (
                          <FontAwesomeIcon 
                            icon={iconMap[iconName]} 
                            size={10} 
                            color={
                              isStartDay
                                ? '#FFF'
                                : isMissed 
                                  ? '#FFF' 
                                  : isIconActive 
                                    ? colors.icon 
                                    : theme.colors.neutral400
                            }
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

            </RowComponent>
          );
        })}
      </View>
    );
  };

  return (
      <View style={styles.wrapper}>
       
        <View style={[
          styles.mainContainer, 
          reversed && styles.mainContainerReversed
        ]}>
          
          {/* Main circle + dots */}
          <View style={styles.circleSection}>
            
            {/* SVG CIRCLE */}
            {renderCircleSvg()}

            {/* CENTER IMAGE */}
            <View style={styles.centerImageWrapper}>
              {onImagePress ? (
                <TouchableOpacity 
                  onPress={onImagePress}
                  activeOpacity={0.8}
                  style={styles.centerImageTouchable}
                >
                  <Image
                    source={typeof centerImage === 'string' ? { uri: centerImage } : centerImage}
                    style={styles.centerImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <Image
                  source={typeof centerImage === 'string' ? { uri: centerImage } : centerImage}
                  style={styles.centerImage}
                  resizeMode="contain"
                />
              )}
            </View>

          </View>

          <View style={[
            styles.weekSection,
            reversed && { marginRight: weekSectionMarginRight }
          ]}>
            {renderWeekDays()}
          </View>
          
        </View>

         {/* Text Section */}
         {(title || description) && (
          <View style={[styles.textSection , { marginBottom:title === '1st Week' ? 100 : 0 }]}>
            {title && (
              <Text 
                style={[styles.title, { color: theme.colors.textPrimary }]}
                allowFontScaling={false}
              >
                {title}
              </Text>
            )}
            {description && (
              <View style={styles.descriptionContainer}>
                <View style={[styles.decorativeLine, { backgroundColor: theme.colors.neutral400 }]} />
                <Text 
                  style={[styles.description, { color: theme.colors.textSecondary }]}
                  allowFontScaling={false}
                >
                  {description}
                </Text>
                <View style={[styles.decorativeLine, { backgroundColor: theme.colors.neutral400 }]} />
              </View>
            )}
          </View>
        )}

      </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginHorizontal: 16,
    paddingHorizontal: 8,
    // Extra padding to prevent icons from touching edges on small screens
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 4, // Extra padding to prevent icons from touching edges
    width:'100%',
    marginTop:40,
  },
  mainContainerReversed: {
    flexDirection: 'row-reverse',
    paddingLeft: 12,
    paddingRight: 4, // Extra padding on right side for reversed mode
  },
  
  circleSection: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    width:'50%',
    borderRadius:'50%',
    backgroundColor:'rgba(255,255,255,0.7)'

  },

  centerImageWrapper: {
    position: 'absolute',
    width: MAIN_RADIUS * 1.2,
    height: MAIN_RADIUS * 1.2,
    alignItems:"center",
    justifyContent:"center",
  },
  centerImageTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerImage: {
    width: '100%',
    height: '100%',
  },

  weekSection: {
    position: 'relative',
    width:'50%',
    height: 6 * 20 + 30 * 7, // Height based on equal spacing (7 days, 6 gaps)
  },
  weekDaysContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  weekDayRow: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  weekDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekDayRowActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  weekDayRowMissed: {
    backgroundColor: '#8B4D4D',
    borderWidth: 1,
    borderColor: '#FF6666',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  weekDayRowStart: {
    backgroundColor: '#FF6900',
    shadowColor: '#FF6900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  weekDayRowStartContainer: {
    flexDirection: 'column',
    paddingBottom: 0,
    overflow: 'hidden',
  },
  startButton: {
    backgroundColor: '#FF6900',
    marginTop: 8,
    marginHorizontal: -12,
    marginBottom: -8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    boxSizing:'border-box'
  },
  startButtonText: {
    color: '#FFF',
    fontSize: responsiveUtils.getFixedFontSize(14),
    fontFamily: 'MPLUSRounded1c-Bold',
    fontWeight: 'bold',
    marginTop:8,
    marginBottom:12,
  },
  checkMark: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  checkMarkInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    zIndex:10
  },
  sadMark: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  sadMarkInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3838',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startPlay: {
    position: 'absolute',
    top: -12,
    right: -12,
    zIndex: 10,
  },
  startPlayInner: {
    width: 25,
    height: 25,
    borderRadius: '50%',
    backgroundColor: '#CA3500', // orange700
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  weekDayText: {
    fontSize: responsiveUtils.getDayLabelFontSize(),
    fontWeight: '600',
    marginRight: 8,
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf:'center',
    marginRight:'auto',
    marginLeft:'auto',
    marginTop:64
  },
  title: {
    fontSize: responsiveUtils.getFixedFontSize(18),
    fontFamily: 'MPLUSRounded1c-Bold',
    textAlign: 'center',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  decorativeLine: {
    flex: 1,
    height: 1,
  },
  description: {
    fontSize: responsiveUtils.getFixedFontSize(12),
    fontFamily: 'MPLUSRounded1c-Regular',
    lineHeight: responsiveUtils.getFixedLineHeight(12, 20),
    paddingHorizontal: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
});

// Memoize component to prevent unnecessary re-renders
export const WeekCycleView = React.memo(WeekCycleViewComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.reversed === nextProps.reversed &&
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.onStartPress === nextProps.onStartPress &&
    prevProps.onImagePress === nextProps.onImagePress &&
    prevProps.isActive === nextProps.isActive &&
    JSON.stringify(prevProps.circleIcons) === JSON.stringify(nextProps.circleIcons) &&
    JSON.stringify(prevProps.weekDays) === JSON.stringify(nextProps.weekDays) &&
    prevProps.centerImage === nextProps.centerImage
  );
});
