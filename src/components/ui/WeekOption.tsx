import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme, spacing, radius } from '../../theme';
import { fs } from '../../utils/responsive';

interface WeekOptionProps {
  week: number;
  selected: boolean;
  onPress: () => void;
}

const SHADOW_OFFSET = 4;

export const WeekOption: React.FC<WeekOptionProps> = ({
  week,
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
          },
        ]}
      />
      
      {/* Square Option Container */}
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
            },
          ]}
        >
          {/* Week Number - Centered */}
          <Text
            style={[
              styles.weekText,
              {
                color: textColor,
                fontFamily: textFontFamily,
              },
            ]}
           allowFontScaling={false}>
            {week}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    margin: spacing('xs'),
  },
  pressable: {
    width: '100%',
    aspectRatio: 1,
    zIndex: 1,
  },
  shadow: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius('md'),
    left: 0,
    right: 0,
  },
  option: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius('md'),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
