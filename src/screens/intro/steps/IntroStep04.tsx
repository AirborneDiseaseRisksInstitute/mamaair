import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox, LanguagePickerSheet } from '../../../components/ui';
import { ENGLISH_FLAG_SVG, FRENCH_FLAG_SVG, SWAHILI_FLAG_SVG } from '../../../utils/svgIcons';
import { useUserStore } from '../../../store/useUserStore';
import { useMetaChoices } from '../../../hooks/useMetaChoices';
import { useTranslation } from 'react-i18next';
import { fs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep04Props { onNext?: () => void; onBack?: () => void; }

const LANGUAGE_FLAG_MAP: Record<string, string | undefined> = {
  en: ENGLISH_FLAG_SVG,
  fr: FRENCH_FLAG_SVG,
  sw: SWAHILI_FLAG_SVG,
};

export const IntroStep04: React.FC<IntroStep04Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setLanguage, profile } = useUserStore();
  const { languages } = useMetaChoices();
  const [selectedLanguage, setSelectedLanguageLocal] = useState<string | null>(profile.language || null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);
  const [showLangSheet, setShowLangSheet] = useState(true);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, paddingBottom: FIXED_BUTTON_AREA_HEIGHT },
    contentWrapper: { paddingHorizontal: spacing('md'), paddingTop: HEADER_CLEARANCE },
    pickLanguageText: { fontSize: 18, fontFamily: theme.typography.fontFamily.medium, color: theme.colors.textPrimary, marginBottom: spacing('lg'), textAlign: 'left' },
    optionsContainer: { width: '100%' },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <OrangeHalo cx={SCREEN_WIDTH / 2} cy={titleBoxCenterY} radius={SCREEN_WIDTH * 0.6} />
      <BackButton onPress={onBack} />
      <ProgressBar progress={0.286} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <IntroTitleBox title={t('intro.step04_title')} onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLanguageText} allowFontScaling={false}>{t('intro.step04_pick')}</Text>
          <View style={styles.optionsContainer}>
            {languages.map((lang) => (
              <RadioOption
                key={lang.value}
                iconSvg={LANGUAGE_FLAG_MAP[lang.value]}
                label={lang.label}
                selected={selectedLanguage === lang.value}
                onPress={() => setSelectedLanguageLocal(lang.value)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <Button
          title={t('common.continue')}
          onPress={() => { if (selectedLanguage) { setLanguage(selectedLanguage); onNext?.(); } }}
          disabled={!selectedLanguage}
        />
      </FixedButtonContainer>

      <LanguagePickerSheet
        visible={showLangSheet}
        selectedLanguage={selectedLanguage}
        onConfirm={(lang) => {
          setSelectedLanguageLocal(lang);
          setLanguage(lang);
          setShowLangSheet(false);
        }}
        onClose={() => setShowLangSheet(false)}
      />
    </SafeAreaView>
  );
};
