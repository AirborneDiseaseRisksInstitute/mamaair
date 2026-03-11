import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faDroplet,
  faFaceSmile,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate card width: screen width - content padding (left/right) - container padding (left/right) - gaps between cards
const CARD_WIDTH = (SCREEN_WIDTH - spacing('md') * 2 - 16 * 2 - 8 * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

// Generate smooth wave path using cubic bezier curves
const generateSmoothWavePath = (
  width: number,
  height: number,
  waveHeight: number,
  phase: number,
  layerOffset: number = 0
): string => {
  const waveLength = width * 0.8;
  const startY = height - waveHeight - layerOffset;
  
  // Create smooth wave using cubic bezier curves
  const amplitude = 15 + layerOffset * 0.5;
  
  // Calculate wave points with phase offset
  const x1 = phase * waveLength;
  const x2 = x1 + waveLength * 0.25;
  const x3 = x1 + waveLength * 0.5;
  const x4 = x1 + waveLength * 0.75;
  const x5 = x1 + waveLength;
  
  // Normalize x positions to create seamless loop
  const normalizeX = (x: number) => ((x % waveLength) + waveLength) % waveLength - waveLength;
  
  const points = [];
  const numWaves = 4;
  
  for (let i = -1; i < numWaves; i++) {
    const baseX = i * waveLength * 0.5 + phase * width;
    const normalizedBaseX = baseX - Math.floor(baseX / (width * 2)) * (width * 2);
    
    const y1 = startY + Math.sin((normalizedBaseX / width) * Math.PI * 2) * amplitude;
    const y2 = startY + Math.sin(((normalizedBaseX + waveLength * 0.25) / width) * Math.PI * 2) * amplitude;
    
    if (i === -1) {
      points.push(`M ${normalizedBaseX - width} ${y1}`);
    }
    
    // Smooth bezier curve
    const cpX1 = normalizedBaseX + waveLength * 0.125 - width;
    const cpY1 = y1 + (y2 - y1) * 0.5 - amplitude * 0.3;
    const cpX2 = normalizedBaseX + waveLength * 0.25 - waveLength * 0.125 - width;
    const cpY2 = y2 - (y2 - y1) * 0.5 + amplitude * 0.3;
    
    points.push(`C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${normalizedBaseX + waveLength * 0.25 - width} ${y2}`);
  }
  
  // Close the path
  points.push(`L ${width * 2} ${height}`);
  points.push(`L ${-width} ${height}`);
  points.push('Z');
  
  return points.join(' ');
};

// Simplified wave generation for seamless loop
const generateWave = (
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  phase: number
): string => {
  const points: string[] = [];
  const segments = 60;
  const waveFrequency = 2; // Number of complete waves across the width
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width * 2 - width;
    // Phase directly controls the wave position for seamless loop
    const waveX = (x / width) * Math.PI * waveFrequency + phase;
    const y = baseY + Math.sin(waveX) * amplitude;
    
    if (i === 0) {
      points.push(`M ${x} ${y}`);
    } else {
      points.push(`L ${x} ${y}`);
    }
  }
  
  points.push(`L ${width} ${height}`);
  points.push(`L ${-width} ${height}`);
  points.push('Z');
  
  return points.join(' ');
};

type CardType = 'water' | 'mood' | 'feeling';

interface WaveCardProps {
  type: CardType;
  percentage: number;
  label: string;
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
}) => {
  const theme = useTheme();
  const config = CARD_CONFIGS[type];
  const animValue = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState(0);
  
  // Single animation driving all waves - seamless loop
  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animValue, {
        toValue: 1,
        duration: 12000, // Slower animation
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    
    animation.start();
    
    const listener = animValue.addListener(({ value }) => {
      // Use Math.PI * 2 for seamless sine wave loop
      setPhase(value * Math.PI * 2);
    });
    
    return () => {
      animation.stop();
      animValue.removeListener(listener);
    };
  }, []);
  
  // Calculate base height from percentage
  const baseWaveHeight = (CARD_HEIGHT * percentage) / 100;
  
  // Generate wave paths with different offsets but same phase
  const waveLayers = useMemo(() => {
    const layers = [];
    const numLayers = 5;
    
    for (let i = 0; i < numLayers; i++) {
      // Layer 0 is the back (lightest, highest), layer 4 is the front (darkest, lowest)
      const reverseIndex = numLayers - 1 - i;
      const layerOffset = reverseIndex * 10; // Vertical offset - back layers are higher
      const amplitudeVariation = 6 + reverseIndex * 1.5; // Back layers have more amplitude
      const phaseOffset = reverseIndex * 0.2; // Small phase offset for depth effect
      
      const baseY = CARD_HEIGHT - baseWaveHeight - layerOffset;
      const path = generateWave(
        CARD_WIDTH,
        CARD_HEIGHT,
        baseY,
        amplitudeVariation,
        phase + phaseOffset
      );
      
      // Use reversed color index: back layers get lighter colors
      layers.push({
        path,
        color: config.colors.waves[numLayers - 1 - i],
      });
    }
    
    return layers; // Already in correct order: back to front
  }, [phase, baseWaveHeight, config.colors.waves]);
  
  const styles = useMemo(() => StyleSheet.create({
    container: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 8,
      backgroundColor: '#FFF',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing('sm'),
      gap: 6,
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
      fontSize: 12,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    waveContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      overflow: 'hidden',
    },
    svgContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: CARD_WIDTH * 2,
      height: CARD_HEIGHT,
    },
    percentageContainer: {
      position: 'absolute',
      bottom: spacing('sm'),
      left: spacing('sm'),
      zIndex: 10,
    },
    percentageText: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#FFF',
    },
  }), [theme, config]);

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
        <Text style={styles.label} allowFontScaling={false}>{label}</Text>
      </View>

      {/* Wave animation - all layers in one SVG */}
      <View style={styles.waveContainer}>
        <Svg 
          width={CARD_WIDTH * 2} 
          height={CARD_HEIGHT} 
          style={styles.svgContainer}
        >
          {waveLayers.map((layer, index) => (
            <Path 
              key={index}
              d={layer.path} 
              fill={layer.color}
            />
          ))}
        </Svg>
      </View>

      {/* Percentage */}
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText} allowFontScaling={false}>{percentage}%</Text>
      </View>
    </View>
  );
};
