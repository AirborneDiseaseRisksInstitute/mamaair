import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme, spacing, radius } from '../../theme';
import { ms, fs, vs } from '../../utils/responsive';

interface BottomSheetOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const SHADOW_OFFSET = 4;
const OPTION_HEIGHT = vs(50);

export const BottomSheetOption: React.FC<BottomSheetOptionProps> = ({
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
              minHeight: OPTION_HEIGHT,
            },
          ]}
        >
          {/* Label */}
          <Text
            style={[
              styles.label,
              {
                color: textColor,
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
    paddingVertical: spacing('md'),
  },
  label: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Regular',
    flex: 1,
    lineHeight: 22,
  },
});
