import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { SUN_SVG, CLOUD_SVG } from '../../utils/svgIcons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SUN_SIZE = 72;
const CLOUD_SIZE = 48;

export const HomeBackgroundDecorations: React.FC = () => {
  const sunRotation = useSharedValue(0);
  const cloud1TranslateX = useSharedValue(0);
  const cloud2TranslateX = useSharedValue(0);
  const cloud3TranslateX = useSharedValue(0);

  useEffect(() => {
    // Sun: very slow smooth infinite rotation (one full rotation ~20s)
    sunRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Clouds: gentle horizontal drift - use 0..1 for interpolation, different speeds
    cloud1TranslateX.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    cloud2TranslateX.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    cloud3TranslateX.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [sunRotation, cloud1TranslateX, cloud2TranslateX, cloud3TranslateX]);

  const sunAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sunRotation.value}deg` }],
  }));

  const cloud1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud1TranslateX.value * 20 }],
  }));

  const cloud2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -cloud2TranslateX.value * 18 }],
  }));

  const cloud3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cloud3TranslateX.value * 14 }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Sun - top right */}
      <Animated.View style={[styles.sunContainer, sunAnimatedStyle]}>
        <SvgXml xml={SUN_SVG} width={SUN_SIZE} height={SUN_SIZE} />
      </Animated.View>

      {/* Cloud 1 - top area, left of sun */}
      <Animated.View style={[styles.cloud1, cloud1AnimatedStyle]}>
        <SvgXml xml={CLOUD_SVG} width={CLOUD_SIZE} height={CLOUD_SIZE} />
      </Animated.View>

      {/* Cloud 2 - middle-right */}
      <Animated.View style={[styles.cloud2, cloud2AnimatedStyle]}>
        <SvgXml xml={CLOUD_SVG} width={CLOUD_SIZE * 0.85} height={CLOUD_SIZE * 0.85} />
      </Animated.View>

      {/* Cloud 3 - upper-mid */}
      <Animated.View style={[styles.cloud3, cloud3AnimatedStyle]}>
        <SvgXml xml={CLOUD_SVG} width={CLOUD_SIZE * 0.7} height={CLOUD_SIZE * 0.7} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0.5,
  },
  sunContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    opacity: 0.9,
  },
  cloud1: {
    position: 'absolute',
    top: 100,
    right: SCREEN_WIDTH * 0.35,
    opacity: 0.5,
  },
  cloud2: {
    position: 'absolute',
    top: 180,
    right: 40,
    opacity: 0.4,
  },
  cloud3: {
    position: 'absolute',
    top: 140,
    right: SCREEN_WIDTH * 0.5,
    opacity: 0.35,
  },
});
