import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../../theme';

interface TransitionLoaderProps {
  visible: boolean;
  message?: string;
}

const RING_SIZE = 64;
const RING_THICKNESS = 4;
const PULSE_SIZE = 22;

export const TransitionLoader: React.FC<TransitionLoaderProps> = ({ visible, message }) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulseOpacity1 = useRef(new Animated.Value(0)).current;
  const pulseOpacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    if (visible) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      const createPulse = (
        scaleAnim: Animated.Value,
        opacityAnim: Animated.Value,
        delay: number,
      ) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0.55,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 1400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 1400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(200),
          ]),
        );

      createPulse(pulse1, pulseOpacity1, 0).start();
      createPulse(pulse2, pulseOpacity2, 700).start();
    } else {
      rotateAnim.stopAnimation();
      pulse1.stopAnimation();
      pulse2.stopAnimation();
    }
  }, [visible, fadeAnim, rotateAnim, pulse1, pulse2, pulseOpacity1, pulseOpacity2]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] });
  const pulseScale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.center}>
          {/* Pulsing rings */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale1 }],
                opacity: pulseOpacity1,
                backgroundColor: '#FF6900',
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseScale2 }],
                opacity: pulseOpacity2,
                backgroundColor: '#FF6900',
              },
            ]}
          />

          {/* Rotating arc */}
          <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />

          {/* Center dot */}
          <View style={[styles.dot, { backgroundColor: '#FF6900' }]} />
        </View>

        {message ? (
          <Text
            style={[
              styles.message,
              {
                fontFamily: theme.typography.fontFamily.medium,
                color: theme.colors.textSecondary,
              },
            ]}
            allowFontScaling={false}
          >
            {message}
          </Text>
        ) : null}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: 'transparent',
    borderTopColor: '#FF6900',
    borderRightColor: 'rgba(255,105,0,0.25)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  message: {
    marginTop: 28,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
