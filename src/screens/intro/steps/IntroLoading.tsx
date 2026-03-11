import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useTheme } from '../../../theme';
import { fs } from '../../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IntroLoadingProps {
  onComplete?: () => void;
}

export const IntroLoading: React.FC<IntroLoadingProps> = ({ onComplete }) => {
  const theme = useTheme();
  
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const ring4 = useRef(new Animated.Value(0)).current;
  const ring5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      );
    };

    const animations = [
      createPulse(ring1, 0), createPulse(ring2, 400), createPulse(ring3, 800),
      createPulse(ring4, 1200), createPulse(ring5, 1600),
    ];
    animations.forEach(anim => anim.start());

    const timeoutId = setTimeout(() => { if (onComplete) onComplete(); }, 2500);
    return () => { animations.forEach(anim => anim.stop()); clearTimeout(timeoutId); };
  }, [onComplete, ring1, ring2, ring3, ring4, ring5]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FF6B3D', justifyContent: 'center', alignItems: 'center' },
    halosContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    halo: { position: 'absolute', backgroundColor: '#fff', borderRadius: SCREEN_WIDTH },
    textContainer: { zIndex: 10, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 24, fontFamily: theme.typography.fontFamily.medium, color: 'rgba(255, 255, 255, 0.95)', textAlign: 'center', lineHeight: 34 },
  });

  const maxRadius = SCREEN_WIDTH * 1.5;

  const renderRing = (anim: Animated.Value, index: number) => {
    const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
    const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.05, 0] });
    return (
      <Animated.View key={index} style={[styles.halo, { width: maxRadius, height: maxRadius, opacity, transform: [{ scale }] }]} />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.halosContainer}>
        {renderRing(ring5, 5)}{renderRing(ring4, 4)}{renderRing(ring3, 3)}{renderRing(ring2, 2)}{renderRing(ring1, 1)}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.loadingText} allowFontScaling={false}>Preparing{'\n'}your journey...</Text>
      </View>
    </View>
  );
};
