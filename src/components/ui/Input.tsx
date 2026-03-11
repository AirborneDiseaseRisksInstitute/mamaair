import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { 
  faEye, 
  faEyeSlash, 
  faCheckCircle, 
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';
import { useTheme, spacing, radius } from '../../theme';
import { ms, fs, vs } from '../../utils/responsive';

export interface InputRef {
  focus: () => void;
  blur: () => void;
}

interface InputProps extends Omit<TextInputProps, 'style'> {
  title: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'phone';
  nextInputRef?: React.RefObject<InputRef | null>;
  onSubmitEditing?: () => void;
}

const SHADOW_OFFSET = 4;
const INPUT_HEIGHT = vs(54);

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InputComponent = forwardRef<InputRef, InputProps>(({
  title,
  placeholder,
  type = 'text',
  value,
  onChangeText,
  nextInputRef,
  onSubmitEditing,
  ...textInputProps
}, ref) => {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState<'valid' | 'invalid' | null>(null);
  
  const isPassword = type === 'password';
  const isEmail = type === 'email';
  const inputRef = useRef<TextInput>(null);

  // Validate email when value changes
  useEffect(() => {
    if (isEmail && value) {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        setEmailValidation(EMAIL_REGEX.test(trimmedValue) ? 'valid' : 'invalid');
      } else {
        setEmailValidation(null);
      }
    } else if (isEmail && !value) {
      setEmailValidation(null);
    }
  }, [value, isEmail]);

  // Expose focus and blur methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
  }));

  // Handle submit (Enter key press)
  const handleSubmitEditing = () => {
    const nextInput = nextInputRef?.current;
    if (nextInput) {
      // Focus next input if available
      nextInput.focus();
    } else if (onSubmitEditing) {
      // Call custom onSubmitEditing if provided
      onSubmitEditing();
    } else {
      // Default: blur current input
      inputRef.current?.blur();
    }
  };

  // Map type to keyboardType and secureTextEntry
  const getInputProps = () => {
    switch (type) {
      case 'email':
        return {
          keyboardType: 'email-address' as const,
          autoCapitalize: 'none' as const,
          autoCorrect: false,
        };
      case 'password':
        return {
          secureTextEntry: !showPassword,
          autoCapitalize: 'none' as const,
          autoCorrect: false,
        };
      case 'number':
        return {
          keyboardType: 'numeric' as const,
        };
      case 'phone':
        return {
          keyboardType: 'phone-pad' as const,
        };
      default:
        return {};
    }
  };

  // Get border color based on validation state
  const getBorderColor = () => {
    if (isEmail && emailValidation === 'valid') {
      return theme.colors.orange500;
    }
    if (isEmail && emailValidation === 'invalid') {
      return '#FB2C36';
    }
    return theme.colors.neutral300;
  };

  // Get shadow color - same as border color
  const getShadowColor = () => {
    return getBorderColor();
  };

  // Check if should show validation icon
  const showValidationIcon = isEmail && emailValidation !== null;
  const showClearButton = isEmail && emailValidation === 'invalid' && value;

  // Handle clear button
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    setEmailValidation(null);
  };

  // Calculate padding right for input
  const getInputPaddingRight = () => {
    if (isPassword) {
      return spacing('xl');
    }
    if (showValidationIcon || showClearButton) {
      return spacing('md') + ms(24) + spacing('md');
    }
    return spacing('md');
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.textPrimary }]} allowFontScaling={false}>
        {title}
      </Text>

      {/* Input Container with Shadow */}
      <View style={styles.inputWrapper}>
        {/* Shadow Layer */}
        <View
          style={[
            styles.shadow,
            {
              height: INPUT_HEIGHT,
              borderRadius: radius('md'),
              backgroundColor: getShadowColor(),
              top: SHADOW_OFFSET,
              left: 0,
              right: 0,
            },
          ]}
        />

        {/* Input Field */}
        <View
          style={[
            styles.inputContainer,
            {
              height: INPUT_HEIGHT,
              backgroundColor: theme.colors.background,
              borderRadius: radius('md'),
              borderWidth: 1,
              borderColor: getBorderColor(),
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                color: theme.colors.textPrimary,
                paddingRight: getInputPaddingRight(),
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.neutral400}
            value={value}
            onChangeText={onChangeText}
            returnKeyType={nextInputRef ? 'next' : 'done'}
            onSubmitEditing={handleSubmitEditing}
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
            {...getInputProps()}
            {...textInputProps}
          />

          {/* Clear Button (for invalid email) */}
          {showClearButton && (
            <TouchableOpacity
              style={[styles.iconContainer, { paddingRight: spacing('md') }]}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={faTimesCircle as IconProp}
                size={ms(20)}
                color="#FB2C36"
              />
            </TouchableOpacity>
          )}

          {/* Validation Icon (CheckCircle for valid, TimesCircle for invalid) */}
          {showValidationIcon && !showClearButton && (
            <View style={[styles.iconContainer, { paddingRight: spacing('md') }]}>
              <FontAwesomeIcon
                icon={(emailValidation === 'valid' ? faCheckCircle : faTimesCircle) as IconProp}
                size={ms(20)}
                color={emailValidation === 'valid' ? theme.colors.orange500 : '#FB2C36'}
              />
            </View>
          )}

          {/* Password Toggle Icon */}
          {isPassword && (
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <FontAwesomeIcon
                icon={(showPassword ? faEyeSlash : faEye) as IconProp}
                size={ms(18)}
                color={theme.colors.neutral600}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error Message */}
      {isEmail && emailValidation === 'invalid' && value && (
        <Text style={styles.errorText} allowFontScaling={false}>
          Invalid email address. Please enter a valid email.
        </Text>
      )}
    </View>
  );
});

InputComponent.displayName = 'Input';

export const Input = InputComponent;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing('md'),
  },
  title: {
    fontSize: 14,
    fontFamily: 'MPLUSRounded1c-Bold',
    marginBottom: spacing('sm'),
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  shadow: {
    position: 'absolute',
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing('md'),
    // Keep vertical padding modest and let the outer container control height
    paddingVertical: spacing('sm'),
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'MPLUSRounded1c-Regular',
  },
  iconContainer: {
    paddingLeft: spacing('xs'),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: ms(32),
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'MPLUSRounded1c-Medium',
    color: '#FB2C36',
    marginTop: spacing('xs'),
    marginLeft: spacing('sm'),
  },
});
