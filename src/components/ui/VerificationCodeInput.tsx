import React, { useMemo, useRef } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useTheme, spacing, radius } from '../../theme';
import { ms, vs } from '../../utils/responsive';

interface VerificationCodeInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  error?: string | null;
  onComplete?: (value: string) => void;
}

const CODE_INPUT_HEIGHT = vs(58);

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChangeText,
  length = 4,
  error,
  onComplete,
}) => {
  const theme = useTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = value.slice(0, length).split('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
        },
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing('sm'),
        },
        input: {
          flex: 1,
          height: CODE_INPUT_HEIGHT,
          minWidth: ms(54),
          borderRadius: radius('md'),
          borderWidth: 1,
          borderColor: error ? '#FB2C36' : theme.colors.neutral300,
          backgroundColor: theme.colors.background,
          color: theme.colors.textPrimary,
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: 22,
          textAlign: 'center',
        },
        inputFilled: {
          borderColor: theme.colors.orange500,
        },
        errorText: {
          fontSize: 12,
          fontFamily: theme.typography.fontFamily.medium,
          color: '#FB2C36',
          marginTop: spacing('sm'),
          marginLeft: spacing('xs'),
        },
      }),
    [error, theme],
  );

  const updateValue = (nextDigits: string[]) => {
    const nextValue = nextDigits.join('').slice(0, length);
    onChangeText(nextValue);
    if (nextValue.length === length) {
      onComplete?.(nextValue);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    const numericText = text.replace(/\D/g, '');
    if (!numericText) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      updateValue(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    numericText
      .slice(0, length - index)
      .split('')
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    updateValue(nextDigits);

    const nextIndex = Math.min(index + numericText.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') return;
    if (digits[index]) return;
    inputRefs.current[index - 1]?.focus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {Array.from({ length }, (_, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[styles.input, digits[index] ? styles.inputFilled : null]}
            value={digits[index] ?? ''}
            onChangeText={(text) => handleChangeText(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus={index === 0}
            maxLength={length}
            returnKeyType={index === length - 1 ? 'done' : 'next'}
            selectTextOnFocus
            allowFontScaling={false}
            maxFontSizeMultiplier={1}
          />
        ))}
      </View>
      {error ? (
        <Text style={styles.errorText} allowFontScaling={false}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};
