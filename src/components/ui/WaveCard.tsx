import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faDroplet,
  faFaceSmile,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';

// Build two identical wave periods. The strip can then move by exactly one
// card width and loop without a visible seam.
const generateWave = (
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  phase: number,
): string => {
  const points: string[] = [];
  const segments = 32;

  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width * 2;
    const waveX = (x / width) * Math.PI * 2 + phase;
    const y = baseY + Math.sin(waveX) * amplitude;

    if (i === 0) {
      points.push(`M ${x} ${y}`);
    } else {
      points.push(`L ${x} ${y}`);
    }
  }

  points.push(`L ${width * 2} ${height}`);
  points.push(`L 0 ${height}`);
  points.push('Z');

  return points.join(' ');
};

type CardType = 'water' | 'mood' | 'feeling';

interface WaveCardProps {
  type: CardType;
  percentage: number;
  label: string;
  value?: string;
  compact?: boolean;
  animationProgress: Animated.Value;
  availableWidth?: number;
}

const CARD_CONFIGS = {
  water: {
    icon: faDroplet,
    colors: {
      icon: '#155DFC',
      iconBg: '#E3F2FD',
      // 5 layers from darkest (bottom) to lightest (top) - blue spectrum towards #155DFC, 4-5 shades lighter
      waves: ['#4285F4', '#5C95F5', '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD'],
    },
  },
  mood: {
    icon: faFaceSmile,
    colors: {
      icon: '#FB2C36',
      iconBg: '#FFEBEE',
      // Red spectrum towards #FB2C36, 4-5 shades lighter
      waves: ['#F44336', '#FB2C36', '#FF5252', '#FF6B6B', '#FF8A80', '#FFCDD2'],
    },
  },
  feeling: {
    icon: faLeaf,
    colors: {
      icon: '#00C950',
      iconBg: '#E8F5E9',
      // Green spectrum towards #00C950, 4-5 shades lighter
      waves: ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'],
    },
  },
};

export const WaveCard: React.FC<WaveCardProps> = ({
  type,
  percentage,
  label,
  value,
  compact = false,
  animationProgress,
  availableWidth,
}) => {
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const config = CARD_CONFIGS[type];
  // Page padding + parent-card padding + two gaps between three cards.
  const cardWidth = availableWidth
    ? (availableWidth - spacing('sm') * 2) / 3
    : (screenWidth -
        spacing('md') * 2 -
        16 * 2 -
        spacing('sm') * 2) /
      3;

  const cardHeight = cardWidth * (compact ? 1.08 : 1.4);

  // Calculate base height from percentage
  const baseWaveHeight = (cardHeight * percentage) / 100;

  const waveTranslateX = useMemo(
    () =>
      animationProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -cardWidth],
      }),
    [animationProgress, cardWidth],
  );

  // These paths are recalculated only when the card geometry or data changes.
  const waveLayers = useMemo(() => {
    const layers = [];
    const numLayers = 3;
    const paletteIndexes = [4, 2, 0];
    const typePhase =
      type === 'water' ? 0 : type === 'mood' ? 0.85 : 1.7;

    for (let i = 0; i < numLayers; i++) {
      // Back layers sit slightly higher and lighter to create depth without
      // visually overstating the actual percentage.
      const reverseIndex = numLayers - 1 - i;
      const layerOffset = reverseIndex * 6;
      const amplitudeVariation = 5 + reverseIndex * 1.6;
      const phaseOffset = typePhase + reverseIndex * 0.34;

      const baseY = cardHeight - baseWaveHeight - layerOffset;
      const path = generateWave(
        cardWidth,
        cardHeight,
        baseY,
        amplitudeVariation,
        phaseOffset,
      );

      // Keep only a light, middle and dark semantic shade.
      layers.push({
        path,
        color: config.colors.waves[paletteIndexes[i]],
      });
    }

    return layers;
  }, [
    baseWaveHeight,
    cardWidth,
    cardHeight,
    config.colors.waves,
    type,
  ]);
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: cardWidth,
      height: cardHeight,
      borderRadius: compact ? 14 : 8,
      borderWidth: compact ? 1 : 0,
      borderColor: compact
        ? config.colors.iconBg
        : 'transparent',
      backgroundColor: '#FFF',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: compact ? 0 : 0.08,
      shadowRadius: 8,
      elevation: compact ? 0 : 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('sm'),
      gap: 5,
      zIndex: 10,
    },
    iconWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: config.colors.iconBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: compact ? 11 : 12,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    headerCopy: {
      flex: 1,
    },
    value: {
      marginTop: 1,
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: 9,
    },
    waveContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      overflow: 'hidden',
    },
    waveStrip: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: cardWidth * 2,
      height: cardHeight,
    },
    percentageContainer: {
      position: 'absolute',
      bottom: spacing('sm'),
      left: spacing('sm'),
      zIndex: 10,
    },
    percentageText: {
      fontSize: compact ? 16 : 18,
      fontFamily: theme.typography.fontFamily.bold,
      color:
        percentage < 12
          ? config.colors.icon
          : '#FFF',
    },
  }), [
    cardHeight,
    cardWidth,
    compact,
    config,
    percentage,
    theme,
  ]);

  return (
    <View style={styles.container}>
      {/* Header with icon and label */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <FontAwesomeIcon 
            icon={config.icon as any} 
            size={12} 
            color={config.colors.icon}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text
            numberOfLines={1}
            style={styles.label}
            allowFontScaling={false}
          >
            {label}
          </Text>
          {value ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={styles.value}
              allowFontScaling={false}
            >
              {value}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Wave animation - all layers in one SVG */}
      <View style={styles.waveContainer}>
        <Animated.View
          pointerEvents="none"
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[
            styles.waveStrip,
            {
              transform: [{ translateX: waveTranslateX }],
            },
          ]}
        >
          <Svg width={cardWidth * 2} height={cardHeight}>
            {waveLayers.map((layer, index) => (
              <Path
                key={index}
                d={layer.path}
                fill={layer.color}
              />
            ))}
          </Svg>
        </Animated.View>
      </View>

      {/* Percentage */}
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText} allowFontScaling={false}>{percentage}%</Text>
      </View>
    </View>
  );
};
