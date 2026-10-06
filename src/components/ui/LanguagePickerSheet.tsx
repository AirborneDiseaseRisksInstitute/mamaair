import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from './BottomSheet';
import { useTheme, spacing } from '../../theme';
import { ENGLISH_FLAG_SVG, FRENCH_FLAG_SVG, SWAHILI_FLAG_SVG } from '../../utils/svgIcons';

interface LanguagePickerSheetProps {
  visible: boolean;
  selectedLanguage: string | null;
  onConfirm: (language: string) => void;
  onClose: () => void;
}

const LANGUAGES = [
  { value: 'en', nativeLabel: 'English', flagSvg: ENGLISH_FLAG_SVG },
  { value: 'fr', nativeLabel: 'Français', flagSvg: FRENCH_FLAG_SVG },
  { value: 'sw', nativeLabel: 'Kiswahili', flagSvg: SWAHILI_FLAG_SVG },
];

export const LanguagePickerSheet: React.FC<LanguagePickerSheetProps> = ({
  visible,
  selectedLanguage,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const styles = StyleSheet.create({
    title: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing('lg'),
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing('md'),
      paddingHorizontal: spacing('md'),
      borderRadius: 12,
      marginBottom: spacing('sm'),
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionSelected: {
      borderColor: theme.colors.orange500,
      backgroundColor: theme.colors.orange50,
    },
    flag: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: 'hidden',
      marginRight: spacing('md'),
    },
    optionLabel: {
      flex: 1,
      fontSize: 16,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textPrimary,
    },
    optionLabelSelected: {
      color: theme.colors.orange500,
    },
    dot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.neutral300,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dotSelected: {
      borderColor: theme.colors.orange500,
    },
    dotInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.orange500,
    },
  });

  const handleSelect = (language: string) => {
    onConfirm(language);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title} allowFontScaling={false}>
        {t('lang_picker.title')}
      </Text>

      {LANGUAGES.map((lang) => {
        const isSelected = selectedLanguage === lang.value;
        return (
          <TouchableOpacity
            key={lang.value}
            accessibilityRole="button"
            testID={`language-picker-${lang.value}`}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => handleSelect(lang.value)}
            activeOpacity={0.7}
          >
            <View style={styles.flag}>
              <SvgXml xml={lang.flagSvg} width={36} height={36} />
            </View>
            <Text
              style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
              allowFontScaling={false}
            >
              {lang.nativeLabel}
            </Text>
            <View style={[styles.dot, isSelected && styles.dotSelected]}>
              {isSelected && <View style={styles.dotInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </BottomSheet>
  );
};
