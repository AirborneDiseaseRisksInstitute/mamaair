import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme, spacing, radius } from '../../theme';
import { ms, vs } from '../../utils/responsive';

interface RadioOptionProps {
  iconSvg?: string; // SVG string content (optional)
  iconEmoji?: string; // Emoji string (optional, used if iconSvg is not provided)
  label: string;
  selected: boolean;
  onPress: () => void;
}

const SHADOW_OFFSET = 4;
const OPTION_HEIGHT = vs(50);

export const RadioOption: React.FC<RadioOptionProps> = ({
  iconSvg,
  iconEmoji,
  label,
  selected,
  onPress,
}) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(1)).current;

  const borderColor = selected ? theme.colors.selectedOption : theme.colors.neutral200;
  const shadowColor = selected ? theme.colors.selectedOption : theme.colors.neutral200;
  const textColor = selected ? theme.colors.selectedOption : theme.colors.textPrimary;
  const textFontFamily = selected ? theme.typography.fontFamily.bold : theme.typography.fontFamily.regular;

  const handlePressIn = () => {
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

  return (
    <View style={styles.container}>
      {/* Shadow Layer */}
      <Animated.View
        style={[
          styles.shadow,
          {
            backgroundColor: shadowColor,
            top: SHADOW_OFFSET,
            opacity: shadowOpacity,
            height: OPTION_HEIGHT,
          },
        ]}
      />
      
      {/* Option Container */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.background,
              borderColor,
              transform: [{ translateY }],
              height: OPTION_HEIGHT,
            },
          ]}
        >
          {/* Icon */}
          {iconSvg && (
            <View style={styles.iconContainer}>
              <SvgXml xml={iconSvg} width={ms(32)} height={ms(24)} />
            </View>
          )}
          {!iconSvg && iconEmoji && (
            <View style={styles.iconContainer}>
              <Text style={styles.emojiText} allowFontScaling={false}>{iconEmoji}</Text>
            </View>
          )}
          
          {/* Label */}
          <Text
            style={[
              styles.label,
              {
                color: textColor,
                fontFamily: textFontFamily,
              },
            ]}
           allowFontScaling={false}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    marginBottom: spacing('md'),
  },
  pressable: {
    width: '100%',
    zIndex: 1,
  },
  shadow: {
    position: 'absolute',
    borderRadius: radius('md'),
    left: 0,
    right: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius('md'),
    borderWidth: 1,
    paddingHorizontal: spacing('md'),
  },
  iconContainer: {
    width: ms(32),
    height: ms(32),
    marginRight: spacing('md'),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  emojiText: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
});
