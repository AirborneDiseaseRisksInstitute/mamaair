import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing, radius } from '../../theme';
import { ms, fs, vs } from '../../utils/responsive';

interface DropdownProps {
  label: string;
  value: string | null;
  onPress: () => void;
}

const SHADOW_OFFSET = 4;
const DROPDOWN_HEIGHT = vs(50);

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  onPress,
}) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(1)).current;

  const borderColor = value ? theme.colors.selectedOption : theme.colors.neutral200;
  const shadowColor = value ? theme.colors.selectedOption : theme.colors.neutral200;
  const textColor = value ? theme.colors.selectedOption : theme.colors.textPrimary;

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
            height: DROPDOWN_HEIGHT,
          },
        ]}
      />
      
      {/* Dropdown Container */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.colors.background,
              borderColor,
              transform: [{ translateY }],
              height: DROPDOWN_HEIGHT,
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
            {value || label}
          </Text>
          
          {/* Chevron Icon */}
          <View style={styles.iconContainer}>
            <FontAwesomeIcon
              icon={faChevronDown}
              size={ms(16)}
              color={textColor}
            />
          </View>
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius('md'),
    borderWidth: 1,
    paddingHorizontal: spacing('md'),
  },
  label: {
    fontSize: 16,
    fontFamily: 'MPLUSRounded1c-Regular',
    flex: 1,
  },
  iconContainer: {
    marginLeft: spacing('sm'),
  },
});
