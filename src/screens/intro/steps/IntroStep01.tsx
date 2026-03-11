import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Animated, SafeAreaView, ScrollView } from 'react-native';
import Svg, { Defs, Path, LinearGradient, Stop } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo } from '../../../components/ui';
import { BUBBLE2_SVG } from '../../../utils/svgIcons';
import { s, vs, ms, fs, FIXED_BUTTON_AREA_HEIGHT } from '../../../utils/responsive';


interface IntroStep01Props {
  onNext?: () => void;
  skipAnimation?: boolean;
}

export const IntroStep01: React.FC<IntroStep01Props> = ({ onNext, skipAnimation = false }) => {
  const theme = useTheme();

  const bubble1FullText = "Hi mama, I`m here to guide you through hot and pollution threats";
  const bubble2FullText = "Each week is a level of your baby's journey.";

  const scale1Image = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const scale1Bubble = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const scale2Image = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const scale2Bubble = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const buttonScale = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;

  const bubble1Text = bubble1FullText;
  const bubble2Text = bubble2FullText;

  const bubblePath = "M0.00277913 46.7151C-0.366775 3.48447 35.9885 0.780277 42.708 0.64906C43.8405 0.628827 44.9605 0.608817 46.093 0.588584C58.0177 0.118704 113.247 -1.59386 153.32 4.39019C214.913 12.2231 200.684 85.9427 187.248 99.0691C183.797 102.481 177.949 104.886 170.302 106.63C173.388 115.218 185.936 117.931 185.936 117.931C167.334 118.732 157.818 111.733 154.913 109.038C132.71 111.288 102.622 110.363 71.7394 108.681C19.6008 105.839 14.7181 104.508 10.6659 100.337C6.61369 96.1658 0.41336 94.3559 0.00277913 46.7151Z";

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1 },

    logoContainer: { alignItems: 'center', paddingTop: vs(10) },
    logo: { width: s(140), height: vs(48), resizeMode: 'contain' },

    section: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      paddingHorizontal: s(24),
      marginTop: vs(24),
    },

    sectionBottom: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      paddingHorizontal: s(24),
      marginTop: vs(-50),
      paddingBottom: FIXED_BUTTON_AREA_HEIGHT + vs(10),
    },

    bubbleWrapper: { 
      width: '55%',
      position: 'relative',
      marginRight: 'auto',
      overflow: 'visible',
    },
    bubbleWrapper2: {
      width: '55%',
      position: 'relative',
      marginRight: 'auto',
      marginLeft: s(64),
      overflow: 'visible',
    },
    bubble2Wrapper: {
      paddingTop: vs(8),
      paddingLeft: s(10),
      paddingRight: s(20),
      paddingBottom: vs(14),
      overflow: 'visible',
    },
    imageCircleBottom: {
      marginTop: vs(-12),
      marginLeft: s(16),
    },
    bubbleContainer: {
      width: '100%',
      position: 'relative',
      minHeight: ms(80),
    },
    bubble2Container: {
      width: '100%',
      position: 'relative',
      overflow: 'visible',
      minHeight: ms(100),
    },
    bubbleSvg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    bubble2Svg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'visible',
    },
    bubbleTextContainer: {
      paddingTop: ms(14),
      paddingBottom: ms(22),
      paddingLeft: ms(16),
      paddingRight: ms(16),
      justifyContent: 'center',
    },
    bubble2TextContainer: {
      paddingTop: ms(20),
      paddingBottom: ms(40),
      paddingLeft: ms(36),
      paddingRight: ms(20),
      justifyContent: 'center',
    },
    bubbleText: {
      fontSize: 14,
      fontFamily: theme.typography.fontFamily.medium,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },

    imageCircle: {
      width: vs(150),
      height: vs(150),
      backgroundColor: '#fff',
      borderRadius: 999,
      overflow: 'hidden',
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 10,
    },

    image: { width: '100%', height: '100%', resizeMode: 'contain' },
  }), [theme]);

  useEffect(() => {
    if (skipAnimation) return;

    // Animate bubble 1 and image 1 together
    Animated.parallel([
      Animated.timing(scale1Image, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(scale1Bubble, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      // Animate bubble 2 and image 2 together
      Animated.parallel([
        Animated.timing(scale2Image, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(scale2Bubble, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start(() => {
        // Show button
        Animated.timing(buttonScale, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    });
  }, [skipAnimation, scale1Image, scale1Bubble, scale2Image, scale2Bubble, buttonScale]);

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo position="topLeft" gradientId="halo1" />
      <OrangeHalo position="bottomRight" gradientId="halo2" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../../../assets/images/logoBlack.png')} style={styles.logo} />
        </View>

        {/* Chat section 1 */}
        <View style={styles.section}>
          <Animated.View style={[styles.bubbleWrapper, { transform: [{ scale: scale1Bubble }] }]}>
            <View style={styles.bubbleContainer}>
              <Svg width="100%" height="100%" viewBox="0 0 199 118" preserveAspectRatio="none" style={styles.bubbleSvg}>
                <Defs>
                  <LinearGradient id="bubble1_gradient" x1="114.121" y1="-4.79197" x2="91.5583" y2="111.655" gradientUnits="userSpaceOnUse">
                    <Stop offset="0%" stopColor="white" />
                    <Stop offset="36%" stopColor="#FCFCFC" />
                    <Stop offset="65%" stopColor="#F2F2F2" />
                    <Stop offset="91%" stopColor="#E1E1E1" />
                    <Stop offset="100%" stopColor="#D9D9D9" />
                  </LinearGradient>
                </Defs>
                <Path d={bubblePath} fill="url(#bubble1_gradient)" />
              </Svg>
              <View style={styles.bubbleTextContainer}>
                <Text style={styles.bubbleText} allowFontScaling={false}>
                  {bubble1Text}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.imageCircle, { transform: [{ scale: scale1Image }] }]}>
            <Image source={require('../../../assets/images/mamaholdbaby.png')} style={styles.image} />
          </Animated.View>
        </View>

        {/* Chat section 2 */}
        <View style={styles.sectionBottom}>
          <Animated.View style={[styles.bubbleWrapper2, { transform: [{ scale: scale2Bubble }] }]}>
            <View style={styles.bubble2Wrapper}>
              <View style={styles.bubble2Container}>
                <SvgXml xml={BUBBLE2_SVG.replace('<svg ', '<svg preserveAspectRatio="none" ')} width="100%" height="100%" style={styles.bubble2Svg} />
                <View style={styles.bubble2TextContainer}>
                  <Text style={styles.bubbleText} allowFontScaling={false}>
                    {bubble2Text}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.imageCircle, styles.imageCircleBottom, { transform: [{ scale: scale2Image }] }]}>
            <Image source={require('../../../assets/images/babyIntro.png')} style={styles.image} />
          </Animated.View>
        </View>
      </ScrollView>

      {/* Fixed button at bottom */}
      <FixedButtonContainer>
        <Animated.View style={{ transform: [{ scale: buttonScale }], opacity: buttonScale }}>
          <Button title="Start" onPress={onNext || (() => {})} />
        </Animated.View>
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
