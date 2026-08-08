import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../../../theme';
import { INTRO_PLAN_LOADING_DURATION_MS } from '../../../config/introPlanLoading';

interface IntroLoadingProps {
  onComplete?: () => void;
}

export const IntroLoading: React.FC<IntroLoadingProps> = ({ onComplete }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: INTRO_PLAN_LOADING_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();

    const timeoutId = setTimeout(() => {
      onCompleteRef.current?.();
    }, INTRO_PLAN_LOADING_DURATION_MS);

    return () => {
      animation.stop();
      clearTimeout(timeoutId);
    };
  }, [progress]);

  const imageWidth = Math.min(
    width - spacing('xl') * 2,
    520,
  );
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#FFFFFF',
        },
        content: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing('lg'),
          paddingTop: spacing('lg'),
        },
        hintImage: {
          width: imageWidth,
          height: imageWidth / 1.5,
          aspectRatio: 1.5,
        },
        hintText: {
          maxWidth: 360,
          marginTop: spacing('sm'),
          color: '#4F4A47',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 15,
          lineHeight: 23,
          textAlign: 'center',
        },
        loadingArea: {
          paddingHorizontal: spacing('lg'),
          paddingBottom: Math.max(
            insets.bottom,
            spacing('lg'),
          ) + spacing('md'),
        },
        loadingCard: {
          minHeight: 82,
          justifyContent: 'center',
          paddingHorizontal: spacing('md'),
          paddingVertical: spacing('sm'),
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#F0E9E4',
          backgroundColor: '#FFFFFF',
          shadowColor: '#8C4A22',
          shadowOffset: { width: 0, height: 7 },
          shadowOpacity: 0.09,
          shadowRadius: 18,
          elevation: 4,
        },
        loadingText: {
          marginBottom: spacing('xs'),
          color: '#6F6864',
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 13,
          lineHeight: 18,
          textAlign: 'center',
        },
        progressTrack: {
          height: 9,
          overflow: 'hidden',
          borderRadius: 999,
          backgroundColor: '#F7E8DD',
        },
        progressFill: {
          height: '100%',
          overflow: 'hidden',
          borderRadius: 999,
        },
        progressGradient: {
          flex: 1,
        },
      }),
    [imageWidth, insets.bottom, theme],
  );

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/images/mamaHint.png')}
          resizeMode="contain"
          style={styles.hintImage}
        />
        <Text style={styles.hintText}>
          {t('intro.plan_loading_hint')}
        </Text>
      </View>

      <View style={styles.loadingArea}>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={t('common.preparing_journey')}
          style={styles.loadingCard}
        >
          <Text style={styles.loadingText}>
            {t('intro.plan_loading_progress')}
          </Text>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            >
              <LinearGradient
                colors={['#FFB15A', '#FF7A22', '#FF5A1F']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};
