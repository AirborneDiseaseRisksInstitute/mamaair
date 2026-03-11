import React, { useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  Pressable,
  View,
} from 'react-native';
import { useTheme, radius } from '../../theme';
import { mvs } from '../../utils/responsive';
import { responsiveUtils } from '../../utils/responsiveUtils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const SHADOW_OFFSET = 4;
const BASE_BUTTON_HEIGHT = 58;
const BASE_FONT_SIZE = 16;

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
}) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(1)).current;

  const buttonHeight = Math.round(mvs(BASE_BUTTON_HEIGHT));
  const fontSize = responsiveUtils.getFixedFontSize(BASE_FONT_SIZE);

  const handlePressIn = () => {
    if (disabled) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHADOW_OFFSET,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  const backgroundColor = disabled
    ? theme.colors.neutral200
    : theme.colors.orange500;

  const shadowColor = disabled
    ? theme.colors.neutral600
    : theme.colors.orange900;

  const textColor = disabled ? theme.colors.neutral700 : '#FFFFFF';

  return (
    <View style={styles.container}>
      {/* Shadow Layer - positioned below button, same width as button */}
      {!disabled && (
        <Animated.View
          style={[
            styles.shadow,
            {
              height: buttonHeight,
              borderRadius: radius('md'),
              backgroundColor: shadowColor,
              opacity: shadowOpacity,
              top: SHADOW_OFFSET,
              left: 0,
              right: 0,
            },
          ]}
        />
      )}
      {disabled && (
        <View
          style={[
            styles.shadow,
            {
              height: buttonHeight,
              borderRadius: radius('md'),
              backgroundColor: shadowColor,
              top: SHADOW_OFFSET,
              left: 0,
              right: 0,
            },
          ]}
        />
      )}

      {/* Button */}
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.button,
            {
              height: buttonHeight,
              backgroundColor,
              borderRadius: radius('md'),
              transform: [{ translateY }],
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                fontFamily: theme.typography.fontFamily.extraBold,
                fontSize,
                color: textColor,
              },
            ]}
           allowFontScaling={false}>
            {title}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  pressable: {
    width: '100%',
    zIndex: 1,
  },
  shadow: {
    position: 'absolute',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
});
