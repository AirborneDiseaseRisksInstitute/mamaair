import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing } from '../../../theme';
import { Button, FixedButtonContainer, OrangeHalo, BackButton, ProgressBar, RadioOption, IntroTitleBox } from '../../../components/ui';
import { ENGLISH_FLAG_SVG, FRENCH_FLAG_SVG, YORUBA_FLAG_SVG, SWAHILI_FLAG_SVG, ARABIC_FLAG_SVG } from '../../../utils/svgIcons';
import { useUserStore } from '../../../store/useUserStore';
import { fs, FIXED_BUTTON_AREA_HEIGHT, HEADER_CLEARANCE } from '../../../utils/responsive';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface IntroStep04Props { onNext?: () => void; onBack?: () => void; }
type Language = 'english' | 'french' | 'yoruba' | 'swahili' | 'arabic';

const LANGUAGES: Array<{ id: Language; label: string; iconSvg: string }> = [
  { id: 'english', label: 'English', iconSvg: ENGLISH_FLAG_SVG },
  { id: 'french', label: 'French', iconSvg: FRENCH_FLAG_SVG },
  { id: 'yoruba', label: 'Yoruba', iconSvg: YORUBA_FLAG_SVG },
  { id: 'swahili', label: 'Swahili', iconSvg: SWAHILI_FLAG_SVG },
  { id: 'arabic', label: 'Arabic', iconSvg: ARABIC_FLAG_SVG },
];

export const IntroStep04: React.FC<IntroStep04Props> = ({ onNext, onBack }) => {
  const theme = useTheme();
  const { setLanguage, profile } = useUserStore();
  const [selectedLanguage, setSelectedLanguageLocal] = useState<Language | null>(profile.language as Language || null);
  const [titleBoxCenterY, setTitleBoxCenterY] = useState<number>(SCREEN_HEIGHT * 0.3);

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
          <IntroTitleBox title="Let's set your language." onLayout={setTitleBoxCenterY} />
          <Text style={styles.pickLanguageText} allowFontScaling={false}>Pick your language</Text>
          <View style={styles.optionsContainer}>
            {LANGUAGES.map((language) => (
              <RadioOption key={language.id} iconSvg={language.iconSvg} label={language.label} selected={selectedLanguage === language.id} onPress={() => setSelectedLanguageLocal(language.id)} />
            ))}
          </View>
        </View>
      </ScrollView>
      <FixedButtonContainer>
        <Button title="CONTINUE" onPress={() => { if (selectedLanguage) { setLanguage(selectedLanguage); onNext?.(); } }} disabled={!selectedLanguage} />
      </FixedButtonContainer>
    </SafeAreaView>
  );
};
