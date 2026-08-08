import React, { useCallback, useEffect, useRef } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import type { AirExposure } from '../../services/api/ExposureService';
import { useTheme } from '../../theme';
import { resolveAirQualityLevel } from '../../utils/airQualitySummary';
import type { AirQualityLevel } from '../../utils/airQualitySummary';
import { resolveAirQualityPulseLayout } from '../../utils/airQualityPulseLayout';

interface AirQualityPulseToastProps {
  airExposure: AirExposure;
  animate: boolean;
  onDismiss: () => void;
}

interface Tone {
  accent: string;
  accentDark: string;
  gradient: string[];
  shadow: string;
}

const TONES: Record<AirQualityLevel, Tone> = {
  good: {
    accent: '#2F9D6A',
    accentDark: '#176642',
    gradient: ['#FBFFFD', '#E9F8F0', '#F8FFF9'],
    shadow: '#2F9D6A',
  },
  moderate: {
    accent: '#D49419',
    accentDark: '#79520A',
    gradient: ['#FFFEF8', '#FFF4D8', '#FFFDF6'],
    shadow: '#B67A08',
  },
  unhealthy_sensitive: {
    accent: '#E77B1B',
    accentDark: '#8D4106',
    gradient: ['#FFFCF8', '#FFF0DE', '#FFF9F2'],
    shadow: '#D4610D',
  },
  unhealthy: {
    accent: '#E45358',
    accentDark: '#8D252D',
    gradient: ['#FFF9F9', '#FFE7E8', '#FFF7F5'],
    shadow: '#C83940',
  },
  very_unhealthy: {
    accent: '#9656A8',
    accentDark: '#5D2E6A',
    gradient: ['#FFFAFF', '#F5E9F8', '#FFF8FC'],
    shadow: '#7D3E8E',
  },
  hazardous: {
    accent: '#8A2744',
    accentDark: '#561429',
    gradient: ['#FFF9FB', '#F5E4E9', '#FFF7F8'],
    shadow: '#6E1832',
  },
  unavailable: {
    accent: '#737373',
    accentDark: '#404040',
    gradient: ['#FFFFFF', '#F3F3F3', '#FAFAFA'],
    shadow: '#525252',
  },
};

const appLogoSource = require('../../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');

export const AirQualityPulseToast: React.FC<AirQualityPulseToastProps> = ({
  airExposure,
  animate,
  onDismiss,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const openProgress = useSharedValue(0);
  const dismissTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const level = resolveAirQualityLevel(airExposure);
  const tone = TONES[level];
  const {
    circleTop,
    contentTopPadding,
    contentWidth,
    diameter,
  } = resolveAirQualityPulseLayout(width);

  useEffect(() => {
    cancelAnimation(openProgress);

    if (!animate) {
      openProgress.value = 1;
      return undefined;
    }

    openProgress.value = 0;
    openProgress.value = withDelay(
      260,
      withSpring(1, {
        damping: 15,
        stiffness: 115,
        mass: 0.75,
        overshootClamping: false,
      }),
    );

    return () => {
      cancelAnimation(openProgress);
    };
  }, [animate, openProgress]);

  useEffect(
    () => () => {
      if (dismissTimeout.current) {
        clearTimeout(dismissTimeout.current);
      }
    },
    [],
  );

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(openProgress.value, 0), 1) * 0.5,
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => {
    const size = interpolate(openProgress.value, [0, 1], [0, diameter]);

    return {
      width: size,
      height: size,
      left: (width - size) / 2,
      top: interpolate(openProgress.value, [0, 1], [0, circleTop]),
      borderRadius: size / 2,
      opacity: interpolate(openProgress.value, [0, 0.06, 1], [0, 1, 1]),
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openProgress.value, [0.62, 0.86, 1], [0, 0.65, 1]),
    transform: [
      {
        scale: interpolate(openProgress.value, [0.62, 1], [0.94, 1]),
      },
    ],
  }));

  const handleDismiss = useCallback(() => {
    if (dismissTimeout.current) {
      return;
    }

    cancelAnimation(openProgress);
    openProgress.value = animate
      ? withTiming(0, {
          duration: 280,
          easing: Easing.in(Easing.cubic),
        })
      : 0;
    dismissTimeout.current = setTimeout(onDismiss, animate ? 290 : 0);
  }, [animate, onDismiss, openProgress]);

  const statusLabel = t(`home_air_pulse.status_${level}`);
  const guidanceLabel = t(`home_air_pulse.guidance_${level}`);
  const detailsHint = t('home_air_pulse.details_hint');
  const accessibilityLabel = [
    t('home_air_pulse.eyebrow'),
    statusLabel,
    guidanceLabel,
    detailsHint,
  ].join('. ');

  return (
    <View style={styles.host} accessibilityLiveRegion="polite">
      <Animated.View
        style={[styles.backdrop, backdropAnimatedStyle]}
        pointerEvents="none"
      />

      <Animated.View
        accessible
        accessibilityRole="alert"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.circle,
          {
            borderColor: `${tone.accent}52`,
            shadowColor: tone.shadow,
          },
          circleAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={tone.gradient}
          start={{ x: 0.12, y: 0 }}
          end={{ x: 0.86, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            styles.ambientBubble,
            styles.ambientBubbleTop,
            { backgroundColor: `${tone.accent}14` },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.ambientBubble,
            styles.ambientBubbleBottom,
            { backgroundColor: `${theme.colors.orange400}0D` },
          ]}
        />

        <Animated.View
          style={[
            styles.content,
            { paddingTop: contentTopPadding },
            contentAnimatedStyle,
          ]}
        >
          <View style={styles.appLogoContainer}>
            <Image
              source={appLogoSource}
              style={styles.appLogo}
              resizeMode="contain"
            />
          </View>

          <View
            style={[
              styles.eyebrowRow,
              { maxWidth: contentWidth },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: tone.accent }]} />
            <Text style={styles.eyebrow} allowFontScaling={false}>
              {t('home_air_pulse.eyebrow')}
            </Text>
          </View>
          <Text
            style={[
              styles.status,
              {
                color: tone.accentDark,
                maxWidth: contentWidth,
              },
            ]}
            allowFontScaling={false}
          >
            {statusLabel}
          </Text>

          <Text
            style={[
              styles.guidance,
              { maxWidth: contentWidth },
            ]}
            allowFontScaling={false}
          >
            {guidanceLabel}
          </Text>
          <Text
            style={[
              styles.detailsHint,
              { maxWidth: contentWidth },
            ]}
            allowFontScaling={false}
          >
            {detailsHint}
          </Text>

          <TouchableOpacity
            style={[
              styles.acknowledgeButton,
              {
                backgroundColor: tone.accent,
                maxWidth: contentWidth,
              },
            ]}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={t('home_air_pulse.acknowledge')}
            activeOpacity={0.8}
          >
            <View style={styles.checkCircle}>
              <Text
                style={[styles.check, { color: tone.accent }]}
                allowFontScaling={false}
              >
                ✓
              </Text>
            </View>
            <Text style={styles.acknowledgeText} allowFontScaling={false}>
              {t('home_air_pulse.acknowledge')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 40,
    elevation: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  circle: {
    position: 'absolute',
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 18,
  },
  ambientBubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientBubbleTop: {
    width: 150,
    height: 150,
    top: -54,
    right: -22,
  },
  ambientBubbleBottom: {
    width: 190,
    height: 190,
    bottom: -94,
    left: -55,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  appLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF0E3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogo: {
    width: 37,
    height: 37,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    marginBottom: 7,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    flexShrink: 1,
    color: '#737373',
    fontFamily: 'MPLUSRounded1c-Bold',
    fontSize: 9,
    letterSpacing: 1.25,
  },
  status: {
    marginTop: 1,
    fontFamily: 'MPLUSRounded1c-ExtraBold',
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  guidance: {
    marginTop: 12,
    color: '#525252',
    fontFamily: 'MPLUSRounded1c-Medium',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  detailsHint: {
    marginTop: 8,
    color: '#8A8A8A',
    fontFamily: 'MPLUSRounded1c-Medium',
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },
  acknowledgeButton: {
    minWidth: 132,
    minHeight: 39,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
    elevation: 4,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    fontFamily: 'MPLUSRounded1c-ExtraBold',
    fontSize: 10,
    lineHeight: 13,
  },
  acknowledgeText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontFamily: 'MPLUSRounded1c-ExtraBold',
    fontSize: 12,
    textAlign: 'center',
  },
});
