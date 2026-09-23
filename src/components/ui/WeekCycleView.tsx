import React from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
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
  faBrain,
  faFaceSadTear,
  faLock,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { HOME_CARE_ICONS, type HomeCareIcon } from '../../utils/homeDayState';

const MAIN_CIRCLE_DIAMETER = responsiveUtils.getWeekCycleMainCircleDiameter();
const MAIN_RADIUS = MAIN_CIRCLE_DIAMETER / 2;

const DOT_SIZE = responsiveUtils.getWeekCycleDotSize();
const DOT_RADIUS = DOT_SIZE / 2;
const ICON_SIZE = responsiveUtils.getWeekCycleIconSize();
const ICON_STROKE_WIDTH = 1.5;
const WEEK_DAY_ROW_WIDTH = 120;

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
const waveViewBoxMatch = WAVE_BACKGROUND_SVG.match(/viewBox="([^"]*)"/);
const WAVE_VIEW_BOX = waveViewBoxMatch
  ? waveViewBoxMatch[1].split(' ').map(Number)
  : [0, 0, 113, 29];
const WAVE_WIDTH = WAVE_VIEW_BOX[2] || 113;
const WAVE_HEIGHT = WAVE_VIEW_BOX[3] || 29;

const wavePathMatches = WAVE_BACKGROUND_SVG.match(
  /<path[^>]*d="([^"]*)"[^>]*fill="([^"]*)"[^>]*>/g,
);
const WAVE_PATHS = wavePathMatches
  ? wavePathMatches
      .map(pathXml => {
        const dMatch = pathXml.match(/d="([^"]*)"/);
        const fillMatch = pathXml.match(/fill="([^"]*)"/);
        return {
          d: dMatch ? dMatch[1] : '',
          fill: fillMatch ? fillMatch[1] : '#FF6900',
        };
      })
      .filter(path => path.d)
  : [];

interface CircleIcon {
  index: number;
  iconPath?: string;
  percentage?: number; // Icon fill percentage (0-100)
}

interface SystemProgressIconProps {
  svgXml: string;
  width: number;
  height: number;
  percentage: number;
  uniqueId: string;
}

// Shared static percentage fill. Keeping the SVG mask stationary avoids the
// redraw cost that animated masks caused on lower-end Android devices.
export const SystemProgressIcon: React.FC<SystemProgressIconProps> =
  React.memo(({ svgXml, width, height, percentage, uniqueId }) => {
    const { viewBox, svgWidth, svgHeight, iconPathData } =
      React.useMemo(() => {
        const viewBoxMatch = svgXml.match(/viewBox="([^"]*)"/);
        const parsedViewBox = viewBoxMatch
          ? viewBoxMatch[1].split(' ').map(Number)
          : [0, 0, width, height];
        const parsedSvgWidth = parsedViewBox[2] || width;
        const parsedSvgHeight = parsedViewBox[3] || height;
        const pathMatches = svgXml.match(
          /<path[^>]*d="([^"]*)"[^>]*>/g,
        );
        const parsedPaths = pathMatches
          ? pathMatches
              .map(pathXml => {
                const dMatch = pathXml.match(/d="([^"]*)"/);
                const strokeMatch =
                  pathXml.match(/stroke="([^"]*)"/);
                const fillMatch =
                  pathXml.match(/fill="([^"]*)"/);
                const strokeWidthMatch = pathXml.match(
                  /stroke-width="([^"]*)"/,
                );
                return {
                  d: dMatch ? dMatch[1] : '',
                  stroke: strokeMatch
                    ? strokeMatch[1]
                    : undefined,
                  fill: fillMatch
                    ? fillMatch[1]
                    : 'transparent',
                  strokeWidth: strokeWidthMatch
                    ? strokeWidthMatch[1]
                    : undefined,
                };
              })
              .filter(path => path.d)
          : [];

        return {
          viewBox: parsedViewBox,
          svgWidth: parsedSvgWidth,
          svgHeight: parsedSvgHeight,
          iconPathData: parsedPaths,
        };
      }, [height, svgXml, width]);
    const normalizedPercentage = Math.min(
      100,
      Math.max(0, percentage),
    );
    const fillHeight =
      (svgHeight * normalizedPercentage) / 100;

    return (
      <View style={{ width, height }}>
        {normalizedPercentage > 0 &&
        iconPathData.length > 0 ? (
          <Svg
            width={width}
            height={height}
            viewBox={viewBox.join(' ')}
          >
            <Defs>
              <ClipPath
                id={`staticPercentageClip-${uniqueId}`}
              >
                <Rect
                  x="0"
                  y={svgHeight - fillHeight}
                  width={svgWidth}
                  height={fillHeight}
                />
              </ClipPath>

              <Mask id={`staticIconMask-${uniqueId}`}>
                <Rect
                  width={svgWidth}
                  height={svgHeight}
                  fill="black"
                />
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

            <G
              mask={`url(#staticIconMask-${uniqueId})`}
              clipPath={`url(#staticPercentageClip-${uniqueId})`}
            >
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
          <SvgXml
            xml={svgXml}
            width={width}
            height={height}
          />
        )}
      </View>
    );
  });

// Static wave fill for the active week. Motion is kept outside the SVG tree
// so masks and icon paths are not redrawn on every animation frame.
const IconWithWave: React.FC<{
  svgXml: string;
  width: number;
  height: number;
  percentage: number;
  uniqueId: string;
}> = ({ svgXml, width, height, percentage, uniqueId }) => {
  const { viewBox, svgWidth, svgHeight, iconPathData } = React.useMemo(() => {
    const viewBoxMatch = svgXml.match(/viewBox="([^"]*)"/);
    const parsedViewBox = viewBoxMatch
      ? viewBoxMatch[1].split(' ').map(Number)
      : [0, 0, width, height];
    const parsedSvgWidth = parsedViewBox[2] || width;
    const parsedSvgHeight = parsedViewBox[3] || height;
    const pathMatches = svgXml.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
    const parsedPaths = pathMatches
      ? pathMatches
          .map(pathXml => {
            const dMatch = pathXml.match(/d="([^"]*)"/);
            const strokeMatch = pathXml.match(/stroke="([^"]*)"/);
            const fillMatch = pathXml.match(/fill="([^"]*)"/);
            const strokeWidthMatch = pathXml.match(/stroke-width="([^"]*)"/);
            return {
              d: dMatch ? dMatch[1] : '',
              stroke: strokeMatch ? strokeMatch[1] : undefined,
              fill: fillMatch ? fillMatch[1] : 'transparent',
              strokeWidth: strokeWidthMatch ? strokeWidthMatch[1] : undefined,
            };
          })
          .filter(path => path.d)
      : [];

    return {
      viewBox: parsedViewBox,
      svgWidth: parsedSvgWidth,
      svgHeight: parsedSvgHeight,
      iconPathData: parsedPaths,
    };
  }, [height, svgXml, width]);

  const fillHeight = (svgHeight * percentage) / 100;

  return (
    <View style={{ width, height }}>
      {percentage > 0 && WAVE_PATHS.length > 0 && iconPathData.length > 0 ? (
        <>
          <Svg width={width} height={height} viewBox={viewBox.join(' ')}>
            <Defs>
              <Pattern
                id={`wavePattern-${uniqueId}`}
                x="0"
                y={svgHeight - fillHeight}
                width={WAVE_WIDTH}
                height={WAVE_HEIGHT}
                patternUnits="userSpaceOnUse"
              >
                {WAVE_PATHS.map((wavePath, idx) => (
                  <Path key={idx} d={wavePath.d} fill={wavePath.fill} />
                ))}
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
        </>
      ) : (
        <SvgXml xml={svgXml} width={width} height={height} />
      )}
    </View>
  );
};

interface WeekDay {
  day: string;
  icons: readonly HomeCareIcon[];
  isActive?: boolean;
  activeIcons?: readonly HomeCareIcon[]; // Which icons are active
  isMissed?: boolean; // Day is completely missed
  isStartDay?: boolean; // Day can be started
}

// Icon colors for active state
const ICON_COLORS = {
  heart: { bg: '#FFF5E0', icon: '#F5B800' },      // Yellow
  basket: { bg: '#E8F5E9', icon: '#4CAF50' },     // Green
  running: { bg: '#E3F2FD', icon: '#2196F3' },    // Blue
  mental: { bg: '#F2E8F7', icon: '#70428F' },     // Purple
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
  weekState?: 'current' | 'review' | 'future' | 'complete';
  chapterLabel?: string;
  progressPercent?: number;
}

const DEFAULT_WEEK_DAYS: WeekDay[] = [
  { day: 'Mon', icons: HOME_CARE_ICONS },
  { day: 'Tue', icons: HOME_CARE_ICONS },
  { day: 'Wed', icons: HOME_CARE_ICONS },
  { day: 'Thu', icons: HOME_CARE_ICONS },
  { day: 'Fri', icons: HOME_CARE_ICONS },
  { day: 'Sat', icons: HOME_CARE_ICONS },
  { day: 'Sun', icons: HOME_CARE_ICONS },
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
  weekState = 'future',
  chapterLabel,
  progressPercent,
}) => {

  const theme = useTheme();
  const { t } = useTranslation();
  const [weekSectionWidth, setWeekSectionWidth] = React.useState(
    Dimensions.get('window').width / 2,
  );

  const handleWeekSectionLayout = React.useCallback((event: any) => {
    const width = event?.nativeEvent?.layout?.width ?? 0;
    if (width > 0) {
      setWeekSectionWidth(current => current === width ? current : width);
    }
  }, []);

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
                <SystemProgressIcon
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
      running: faRunning,
      mental: faBrain,
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
          const x = arcRadius * Math.cos(radian);
          
          // Horizontal position relative to container
          const relativeX = reversed
            ? weekSectionWidth - x - WEEK_DAY_ROW_WIDTH / 2
            : x - WEEK_DAY_ROW_WIDTH / 2;

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

          <View
            style={styles.weekSection}
            onLayout={handleWeekSectionLayout}
          >
            {renderWeekDays()}
          </View>
          
        </View>

         {/* Text Section */}
         {(title || description) && (
          <View style={[styles.textSection , { marginBottom:title === '1st Week' ? 100 : 0 }]}>
            <View style={styles.weekMeta}>
              {typeof progressPercent === 'number' ? (
                <View
                  accessibilityLabel={`Week progress ${progressPercent} percent`}
                  style={styles.progressRing}
                >
                  <Svg width={28} height={28}>
                    <Circle
                      cx={14}
                      cy={14}
                      r={10}
                      fill="none"
                      stroke="#FFE3CF"
                      strokeWidth={3}
                    />
                    <Circle
                      cx={14}
                      cy={14}
                      r={10}
                      fill="none"
                      stroke="#FF6900"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 10}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        10 *
                        (1 - progressPercent / 100)
                      }
                      transform="rotate(-90 14 14)"
                    />
                  </Svg>
                  <Text style={styles.progressRingText}>
                    {progressPercent}
                  </Text>
                </View>
              ) : null}
              {chapterLabel ? (
                <Text style={styles.chapterLabel}>
                  {chapterLabel}
                </Text>
              ) : null}
              <View style={styles.statePill}>
                {weekState === 'future' ? (
                  <FontAwesomeIcon
                    icon={faLock}
                    size={9}
                    color={theme.colors.neutral500}
                  />
                ) : null}
                <Text style={styles.stateText}>
                  {weekState === 'current'
                    ? t('home.current_week')
                    : weekState === 'review'
                    ? t('home.review_available')
                    : weekState === 'complete'
                    ? t('home.journey_complete')
                    : t('home.future_week')}
                </Text>
              </View>
            </View>
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
    paddingHorizontal: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    width: WEEK_DAY_ROW_WIDTH,
  },
  weekDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    width: 28,
    marginRight: 4,
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  iconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
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
  weekMeta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  progressRing: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    position: 'absolute',
    color: '#9B4B20',
    fontSize: responsiveUtils.getFixedFontSize(7),
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  chapterLabel: {
    color: '#70428F',
    fontSize: responsiveUtils.getFixedFontSize(10),
    fontFamily: 'MPLUSRounded1c-Bold',
  },
  statePill: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: '#F7F4F2',
    gap: 5,
  },
  stateText: {
    color: '#756C67',
    fontSize: responsiveUtils.getFixedFontSize(9),
    fontFamily: 'MPLUSRounded1c-Medium',
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

const circleIconsEqual = (
  previous: CircleIcon[] | undefined,
  next: CircleIcon[] | undefined,
): boolean => {
  if (previous === next) return true;
  if (!previous || !next || previous.length !== next.length) return false;

  return previous.every((icon, index) => {
    const nextIcon = next[index];
    return (
      icon.index === nextIcon.index &&
      icon.iconPath === nextIcon.iconPath &&
      icon.percentage === nextIcon.percentage
    );
  });
};

const weekDaysEqual = (
  previous: WeekDay[] | undefined,
  next: WeekDay[] | undefined,
): boolean => {
  if (previous === next) return true;
  if (!previous || !next || previous.length !== next.length) return false;

  return previous.every((day, index) => {
    const nextDay = next[index];
    return (
      day.day === nextDay.day &&
      day.isActive === nextDay.isActive &&
      day.isMissed === nextDay.isMissed &&
      day.isStartDay === nextDay.isStartDay &&
      day.icons.length === nextDay.icons.length &&
      day.icons.every((icon, iconIndex) => icon === nextDay.icons[iconIndex]) &&
      (day.activeIcons?.length ?? 0) === (nextDay.activeIcons?.length ?? 0) &&
      (day.activeIcons?.every(
        (icon, iconIndex) => icon === nextDay.activeIcons?.[iconIndex],
      ) ?? true)
    );
  });
};

export const WeekCycleView = React.memo(WeekCycleViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.reversed === nextProps.reversed &&
    prevProps.title === nextProps.title &&
    prevProps.description === nextProps.description &&
    prevProps.onStartPress === nextProps.onStartPress &&
    prevProps.onImagePress === nextProps.onImagePress &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.weekState === nextProps.weekState &&
    prevProps.chapterLabel === nextProps.chapterLabel &&
    prevProps.progressPercent === nextProps.progressPercent &&
    circleIconsEqual(prevProps.circleIcons, nextProps.circleIcons) &&
    weekDaysEqual(prevProps.weekDays, nextProps.weekDays) &&
    prevProps.centerImage === nextProps.centerImage
  );
});
