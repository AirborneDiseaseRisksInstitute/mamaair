import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { spacing, radius } from '../../theme';
import { fs, ms } from '../../utils/responsive';

interface CheckboxProps {
  label: string;
  subtitle?: string;
  checked: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  backgroundColor?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  subtitle,
  checked,
  onPress,
  icon,
  backgroundColor,
}) => {
  const bgColor = backgroundColor || '#4285F4';
  const lightBlue = 'rgba(66, 133, 244, 0.1)';
  const darkBlue = bgColor;

  const boxBackgroundColor = checked ? darkBlue : lightBlue;
  const textColor = checked ? '#fff' : darkBlue;
  const iconColor = checked ? '#fff' : darkBlue;
  const borderColor = darkBlue;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.container}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: boxBackgroundColor,
            borderWidth: 1,
            borderColor: borderColor,
          },
        ]}
      >
        {/* Icon on the left */}
        {React.isValidElement<{ color?: string }>(icon) && (
          <View style={styles.iconContainer}>
            {React.cloneElement(icon, { color: iconColor })}
          </View>
        )}

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text
            style={[styles.label, { color: textColor }]}
            allowFontScaling={false}
          >
            {label}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: textColor, opacity: checked ? 0.9 : 0.8 },
              ]}
              allowFontScaling={false}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Checkbox circle on the right */}
        <View
          style={[
            styles.checkCircle,
            { borderColor: textColor },
            checked && styles.checkCircleChecked,
          ]}
        >
          {checked && (
            <FontAwesomeIcon icon={faCheck} size={ms(14)} color={darkBlue} />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing('md'),
    borderRadius: radius('md'),
    minHeight: ms(88),
  },
  iconContainer: {
    width: ms(32),
    alignItems: 'center',
    marginRight: spacing('sm'),
    marginTop: ms(3),
  },
  textContainer: {
    flex: 1,
    paddingRight: spacing('sm'),
  },
  label: {
    fontSize: fs(16),
    fontFamily: 'MPLUSRounded1c-Bold',
    lineHeight: fs(22),
    marginBottom: spacing('xs'),
  },
  subtitle: {
    fontSize: fs(14),
    fontFamily: 'MPLUSRounded1c-Regular',
    lineHeight: fs(21),
  },
  checkCircle: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0,
    marginTop: ms(3),
  },
  checkCircleChecked: {
    backgroundColor: '#fff',
  },
});
